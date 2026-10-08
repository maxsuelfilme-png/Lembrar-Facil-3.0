
from django.db import models
from django.contrib.auth.models import User

from medicamentos.models import Medicamento
from horarios.models import HorarioMedicamento


# ==========================================================
# CONFIRMAÇÃO DOS MEDICAMENTOS
# ==========================================================

class ConfirmacaoDose(models.Model):

    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("tomado", "Tomado"),
        ("atrasado", "Atrasado"),
        ("nao_tomado", "Não tomado"),
    ]

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="confirmacoes"
    )

    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name="confirmacoes"
    )

    horario = models.ForeignKey(
        HorarioMedicamento,
        on_delete=models.CASCADE,
        related_name="confirmacoes",
        null=True,
        blank=True
    )

    horario_previsto = models.TimeField(
        null=True,
        blank=True
    )

    data = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pendente"
    )

    confirmado_em = models.DateTimeField(
        null=True,
        blank=True
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    atualizado_em = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = [
            "-data",
            "horario_previsto"
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "usuario",
                    "medicamento",
                    "horario_previsto",
                    "data"
                ],
                name="dose_unica_por_medicamento_data"
            )
        ]

    def __str__(self):
        return (
            f"{self.medicamento.nome} - "
            f"{self.data} - "
            f"{self.status}"
        )


# ==========================================================
# NOTIFICAÇÕES AUTOMÁTICAS DO WHATSAPP
# ==========================================================

class NotificacaoWhatsApp(models.Model):

    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("processando", "Processando"),
        ("aceita", "Aceita pela Meta"),
        ("falhou", "Falhou"),
        ("entregue", "Entregue"),
    ]

    confirmacao = models.ForeignKey(
        ConfirmacaoDose,
        on_delete=models.CASCADE,
        related_name="notificacoes_whatsapp"
    )

    telefone = models.CharField(
        max_length=20
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pendente"
    )

    tentativas = models.PositiveIntegerField(
        default=0
    )

    enviada_em = models.DateTimeField(
        null=True,
        blank=True
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    atualizado_em = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = [
            "-criado_em"
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "confirmacao",
                    "telefone"
                ],
                name="notificacao_unica_por_dose_telefone"
            )
        ]

    def __str__(self):
        return (
            f"{self.confirmacao.medicamento.nome} - "
            f"{self.telefone} - "
            f"{self.status}"
        )
