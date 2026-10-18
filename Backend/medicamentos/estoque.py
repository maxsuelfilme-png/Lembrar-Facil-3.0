
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone

from confirmacoes.models import ConfirmacaoDose


LIMITE_ALERTA_DIAS = Decimal("5")


def calcular_estoque_medicamento(medicamento):
    estoque_inicial = medicamento.estoque_inicial
    consumo_por_dose = medicamento.consumo_por_dose
    inicio = medicamento.estoque_iniciado_em

    resultado_vazio = {
        "configurado": False,
        "estoque_restante": None,
        "doses_restantes": None,
        "dias_restantes": None,
        "alerta_estoque": False,
    }

    if (
        estoque_inicial is None
        or consumo_por_dose is None
        or inicio is None
        or consumo_por_dose <= 0
    ):
        return resultado_vazio

    confirmacoes = ConfirmacaoDose.objects.filter(
        medicamento=medicamento,
        status="tomado",
    ).filter(
        Q(confirmado_em__gte=inicio)
        | Q(
            confirmado_em__isnull=True,
            data__gte=timezone.localtime(inicio).date(),
        )
    )

    doses_tomadas = confirmacoes.count()

    consumo_total = (
        Decimal(doses_tomadas) * consumo_por_dose
    )

    estoque_restante = max(
        Decimal("0"),
        estoque_inicial - consumo_total,
    )

    doses_restantes = (
        estoque_restante / consumo_por_dose
    )

    horarios_ativos = medicamento.horarios.filter(
        ativo=True
    ).count()

    # Por segurança, não estimar autonomia sem horários.
    if horarios_ativos <= 0:
        dias_restantes = None
        alerta_estoque = False
    else:
        # Esta estimativa só é válida para uso diário.
        frequencia = medicamento.frequencia.strip().lower()

        frequencias_diarias = {
            "diário",
            "diaria",
            "diária",
            "diario",
            "todos os dias",
            "1 vez ao dia",
            "2 vezes ao dia",
            "3 vezes ao dia",
        }

        if frequencia not in frequencias_diarias:
            dias_restantes = None
            alerta_estoque = False
        else:
            dias_restantes_decimal = (
                doses_restantes / Decimal(horarios_ativos)
            )

            dias_restantes = round(
                float(dias_restantes_decimal),
                1,
            )

            alerta_estoque = (
                dias_restantes_decimal <= LIMITE_ALERTA_DIAS
            )

    return {
        "configurado": True,
        "estoque_restante": float(estoque_restante),
        "doses_restantes": float(doses_restantes),
        "dias_restantes": dias_restantes,
        "alerta_estoque": alerta_estoque,
    }
