
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MeuPerfilCuidadorView,
    VinculoCuidadorPacienteViewSet,
    GerarCodigoVinculoView,
    VincularPacienteView,
)

router = DefaultRouter()

router.register(
    r"vinculos",
    VinculoCuidadorPacienteViewSet,
    basename="vinculos-cuidador",
)

urlpatterns = [
    path(
        "meu-perfil/",
        MeuPerfilCuidadorView.as_view(),
        name="meu-perfil-cuidador",
    ),

    path(
        "gerar-codigo/",
        GerarCodigoVinculoView.as_view(),
        name="gerar-codigo-vinculo",
    ),

    path(
        "vincular-paciente/",
        VincularPacienteView.as_view(),
        name="vincular-paciente",
    ),

    path("", include(router.urls)),
]
