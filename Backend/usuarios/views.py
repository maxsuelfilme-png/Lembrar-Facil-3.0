
import secrets

from django.contrib.auth.models import User
from django.db import transaction

from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from pacientes.models import Paciente
from .serializers import CadastroUsuarioSerializer


# Cadastro tradicional do usuário/familiar
class CadastroUsuarioView(generics.CreateAPIView):
    serializer_class = CadastroUsuarioSerializer
    permission_classes = [AllowAny]


# Ativação inicial do idoso
@api_view(["POST"])
@permission_classes([AllowAny])
def ativar_paciente(request):
    with transaction.atomic():
        while True:
            username = "paciente_" + secrets.token_hex(12)

            if not User.objects.filter(
                username=username
            ).exists():
                break

        # Conta com senha aleatória, sem senha utilizável
        # pelo login tradicional.
        usuario = User(username=username)
        usuario.set_unusable_password()
        usuario.save()

        paciente = Paciente.objects.create(
            usuario=usuario,
            nome="Paciente"
        )

        refresh = RefreshToken.for_user(usuario)

    return Response(
        {
            "paciente_id": paciente.id,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        status=status.HTTP_201_CREATED
    )
