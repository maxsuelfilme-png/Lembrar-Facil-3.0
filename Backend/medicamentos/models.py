
from django.db import models
from django.contrib.auth.models import User


# ======================================================
# MODELO DE MEDICAMENTOS
# ======================================================

class Medicamento(models.Model):

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="medicamentos",
    )

    nome = models.CharField(max_length=100)

    dose = models.CharField(max_length=50)

    horario = models.TimeField()

    frequencia = models.CharField(
        max_length=100,
        blank=True,
    )

    quantidade = models.CharField(
        max_length=50,
        blank=True,
    )

    duracao = models.CharField(
        max_length=50,
        blank=True,
    )

    observacao = models.TextField(
        blank=True,
    )

    ativo = models.BooleanField(
        default=True,
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
    )

    # ==================================================
    # CONTROLE DE ESTOQUE
    # ==================================================

    estoque_inicial = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    consumo_por_dose = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    unidade_estoque = models.CharField(
        max_length=20,
        default="comprimido",
    )

    estoque_iniciado_em = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.nome


# ======================================================
# NOTIFICACOES DE ESTOQUE VIA WHATSAPP
# ======================================================

class NotificacaoEstoqueWhatsApp(models.Model):

    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("processando", "Processando"),
        ("aceita", "Aceita pela Meta"),
        ("falhou", "Falhou"),
        ("entregue", "Entregue"),
    ]

    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name="notificacoes_estoque",
    )

    telefone = models.CharField(
        max_length=20,
    )

    # Identifica o periodo de estoque.
    # Uma reposicao futura deve iniciar um novo ciclo.
    ciclo_estoque = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pendente",
    )

    tentativas = models.PositiveIntegerField(
        default=0,
    )

    enviada_em = models.DateTimeField(
        null=True,
        blank=True,
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
    )

    atualizado_em = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "medicamento",
                    "telefone",
                    "ciclo_estoque",
                ],
                name="alerta_unico_por_ciclo_estoque",
            )
        ]

    def __str__(self):
        return (
            f"{self.medicamento.nome} - "
            f"{self.telefone} - "
            f"{self.status}"
        )
