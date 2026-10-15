
import secrets

from django.contrib.auth.models import User
from django.db import transaction

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from pacientes.models import Paciente
from cuidadores.models import Cuidador

from .serializers import CadastroUsuarioSerializer


# ======================================================
# CADASTRO DO FAMILIAR
# ======================================================

class CadastroUsuarioView(generics.CreateAPIView):
    serializer_class = CadastroUsuarioSerializer
    permission_classes = [AllowAny]


# ======================================================
# AUTENTICAÇÃO EXCLUSIVA DO FAMILIAR
# ======================================================

class TokenFamiliarSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        dados = super().validate(attrs)

        usuario = self.user

        if not Cuidador.objects.filter(
            usuario=usuario
        ).exists():
            raise ValidationError(
                "Esta conta não possui cadastro de familiar."
            )

        if Paciente.objects.filter(
            usuario=usuario
        ).exists():
            raise ValidationError(
                "Esta conta também possui perfil de paciente. "
                "É necessário corrigir o cadastro antes "
                "de realizar o vínculo."
            )

        return dados


class LoginFamiliarView(TokenObtainPairView):
    serializer_class = TokenFamiliarSerializer
    permission_classes = [AllowAny]


# ======================================================
# ATIVAÇÃO AUTOMÁTICA DO IDOSO
# ======================================================

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
        status=status.HTTP_201_CREATED,
    )
