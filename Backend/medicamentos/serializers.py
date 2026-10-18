
from rest_framework import serializers

from .models import Medicamento
from .estoque import calcular_estoque_medicamento


class MedicamentoSerializer(serializers.ModelSerializer):

    estoque = serializers.SerializerMethodField()

    class Meta:
        model = Medicamento

        fields = [
            "id",
            "nome",
            "dose",
            "horario",
            "frequencia",
            "quantidade",
            "duracao",
            "observacao",
            "ativo",
            "criado_em",
            "estoque_inicial",
            "consumo_por_dose",
            "unidade_estoque",
            "estoque_iniciado_em",
            "estoque",
        ]

        read_only_fields = [
            "id",
            "criado_em",
            "estoque_iniciado_em",
            "estoque",
        ]

    def get_estoque(self, obj):
        return calcular_estoque_medicamento(obj)

    def validate_estoque_inicial(self, valor):
        if valor is not None and valor < 0:
            raise serializers.ValidationError(
                "O estoque inicial não pode ser negativo."
            )
        return valor

    def validate_consumo_por_dose(self, valor):
        if valor is not None and valor <= 0:
            raise serializers.ValidationError(
                "O consumo por dose deve ser maior que zero."
            )
        return valor

    def validate(self, dados):
        dados = super().validate(dados)

        estoque = dados.get(
            "estoque_inicial",
            getattr(self.instance, "estoque_inicial", None),
        )

        consumo = dados.get(
            "consumo_por_dose",
            getattr(self.instance, "consumo_por_dose", None),
        )

        if (estoque is None) != (consumo is None):
            raise serializers.ValidationError({
                "estoque_inicial": (
                    "Informe o estoque inicial e o consumo "
                    "por dose para ativar o controle."
                )
            })

        return dados
