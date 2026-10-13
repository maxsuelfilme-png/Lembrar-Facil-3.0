
from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView

from .views import (
    CadastroUsuarioView,
    ativar_paciente,
)


urlpatterns = [
    # Cadastro tradicional do familiar
    path(
        "cadastro/",
        CadastroUsuarioView.as_view(),
        name="cadastro_usuario",
    ),

    # Login com usuário e senha
    path(
        "token/",
        TokenObtainPairView.as_view(),
        name="token_usuario",
    ),

    # Ativação automática do idoso
    path(
        "ativar-paciente/",
        ativar_paciente,
        name="ativar_paciente",
    ),
]
