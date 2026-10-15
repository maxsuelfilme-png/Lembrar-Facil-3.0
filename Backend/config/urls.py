
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import TokenRefreshView

from usuarios.views import LoginFamiliarView


urlpatterns = [
    # Administração
    path(
        "admin/",
        admin.site.urls,
    ),

    # Login exclusivo do familiar/cuidador
    path(
        "api/token/",
        LoginFamiliarView.as_view(),
        name="token",
    ),

    # Renovação do token
    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    # Medicamentos
    path(
        "api/",
        include("medicamentos.urls"),
    ),

    # Horários
    path(
        "api/",
        include("horarios.urls"),
    ),

    # Confirmações
    path(
        "api/",
        include("confirmacoes.urls"),
    ),

    # Receitas
    path(
        "api/",
        include("receitas.urls"),
    ),

    # Usuários
    path(
        "api/usuarios/",
        include("usuarios.urls"),
    ),

    # Pacientes
    path(
        "api/pacientes/",
        include("pacientes.urls"),
    ),

    # Cuidadores
    path(
        "api/cuidadores/",
        include("cuidadores.urls"),
    ),

    # Farmácias
    path(
        "api/farmacias/",
        include("farmacias.urls"),
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
