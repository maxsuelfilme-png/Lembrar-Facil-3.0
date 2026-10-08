
from django.urls import path

from .views import (
    MeuPerfilPacienteView,
    MeuContatoFamiliarView,
)

urlpatterns = [
    path(
        "meu-perfil/",
        MeuPerfilPacienteView.as_view(),
        name="meu-perfil-paciente",
    ),

    path(
        "meu-contato-familiar/",
        MeuContatoFamiliarView.as_view(),
        name="meu-contato-familiar",
    ),
]
