from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import HorarioMedicamento
from .serializers import HorarioMedicamentoSerializer


class HorarioMedicamentoViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioMedicamentoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HorarioMedicamento.objects.filter(
            medicamento__usuario=self.request.user
        ).order_by('horario')

    def perform_create(self, serializer):
        medicamento = serializer.validated_data['medicamento']

        if medicamento.usuario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                'Você não pode adicionar horários a este medicamento.'
            )

        serializer.save()