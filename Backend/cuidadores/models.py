from django.db import models
from django.contrib.auth.models import User
from pacientes.models import Paciente


class Cuidador(models.Model):
    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='cuidador'
    )

    nome = models.CharField(max_length=150)
    telefone = models.CharField(max_length=20, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome


class VinculoCuidadorPaciente(models.Model):
    cuidador = models.ForeignKey(
        Cuidador,
        on_delete=models.CASCADE,
        related_name='vinculos'
    )

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='cuidadores'
    )

    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['cuidador', 'paciente'],
                name='vinculo_unico_cuidador_paciente'
            )
        ]

    def __str__(self):
        return f'{self.cuidador.nome} → {self.paciente.nome}'