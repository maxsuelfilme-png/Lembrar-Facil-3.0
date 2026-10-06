from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HorarioMedicamentoViewSet

router = DefaultRouter()
router.register(
    r'horarios',
    HorarioMedicamentoViewSet,
    basename='horario'
)

urlpatterns = [
    path('', include(router.urls)),
]