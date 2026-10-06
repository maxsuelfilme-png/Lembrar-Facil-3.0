from django.urls import path
from .views import MeuPerfilPacienteView


urlpatterns = [
    path(
        'meu-perfil/',
        MeuPerfilPacienteView.as_view(),
        name='meu-perfil-paciente'
    ),
]