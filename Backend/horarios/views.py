
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import HorarioMedicamento
from .serializers import HorarioMedicamentoSerializer


class HorarioMedicamentoViewSet(viewsets.ModelViewSet):

    serializer_class = HorarioMedicamentoSerializer
    permission_classes = [IsAuthenticated]

    # ======================================================
    # LISTAR HORÁRIOS DO USUÁRIO
    # ======================================================

    def get_queryset(self):
        return HorarioMedicamento.objects.filter(
            medicamento__usuario=self.request.user
        ).order_by("horario")

    # ======================================================
    # VALIDAR MEDICAMENTO
    # ======================================================

    def validar_medicamento(self, medicamento):
        if medicamento.usuario_id != self.request.user.id:
            raise PermissionDenied(
                "Você não tem autorização para modificar "
                "os horários deste medicamento."
            )

    # ======================================================
    # CRIAR HORÁRIO
    # ======================================================

    def perform_create(self, serializer):
        medicamento = serializer.validated_data["medicamento"]

        self.validar_medicamento(medicamento)

        serializer.save()

    # ======================================================
    # ATUALIZAR HORÁRIO
    # ======================================================

    def perform_update(self, serializer):
        horario_atual = serializer.instance

        self.validar_medicamento(
            horario_atual.medicamento
        )

        medicamento = serializer.validated_data.get(
            "medicamento",
            horario_atual.medicamento
        )

        self.validar_medicamento(medicamento)

        serializer.save()
