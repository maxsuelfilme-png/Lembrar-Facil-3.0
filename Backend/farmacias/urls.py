
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CadastroFarmaciaView,
    LoginFarmaciaView,
    MinhaFarmaciaView,
    ProdutoFarmaciaViewSet,
    CatalogoFarmaciasView,
    FarmaciasMapaView,
)


# ======================================================
# ROTAS DOS PRODUTOS
# ======================================================

router = DefaultRouter()

router.register(
    "produtos",
    ProdutoFarmaciaViewSet,
    basename="produtos-farmacia",
)


# ======================================================
# ROTAS DAS FARMÁCIAS
# ======================================================

urlpatterns = [

    # Cadastro da farmácia
    path(
        "cadastro/",
        CadastroFarmaciaView.as_view(),
        name="cadastro-farmacia",
    ),

    # Login exclusivo da farmácia
    path(
        "token/",
        LoginFarmaciaView.as_view(),
        name="login-farmacia",
    ),

    # Perfil da farmácia
    path(
        "meu-perfil/",
        MinhaFarmaciaView.as_view(),
        name="minha-farmacia",
    ),

    # Catálogo público de produtos
    path(
        "catalogo/",
        CatalogoFarmaciasView.as_view(),
        name="catalogo-farmacias",
    ),

    # Mapa de farmácias parceiras
    path(
        "mapa/",
        FarmaciasMapaView.as_view(),
        name="farmacias-mapa",
    ),

    # Gerenciamento de produtos
    path(
        "",
        include(router.urls),
    ),
]
