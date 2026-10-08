
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated

from .models import Paciente
from .serializers import PacienteSerializer


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
