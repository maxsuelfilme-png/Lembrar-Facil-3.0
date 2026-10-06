from rest_framework import serializers
from .models import Medicamento


class MedicamentoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Medicamento
        fields = [
            'id',
            'nome',
            'dose',
            'horario',
            'frequencia',
            'quantidade',
            'duracao',
            'observacao',
            'ativo',
            'criado_em',
        ]

        read_only_fields = [
            'id',
            'criado_em',
        ]