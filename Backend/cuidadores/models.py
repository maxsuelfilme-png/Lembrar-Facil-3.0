
import secrets

from datetime import timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

from pacientes.models import Paciente


# ======================================================
# PERFIL DO CUIDADOR / FAMILIAR
# ======================================================

class Cuidador(models.Model):
    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="cuidador",
    )

    nome = models.CharField(max_length=150)

    telefone = models.CharField(
        max_length=20,
        blank=True,
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.nome


# ======================================================
# VÍNCULO ENTRE FAMILIAR E PACIENTE
# ======================================================

class VinculoCuidadorPaciente(models.Model):
    cuidador = models.ForeignKey(
        Cuidador,
        on_delete=models.CASCADE,
        related_name="vinculos",
    )

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name="cuidadores",
    )

    ativo = models.BooleanField(default=True)

    criado_em = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cuidador", "paciente"],
                name="vinculo_unico_cuidador_paciente",
            )
        ]

    def __str__(self):
        return (
            f"{self.cuidador.nome} → "
            f"{self.paciente.nome}"
        )


# ======================================================
# CÓDIGO TEMPORÁRIO DE VINCULAÇÃO
# ======================================================

def gerar_codigo_seguro():
    return secrets.token_hex(8).upper()


def validade_codigo():
    return timezone.now() + timedelta(minutes=10)


class CodigoVinculo(models.Model):
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name="codigos_vinculo",
    )

    codigo = models.CharField(
        max_length=16,
        unique=True,
        default=gerar_codigo_seguro,
        editable=False,
    )

    criado_em = models.DateTimeField(
        auto_now_add=True,
    )

    expira_em = models.DateTimeField(
        default=validade_codigo,
    )

    utilizado = models.BooleanField(
        default=False,
    )

    class Meta:
        ordering = ["-criado_em"]

    @property
    def esta_valido(self):
        return (
            not self.utilizado
            and timezone.now() < self.expira_em
        )

    def __str__(self):
        return (
            f"Código do paciente "
            f"{self.paciente_id}"
        )
