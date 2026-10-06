from rest_framework import serializers
from .models import ConfirmacaoDose


class ConfirmacaoDoseSerializer(serializers.ModelSerializer):
    medicamento_nome = serializers.CharField(
        source='medicamento.nome',
        read_only=True
    )

    medicamento_dose = serializers.CharField(
        source='medicamento.dose',
        read_only=True
    )

    class Meta:
        model = ConfirmacaoDose
        fields = [
            'id',
            'medicamento',
            'medicamento_nome',
            'medicamento_dose',
            'horario',
            'data',
            'horario_previsto',
            'status',
            'confirmado_em',
            'criado_em',
            'atualizado_em',
        ]

        read_only_fields = [
            'id',
            'confirmado_em',
            'criado_em',
            'atualizado_em',
        ]