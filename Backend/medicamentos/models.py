
from django.db import models
from django.contrib.auth.models import User


# ==========================================================
# MEDICAMENTOS DO IDOSO
# ==========================================================

class Medicamento(models.Model):

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="medicamentos"
    )

    # ======================================================
    # DADOS DO MEDICAMENTO
    # ======================================================

    nome = models.CharField(
        max_length=100
    )

    dose = models.CharField(
        max_length=50
    )

    horario = models.TimeField()

    frequencia = models.CharField(
        max_length=100,
        blank=True
    )

    quantidade = models.CharField(
        max_length=50,
        blank=True
    )

    duracao = models.CharField(
        max_length=50,
        blank=True
    )

    observacao = models.TextField(
        blank=True
    )

    ativo = models.BooleanField(
        default=True
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    # ======================================================
    # CONTROLE DE ESTOQUE
    # ======================================================

    estoque_inicial = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Quantidade inicial disponível no estoque."
    )

    consumo_por_dose = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Quantidade consumida em cada dose."
    )

    unidade_estoque = models.CharField(
        max_length=20,
        default="comprimido",
        help_text="Exemplo: comprimido, mL ou cápsula."
    )

    estoque_iniciado_em = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Início do acompanhamento do estoque."
    )

    # ======================================================
    # REPRESENTAÇÃO
    # ======================================================

    def __str__(self):
        return self.nome
