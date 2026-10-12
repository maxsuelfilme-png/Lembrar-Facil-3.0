
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache

from rest_framework import generics, serializers, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Paciente
from .serializers import PacienteSerializer
from whatsapp import enviar_sos_whatsapp, normalizar_telefone


def obter_paciente(usuario):
    paciente, criado = Paciente.objects.get_or_create(
        usuario=usuario,
        defaults={
            "nome": usuario.get_full_name()
            or usuario.username
        }
    )
    return paciente


class MeuPerfilPacienteView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return obter_paciente(self.request.user)


class ContatoFamiliarSerializer(serializers.ModelSerializer):
    nome = serializers.CharField(
        source="contato_emergencia",
        max_length=150
    )

    telefone = serializers.CharField(
        source="telefone_emergencia",
        max_length=20
    )

    class Meta:
        model = Paciente
        fields = ["nome", "telefone"]

    def validate_telefone(self, value):
        numero = "".join(c for c in value if c.isdigit())

        if len(numero) not in (10, 11, 12, 13):
            raise serializers.ValidationError(
                "Informe um telefone válido com DDD."
            )

        if len(numero) in (10, 11):
            numero = "55" + numero

        if not numero.startswith("55"):
            raise serializers.ValidationError(
                "Informe um telefone brasileiro válido."
            )

        return numero


class MeuContatoFamiliarView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = ContatoFamiliarSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return obter_paciente(self.request.user)


class EnviarSOSView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "options"]

    def post(self, request):
        paciente = obter_paciente(request.user)

        telefone = normalizar_telefone(
            paciente.telefone_emergencia
        )

        if not telefone:
            return Response(
                {
                    "detail": (
                        "Cadastre o WhatsApp do familiar "
                        "antes de utilizar o SOS."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        chave = f"lembrafacil:sos:{request.user.pk}"

        if not cache.add(chave, "processando", timeout=60):
            return Response(
                {
                    "detail": (
                        "Um pedido SOS foi iniciado recentemente. "
                        "Aguarde um minuto para tentar novamente."
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            enviado = enviar_sos_whatsapp(
                paciente.nome,
                telefone
            )
        except Exception:
            cache.delete(chave)
            return Response(
                {
                    "detail": (
                        "Não foi possível solicitar o alerta SOS."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        if not enviado:
            cache.delete(chave)
            return Response(
                {
                    "detail": (
                        "A Meta não aceitou o envio do SOS. "
                        "Verifique o template e o destinatário."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        return Response(
            {
                "detail": (
                    "Pedido SOS aceito pela Meta. "
                    "A entrega ao familiar ainda não foi confirmada."
                )
            },
            status=status.HTTP_200_OK
        )
