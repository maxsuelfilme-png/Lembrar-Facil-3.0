from rest_framework import generics
from rest_framework.permissions import AllowAny


from .serializers import CadastroUsuarioSerializer


class CadastroUsuarioView(generics.CreateAPIView):
    serializer_class = CadastroUsuarioSerializer
    permission_classes = [AllowAny]
    