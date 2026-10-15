
from django.db import transaction
from django.utils import timezone

from rest_framework import generics, viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Cuidador,
    VinculoCuidadorPaciente,
    CodigoVinculo,
)

from .serializers import (
    CuidadorSerializer,
    VinculoCuidadorPacienteSerializer,
)

from pacientes.models import Paciente


# ======================================================
# PERFIL DO FAMILIAR
# ======================================================

class MeuPerfilCuidadorView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = CuidadorSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        cuidador, criado = Cuidador.objects.get_or_create(
            usuario=self.request.user,
            defaults={
                "nome": (
                    self.request.user.get_full_name()
                    or self.request.user.username
                )
            },
        )

        return cuidador


# ======================================================
# LISTAR PACIENTES VINCULADOS
# ======================================================

class VinculoCuidadorPacienteViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = VinculoCuidadorPacienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            VinculoCuidadorPaciente.objects.filter(
                cuidador__usuario=self.request.user,
                ativo=True,
            )
            .select_related("paciente")
            .order_by("-criado_em")
        )


# ======================================================
# IDOSO GERA CÓDIGO DE VINCULAÇÃO
# ======================================================

class GerarCodigoVinculoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        paciente = Paciente.objects.filter(
            usuario=request.user
        ).first()

        if not paciente:
            return Response(
                {
                    "detail": (
                        "Somente um paciente autenticado "
                        "pode gerar um código de vínculo."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():

            # Invalida códigos anteriores não utilizados
            CodigoVinculo.objects.filter(
                paciente=paciente,
                utilizado=False,
            ).update(utilizado=True)

            # Gera um novo código
            novo_codigo = CodigoVinculo.objects.create(
                paciente=paciente
            )

        return Response(
            {
                "codigo": novo_codigo.codigo,
                "expira_em": novo_codigo.expira_em.isoformat(),
                "paciente_id": paciente.id,
            },
            status=status.HTTP_201_CREATED,
        )


# ======================================================
# FAMILIAR VINCULA O IDOSO
# ======================================================

class VincularPacienteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        # ==================================================
        # DIAGNÓSTICO TEMPORÁRIO DA CONTA AUTENTICADA
        # ==================================================

        eh_paciente = Paciente.objects.filter(
            usuario=request.user
        ).exists()

        eh_familiar = Cuidador.objects.filter(
            usuario=request.user
        ).exists()

        print(
            "DIAGNOSTICO VINCULO:",
            {
                "usuario_id": request.user.id,
                "username": request.user.username,
                "eh_paciente": eh_paciente,
                "eh_familiar": eh_familiar,
            },
            flush=True,
        )

        # ==================================================
        # VALIDAR CÓDIGO
        # ==================================================

        codigo = request.data.get("codigo")

        if not isinstance(codigo, str) or not codigo.strip():
            return Response(
                {
                    "detail": (
                        "Informe o código de vinculação."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        codigo = codigo.strip().upper()

        if len(codigo) != 16:
            return Response(
                {
                    "detail": "Código inválido ou expirado."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ==================================================
        # IMPEDIR VÍNCULO USANDO CONTA DE PACIENTE
        # ==================================================

        if eh_paciente:
            return Response(
                {
                    "detail": (
                        "Utilize uma conta de familiar "
                        "para realizar o vínculo."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ==================================================
        # VERIFICAR E CONSUMIR CÓDIGO
        # ==================================================

        with transaction.atomic():

            codigo_vinculo = (
                CodigoVinculo.objects
                .select_for_update()
                .select_related("paciente")
                .filter(codigo=codigo)
                .first()
            )

            if (
                codigo_vinculo is None
                or codigo_vinculo.utilizado
                or codigo_vinculo.expira_em <= timezone.now()
            ):
                return Response(
                    {
                        "detail": (
                            "Código inválido ou expirado."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ==============================================
            # OBTER OU CRIAR PERFIL DO FAMILIAR
            # ==============================================

            cuidador, criado = Cuidador.objects.get_or_create(
                usuario=request.user,
                defaults={
                    "nome": (
                        request.user.get_full_name()
                        or request.user.username
                    )
                },
            )

            # ==============================================
            # CRIAR VÍNCULO COM O IDOSO
            # ==============================================

            vinculo, criado = (
                VinculoCuidadorPaciente.objects.get_or_create(
                    cuidador=cuidador,
                    paciente=codigo_vinculo.paciente,
                    defaults={
                        "ativo": True
                    },
                )
            )

            # Reativa um vínculo existente, se necessário
            if not vinculo.ativo:
                vinculo.ativo = True
                vinculo.save(
                    update_fields=["ativo"]
                )

            # Código não pode ser reutilizado
            codigo_vinculo.utilizado = True
            codigo_vinculo.save(
                update_fields=["utilizado"]
            )

        # ==================================================
        # RESPOSTA DE SUCESSO
        # ==================================================

        return Response(
            {
                "detail": (
                    "Familiar vinculado com sucesso!"
                ),
                "paciente_id": codigo_vinculo.paciente_id,
                "vinculo_id": vinculo.id,
            },
            status=status.HTTP_200_OK,
        )
