from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ConfirmacaoDoseViewSet


router = DefaultRouter()

router.register(
    r'registros',
    ConfirmacaoDoseViewSet,
    basename='registro'
)

urlpatterns = [
    path('', include(router.urls)),
]