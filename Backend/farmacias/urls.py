
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CadastroFarmaciaView,
    MinhaFarmaciaView,
    ProdutoFarmaciaViewSet,
    CatalogoFarmaciasView,
)

router = DefaultRouter()

router.register(
    "produtos",
    ProdutoFarmaciaViewSet,
    basename="produtos-farmacia",
)

urlpatterns = [
    path(
        "cadastro/",
        CadastroFarmaciaView.as_view(),
        name="cadastro-farmacia",
    ),
    path(
        "meu-perfil/",
        MinhaFarmaciaView.as_view(),
        name="minha-farmacia",
    ),
    path(
        "catalogo/",
        CatalogoFarmaciasView.as_view(),
        name="catalogo-farmacias",
    ),
    path("", include(router.urls)),
]
