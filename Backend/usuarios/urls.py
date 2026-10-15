
from django.urls import path

from .views import (
    CadastroUsuarioView,
    LoginFamiliarView,
    ativar_paciente,
)


urlpatterns = [
    # Cadastro do familiar
    path(
        "cadastro/",
        CadastroUsuarioView.as_view(),
        name="cadastro_usuario",
    ),

    # Login exclusivo do familiar
    path(
        "token/",
        LoginFamiliarView.as_view(),
        name="token_usuario",
    ),

    # Ativação automática do idoso
    path(
        "ativar-paciente/",
        ativar_paciente,
        name="ativar_paciente",
    ),
]
