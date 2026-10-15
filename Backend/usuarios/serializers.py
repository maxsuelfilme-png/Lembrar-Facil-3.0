
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from cuidadores.models import Cuidador


class CadastroUsuarioSerializer(serializers.ModelSerializer):
    nome = serializers.CharField(
        write_only=True,
        max_length=300
    )

    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = ["username", "nome", "password"]

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        nome = validated_data.pop("nome").strip()
        password = validated_data.pop("password")

        partes_nome = nome.split(None, 1)

        first_name = partes_nome[0]
        last_name = (
            partes_nome[1]
            if len(partes_nome) > 1
            else ""
        )

        usuario = User.objects.create_user(
            username=validated_data["username"],
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        Cuidador.objects.create(
            usuario=usuario,
            nome=nome,
        )

        return usuario
