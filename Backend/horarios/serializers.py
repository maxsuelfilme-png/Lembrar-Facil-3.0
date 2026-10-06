from rest_framework import serializers
from .models import HorarioMedicamento


class HorarioMedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioMedicamento
        fields = [
            'id',
            'medicamento',
            'horario',
            'ativo',
            'criado_em',
        ]

        read_only_fields = [
            'id',
            'criado_em',
        ]