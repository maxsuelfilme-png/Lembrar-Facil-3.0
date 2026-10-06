from rest_framework import serializers
from .models import Cuidador, VinculoCuidadorPaciente


class CuidadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuidador
        fields = [
            'id',
            'nome',
            'telefone',
            'criado_em',
        ]
        read_only_fields = ['id', 'criado_em']


class VinculoCuidadorPacienteSerializer(serializers.ModelSerializer):
    paciente_nome = serializers.CharField(
        source='paciente.nome',
        read_only=True
    )

    class Meta:
        model = VinculoCuidadorPaciente
        fields = [
            'id',
            'paciente',
            'paciente_nome',
            'ativo',
            'criado_em',
        ]
        read_only_fields = ['id', 'criado_em']