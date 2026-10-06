from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Cuidador, VinculoCuidadorPaciente
from .serializers import (
    CuidadorSerializer,
    VinculoCuidadorPacienteSerializer,
)


class MeuPerfilCuidadorView(generics.RetrieveUpdateAPIView):
    serializer_class = CuidadorSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        cuidador, criado = Cuidador.objects.get_or_create(
            usuario=self.request.user,
            defaults={
                'nome': self.request.user.get_full_name()
                or self.request.user.username
            }
        )
        return cuidador


class VinculoCuidadorPacienteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VinculoCuidadorPacienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VinculoCuidadorPaciente.objects.filter(
            cuidador__usuario=self.request.user,
            ativo=True
        ).select_related('paciente')