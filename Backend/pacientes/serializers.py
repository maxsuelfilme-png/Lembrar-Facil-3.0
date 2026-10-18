
from rest_framework import serializers
from .models import Paciente


class PacienteSerializer(serializers.ModelSerializer):

    nome = serializers.CharField(
        max_length=150,
        required=True,
        allow_blank=False,
        trim_whitespace=True
    )

    class Meta:
        model = Paciente

        fields = [
            "id",
            "nome",
            "data_nascimento",
            "telefone",
            "contato_emergencia",
            "telefone_emergencia",
            "criado_em",
            "atualizado_em",
        ]

        read_only_fields = [
            "id",
            "criado_em",
            "atualizado_em",
        ]

    def validate_nome(self, value):
        nome = " ".join(value.split())

        if nome.lower() == "paciente":
            raise serializers.ValidationError(
                "Informe o nome verdadeiro do idoso."
            )

        return nome
