
from rest_framework import serializers
from .models import Cuidador, VinculoCuidadorPaciente


class CuidadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuidador
        fields = [
            "id",
            "nome",
            "telefone",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "criado_em",
        ]


class VinculoCuidadorPacienteSerializer(serializers.ModelSerializer):
    paciente_nome = serializers.SerializerMethodField()

    class Meta:
        model = VinculoCuidadorPaciente
        fields = [
            "id",
            "paciente",
            "paciente_nome",
            "ativo",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "paciente_nome",
            "criado_em",
        ]

    def get_paciente_nome(self, obj):
        paciente = obj.paciente
        nome = (paciente.nome or "").strip()

        if nome and nome.lower() != "paciente":
            return nome

        usuario = paciente.usuario
        nome_completo = usuario.get_full_name().strip()

        if nome_completo:
            return nome_completo

        return usuario.username
