from django.urls import path
from .views import CadastroUsuarioView
from rest_framework_simplejwt.views import TokenObtainPairView




urlpatterns = [
    path(
        "cadastro/",
        CadastroUsuarioView.as_view(),
        name="cadastro-usuario",
    ),
    path(
        "token/",
          TokenObtainPairView.as_view(),
            name="token"),
  
]