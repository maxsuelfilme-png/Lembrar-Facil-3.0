from django.db import models
from django.contrib.auth.models import User


class Paciente(models.Model):
    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='paciente'
    )

    nome = models.CharField(max_length=150)

    data_nascimento = models.DateField(
        null=True,
        blank=True
    )

    telefone = models.CharField(
        max_length=20,
        blank=True
    )

    contato_emergencia = models.CharField(
        max_length=150,
        blank=True
    )

    telefone_emergencia = models.CharField(
        max_length=20,
        blank=True
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome