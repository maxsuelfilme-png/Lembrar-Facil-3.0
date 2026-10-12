
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import Farmacia, ProdutoFarmacia


class FarmaciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmacia
        fields = [
            "id",
            "nome",
            "cnpj",
            "telefone",
            "whatsapp",
            "endereco",
            "cidade",
            "estado",
            "cep",
            "latitude",
            "longitude",
            "horario_funcionamento",
            "faz_entrega",
            "taxa_entrega",
            "parceira",
            "ativa",
        ]
        read_only_fields = [
            "id",
            "cnpj",
            "parceira",
            "ativa",
        ]


class ProdutoFarmaciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProdutoFarmacia
        fields = [
            "id",
            "farmacia",
            "nome",
            "descricao",
            "preco",
            "quantidade_estoque",
            "disponivel",
        ]
        read_only_fields = ["id", "farmacia"]


class CadastroFarmaciaSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        write_only=True,
        max_length=150,
    )

    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = Farmacia
        fields = [
            "id",
            "username",
            "password",
            "nome",
            "cnpj",
            "telefone",
            "whatsapp",
            "endereco",
            "cidade",
            "estado",
            "cep",
            "horario_funcionamento",
            "faz_entrega",
            "taxa_entrega",
        ]
        read_only_fields = ["id"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Este nome de usuário já está cadastrado."
            )
        return value

    def validate_cnpj(self, value):
        cnpj = "".join(
            caractere for caractere in value
            if caractere.isdigit()
        )

        if len(cnpj) != 14 or len(set(cnpj)) == 1:
            raise serializers.ValidationError(
                "CNPJ inválido."
            )

        def calcular_digito(numeros, pesos):
            soma = sum(
                int(numero) * peso
                for numero, peso in zip(numeros, pesos)
            )
            resto = soma % 11
            return "0" if resto < 2 else str(11 - resto)

        primeiro = calcular_digito(
            cnpj[:12],
            [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
        )

        segundo = calcular_digito(
            cnpj[:12] + primeiro,
            [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
        )

        if cnpj[-2:] != primeiro + segundo:
            raise serializers.ValidationError(
                "CNPJ inválido."
            )

        if Farmacia.objects.filter(cnpj=cnpj).exists():
            raise serializers.ValidationError(
                "Este CNPJ já está cadastrado."
            )

        return cnpj

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        username = validated_data.pop("username")
        password = validated_data.pop("password")

        usuario = User.objects.create_user(
            username=username,
            password=password,
        )

        farmacia = Farmacia.objects.create(
            usuario=usuario,
            parceira=False,
            ativa=False,
            **validated_data,
        )

        return farmacia
