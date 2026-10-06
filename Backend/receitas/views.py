from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Receita
from .serializers import ReceitaSerializer


class ReceitaViewSet(viewsets.ModelViewSet):
    serializer_class = ReceitaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Receita.objects.filter(
            usuario=self.request.user
        ).order_by('-criada_em')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)