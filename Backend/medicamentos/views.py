
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import Medicamento
from .serializers import MedicamentoSerializer

from horarios.models import HorarioMedicamento
from pacientes.models import Paciente
from cuidadores.models import VinculoCuidadorPaciente


class MedicamentoViewSet(viewsets.ModelViewSet):
    serializer_class = MedicamentoSerializer
    permission_classes = [IsAuthenticated]

    def pacientes_autorizados(self):
        """
        Retorna os IDs dos usuários dos pacientes
        vinculados ao cuidador autenticado.
        """
        return VinculoCuidadorPaciente.objects.filter(
            cuidador__usuario=self.request.user,
            ativo=True
        ).values_list("paciente__usuario_id", flat=True)

    def get_queryset(self):
        usuario = self.request.user

        return Medicamento.objects.filter(
            Q(usuario=usuario)
            | Q(usuario_id__in=self.pacientes_autorizados())
        ).distinct().order_by("-id")

    def obter_usuario_destino(self):
        usuario = self.request.user

        paciente_id = self.request.data.get("paciente_id")

        # Cadastro do próprio paciente.
        if paciente_id in (None, ""):
            if Paciente.objects.filter(
                usuario=usuario
            ).exists():
                return usuario

            raise PermissionDenied(
                "Informe um paciente autorizado para cadastrar o medicamento."
            )

        # Cadastro pelo familiar para um paciente vinculado.
        paciente = Paciente.objects.filter(
            id=paciente_id
        ).first()

        if not paciente:
            raise PermissionDenied(
                "Paciente não encontrado ou não autorizado."
            )

        if paciente.usuario_id == usuario.id:
            return usuario

        autorizado = VinculoCuidadorPaciente.objects.filter(
            cuidador__usuario=usuario,
            paciente=paciente,
            ativo=True
        ).exists()

        if not autorizado:
            raise PermissionDenied(
                "Você não possui autorização para cadastrar medicamentos deste paciente."
            )

        return paciente.usuario

    def perform_create(self, serializer):
        usuario_destino = self.obter_usuario_destino()

        medicamento = serializer.save(
            usuario=usuario_destino
        )

        HorarioMedicamento.objects.create(
            medicamento=medicamento,
            horario=medicamento.horario,
            ativo=True
        )

    def perform_update(self, serializer):
        medicamento = serializer.save()

        horario_existente = HorarioMedicamento.objects.filter(
            medicamento=medicamento
        ).order_by("id").first()

        if horario_existente:
            horario_existente.horario = medicamento.horario
            horario_existente.ativo = True
            horario_existente.save(
                update_fields=["horario", "ativo"]
            )
        else:
            HorarioMedicamento.objects.create(
                medicamento=medicamento,
                horario=medicamento.horario,
                ativo=True
            )

    def perform_destroy(self, instance):
        HorarioMedicamento.objects.filter(
            medicamento=instance
        ).delete()

        instance.delete()
