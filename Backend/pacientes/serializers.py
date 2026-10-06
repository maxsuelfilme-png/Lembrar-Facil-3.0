from rest_framework import serializers
from .models import Paciente


class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = [
            'id',
            'nome',
            'data_nascimento',
            'telefone',
            'contato_emergencia',
            'telefone_emergencia',
            'criado_em',
            'atualizado_em',
        ]

        read_only_fields = [
            'id',
            'criado_em',
            'atualizado_em',
        ]