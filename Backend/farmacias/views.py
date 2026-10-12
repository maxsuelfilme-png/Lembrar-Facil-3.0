
from rest_framework import generics, viewsets
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
