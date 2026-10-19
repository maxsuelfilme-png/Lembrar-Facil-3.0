
from rest_framework import generics, viewsets, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import (
    PermissionDenied,
    AuthenticationFailed,
)

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from pacientes.models import Paciente
from cuidadores.models import Cuidador

from .models import Farmacia, ProdutoFarmacia
from .serializers import (
    FarmaciaSerializer,
    ProdutoFarmaciaSerializer,
    CadastroFarmaciaSerializer,
)


# ======================================================
# 1. CADASTRO DA FARMÁCIA
# ======================================================

class CadastroFarmaciaView(generics.CreateAPIView):
    serializer_class = CadastroFarmaciaSerializer
    permission_classes = [AllowAny]


# ======================================================
# 2. LOGIN EXCLUSIVO DA FARMÁCIA
# ======================================================

class TokenFarmaciaSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        dados = super().validate(attrs)

        usuario = self.user

        if not Farmacia.objects.filter(
            usuario=usuario
        ).exists():
            raise AuthenticationFailed(
                "Esta conta não possui cadastro de farmácia."
            )

        if (
            Paciente.objects.filter(usuario=usuario).exists()
            or Cuidador.objects.filter(usuario=usuario).exists()
        ):
            raise AuthenticationFailed(
                "Esta conta possui outro tipo de perfil. "
                "Utilize uma conta exclusiva de farmácia."
            )

        return dados


class LoginFarmaciaView(TokenObtainPairView):
    serializer_class = TokenFarmaciaSerializer
    permission_classes = [AllowAny]


# ======================================================
# 3. PERFIL DA FARMÁCIA
# ======================================================

class MinhaFarmaciaView(generics.RetrieveUpdateAPIView):
    serializer_class = FarmaciaSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            farmacia = Farmacia.objects.get(
                usuario=self.request.user
            )
        except Farmacia.DoesNotExist:
            raise PermissionDenied(
                "Este usuário não possui farmácia cadastrada."
            )

        if not farmacia.ativa or not farmacia.parceira:
            raise PermissionDenied(
                "Farmácia aguardando aprovação."
            )

        return farmacia


# ======================================================
# 4. GERENCIAMENTO DE PRODUTOS
# ======================================================

class ProdutoFarmaciaViewSet(viewsets.ModelViewSet):
    serializer_class = ProdutoFarmaciaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProdutoFarmacia.objects.filter(
            farmacia__usuario=self.request.user,
            farmacia__ativa=True,
            farmacia__parceira=True,
        )

    def perform_create(self, serializer):
        try:
            farmacia = Farmacia.objects.get(
                usuario=self.request.user
            )
        except Farmacia.DoesNotExist:
            raise PermissionDenied(
                "Este usuário não possui farmácia cadastrada."
            )

        if not farmacia.ativa or not farmacia.parceira:
            raise PermissionDenied(
                "Farmácia aguardando aprovação."
            )

        serializer.save(farmacia=farmacia)


# ======================================================
# 5. SERIALIZER DO CATÁLOGO DE PRODUTOS
# ======================================================

class CatalogoProdutoSerializer(serializers.ModelSerializer):

    farmacia_nome = serializers.CharField(
        source="farmacia.nome",
        read_only=True
    )

    farmacia_cidade = serializers.CharField(
        source="farmacia.cidade",
        read_only=True
    )

    farmacia_estado = serializers.CharField(
        source="farmacia.estado",
        read_only=True
    )

    farmacia_endereco = serializers.CharField(
        source="farmacia.endereco",
        read_only=True
    )

    farmacia_telefone = serializers.CharField(
        source="farmacia.telefone",
        read_only=True
    )

    farmacia_whatsapp = serializers.CharField(
        source="farmacia.whatsapp",
        read_only=True
    )

    farmacia_faz_entrega = serializers.BooleanField(
        source="farmacia.faz_entrega",
        read_only=True
    )

    farmacia_horario_funcionamento = serializers.CharField(
        source="farmacia.horario_funcionamento",
        read_only=True
    )

    farmacia_taxa_entrega = serializers.DecimalField(
        source="farmacia.taxa_entrega",
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ProdutoFarmacia

        fields = [
            "id",
            "nome",
            "descricao",
            "preco",
            "quantidade_estoque",
            "farmacia_nome",
            "farmacia_cidade",
            "farmacia_estado",
            "farmacia_endereco",
            "farmacia_telefone",
            "farmacia_whatsapp",
            "farmacia_faz_entrega",
            "farmacia_horario_funcionamento",
            "farmacia_taxa_entrega",
        ]


# ======================================================
# 6. CATÁLOGO PÚBLICO DAS FARMÁCIAS
# ======================================================

class CatalogoFarmaciasView(generics.ListAPIView):
    serializer_class = CatalogoProdutoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = ProdutoFarmacia.objects.filter(
            farmacia__ativa=True,
            farmacia__parceira=True,
            disponivel=True,
            quantidade_estoque__gt=0,
        ).select_related("farmacia").order_by("nome")

        busca = self.request.query_params.get(
            "busca", ""
        ).strip()

        if busca:
            queryset = queryset.filter(
                nome__icontains=busca
            )

        return queryset


# ======================================================
# 7. SERIALIZER DO MAPA DE FARMÁCIAS
# ======================================================

class FarmaciasMapaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Farmacia

        fields = [
            "id",
            "nome",
            "endereco",
            "cidade",
            "estado",
            "cep",
            "latitude",
            "longitude",
            "faz_entrega",
            "telefone",
            "whatsapp",
        ]


# ======================================================
# 8. MAPA DE FARMÁCIAS PARCEIRAS
# ======================================================

class FarmaciasMapaView(generics.ListAPIView):
    serializer_class = FarmaciasMapaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Farmacia.objects.filter(
            ativa=True,
            parceira=True,
            latitude__isnull=False,
            longitude__isnull=False,
        ).order_by("nome")
