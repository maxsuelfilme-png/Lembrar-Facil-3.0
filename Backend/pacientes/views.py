
from django.core.cache import cache

from rest_framework import generics, serializers, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Paciente
from .serializers import PacienteSerializer

from cuidadores.models import VinculoCuidadorPaciente
from whatsapp import enviar_sos_whatsapp, normalizar_telefone


# ======================================================
# OBTER PACIENTE
# ======================================================

def obter_paciente(usuario):
    paciente, criado = Paciente.objects.get_or_create(
        usuario=usuario,
        defaults={
            "nome": (
                usuario.get_full_name()
                or usuario.username
            )
        },
    )
    return paciente


# ======================================================
# PERFIL DO PACIENTE
# ======================================================

class MeuPerfilPacienteView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return obter_paciente(self.request.user)


# ======================================================
# CONTATO DE EMERGÊNCIA
# ======================================================

class ContatoFamiliarSerializer(serializers.ModelSerializer):
    nome = serializers.CharField(
        source="contato_emergencia",
        max_length=150,
    )

    telefone = serializers.CharField(
        source="telefone_emergencia",
        max_length=20,
    )

    class Meta:
        model = Paciente
        fields = ["nome", "telefone"]

    def validate_telefone(self, value):
        numero = normalizar_telefone(value)

        if not numero:
            raise serializers.ValidationError(
                "Informe um telefone brasileiro válido com DDD."
            )

        return numero


class MeuContatoFamiliarView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = ContatoFamiliarSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = [
        "get",
        "patch",
        "head",
        "options",
    ]

    def get_object(self):
        return obter_paciente(self.request.user)


# ======================================================
# LOCALIZAR WHATSAPP DO FAMILIAR
# ======================================================

def buscar_telefone_familiar(paciente):

    # Primeiro: familiar vinculado ao paciente.
    vinculos = (
        VinculoCuidadorPaciente.objects
        .filter(
            paciente=paciente,
            ativo=True,
        )
        .select_related("cuidador")
        .order_by("criado_em", "id")
    )

    for vinculo in vinculos:
        telefone = normalizar_telefone(
            vinculo.cuidador.telefone
        )

        if telefone:
            return telefone

    # Segundo: contato de emergência do paciente.
    telefone = normalizar_telefone(
        paciente.telefone_emergencia
    )

    if telefone:
        return telefone

    return None


# ======================================================
# ENVIAR ALERTA SOS
# ======================================================

class EnviarSOSView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "options"]

    def post(self, request):

        # Exige um paciente associado à conta.
        paciente = Paciente.objects.filter(
            usuario=request.user
        ).first()

        if paciente is None:
            return Response(
                {
                    "detail": (
                        "A sessão atual não possui "
                        "um paciente cadastrado."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Procura o WhatsApp do familiar.
        telefone = buscar_telefone_familiar(paciente)

        if not telefone:
            return Response(
                {
                    "detail": (
                        "Nenhum WhatsApp de familiar foi "
                        "encontrado para este paciente. "
                        "Cadastre um contato de emergência "
                        "ou vincule um familiar."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Evita solicitações repetidas em sequência.
        chave = f"lembrafacil:sos:{request.user.pk}"

        if not cache.add(
            chave,
            "processando",
            timeout=60,
        ):
            return Response(
                {
                    "detail": (
                        "Um pedido SOS foi iniciado "
                        "recentemente. Aguarde um minuto "
                        "para tentar novamente."
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            enviado = enviar_sos_whatsapp(
                paciente.nome,
                telefone,
            )

        except Exception:
            cache.delete(chave)

            return Response(
                {
                    "detail": (
                        "Não foi possível solicitar "
                        "o alerta SOS."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not enviado:
            cache.delete(chave)

            return Response(
                {
                    "detail": (
                        "A Meta não aceitou o envio "
                        "do SOS. Verifique o template "
                        "e o destinatário."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "detail": (
                    "Pedido SOS aceito pela Meta. "
                    "A entrega ao familiar ainda "
                    "não foi confirmada."
                )
            },
            status=status.HTTP_200_OK,
        )
