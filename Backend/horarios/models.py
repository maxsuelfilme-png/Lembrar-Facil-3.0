from django.db import models
from medicamentos.models import Medicamento


class HorarioMedicamento(models.Model):
    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name='horarios'
    )

    horario = models.TimeField()
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['horario']

    def __str__(self):
        return f'{self.medicamento.nome} - {self.horario}'