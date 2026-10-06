from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Paciente
from .serializers import PacienteSerializer


class MeuPerfilPacienteView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        paciente, criado = Paciente.objects.get_or_create(
            usuario=self.request.user,
            defaults={
                'nome': self.request.user.get_full_name()
                or self.request.user.username
            }
        )

        return paciente