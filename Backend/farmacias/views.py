
from rest_framework import generics, viewsets, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Farmacia, ProdutoFarmacia
from .serializers import (
    FarmaciaSerializer,
    ProdutoFarmaciaSerializer,
    CadastroFarmaciaSerializer,
)


class CadastroFarmaciaView(generics.CreateAPIView):
    serializer_class = CadastroFarmaciaSerializer
    permission_classes = [AllowAny]


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

    farmacia_faz_entrega = serializers.BooleanField(
        source="farmacia.faz_entrega",
        read_only=True
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
            "farmacia_faz_entrega",
        ]


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
