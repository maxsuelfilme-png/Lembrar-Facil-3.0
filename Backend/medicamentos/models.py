from django.db import models
from django.contrib.auth.models import User


class Medicamento(models.Model):
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='medicamentos'
    )

    nome = models.CharField(max_length=100)
    dose = models.CharField(max_length=50)
    horario = models.TimeField()
    frequencia = models.CharField(max_length=100, blank=True)
    quantidade = models.CharField(max_length=50, blank=True)
    duracao = models.CharField(max_length=50, blank=True)
    observacao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome