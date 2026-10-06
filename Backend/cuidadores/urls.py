from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MeuPerfilCuidadorView,
    VinculoCuidadorPacienteViewSet,
)


router = DefaultRouter()

router.register(
    r'vinculos',
    VinculoCuidadorPacienteViewSet,
    basename='vinculos-cuidador'
)

urlpatterns = [
    path(
        'meu-perfil/',
        MeuPerfilCuidadorView.as_view(),
        name='meu-perfil-cuidador'
    ),

    path('', include(router.urls)),
]