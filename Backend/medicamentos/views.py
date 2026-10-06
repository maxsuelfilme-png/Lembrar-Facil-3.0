from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Medicamento
from .serializers import MedicamentoSerializer
from horarios.models import HorarioMedicamento


class MedicamentoViewSet(viewsets.ModelViewSet):
    serializer_class = MedicamentoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Medicamento.objects.filter(
            usuario=self.request.user
        ).order_by("-id")

    def perform_create(self, serializer):
        medicamento = serializer.save(
            usuario=self.request.user
        )

        HorarioMedicamento.objects.create(
            medicamento=medicamento,
            horario=medicamento.horario,
            ativo=True
        )

    def perform_update(self, serializer):
        medicamento = serializer.save()

        HorarioMedicamento.objects.update_or_create(
            medicamento=medicamento,
            defaults={
                "horario": medicamento.horario,
                "ativo": True
            }
        )

    def perform_destroy(self, instance):
        HorarioMedicamento.objects.filter(
            medicamento=instance
        ).delete()

        instance.delete()