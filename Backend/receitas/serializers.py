from rest_framework import serializers
from .models import Receita


class ReceitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receita
        fields = [
            'id',
            'imagem',
            'texto_ocr',
            'medico',
            'observacao',
            'criada_em',
            'atualizada_em',
        ]

        read_only_fields = [
            'id',
            'criada_em',
            'atualizada_em',
        ]