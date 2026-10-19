
from django.db import transaction
from django.utils import timezone

from rest_framework import (
    generics,
    viewsets,
    status,
    mixins,
)
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
# LISTAR E EXCLUIR VÍNCULOS DO FAMILIAR
# ======================================================

class VinculoCuidadorPacienteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = VinculoCuidadorPacienteSerializer
    permission_classes = [IsAuthenticated]

    # ==================================================
    # LISTAR APENAS VÍNCULOS ATIVOS DO FAMILIAR
    # ==================================================

    def get_queryset(self):
        return (
            VinculoCuidadorPaciente.objects.filter(
                cuidador__usuario=self.request.user,
                ativo=True,
            )
            .select_related("paciente")
            .order_by("-criado_em")
        )

    # ==================================================
    # EXCLUIR VÍNCULO SEM APAGAR O PACIENTE
    # ==================================================

    def destroy(self, request, *args, **kwargs):
        vinculo = self.get_object()

        # Desativa o vínculo em vez de apagar o registro.
        vinculo.ativo = False
        vinculo.save(update_fields=["ativo"])

        return Response(
            {
                "detail": (
                    "Vínculo removido com sucesso."
                )
            },
            status=status.HTTP_200_OK,
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

            # Invalida códigos anteriores não utilizados.
            CodigoVinculo.objects.filter(
                paciente=paciente,
                utilizado=False,
            ).update(utilizado=True)

            # Gera um novo código.
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
        # IDENTIFICAR TIPO DE CONTA
        # ==================================================

        eh_paciente = Paciente.objects.filter(
            usuario=request.user
        ).exists()

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
        # VALIDAR CÓDIGO
        # ==================================================

        codigo = request.data.get("codigo")

        if (
            not isinstance(codigo, str)
            or not codigo.strip()
        ):
            return Response(
                {
                    "detail": (
                        "Informe o código de vinculação."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        codigo = codigo.strip().upper()

        if (
            len(codigo) != 16
            or any(
                caractere not in "ABCDEF0123456789"
                for caractere in codigo
            )
        ):
            return Response(
                {
                    "detail": (
                        "Código inválido ou expirado."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
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

            # ==================================================
            # OBTER OU CRIAR PERFIL DO FAMILIAR
            # ==================================================

            cuidador, criado = Cuidador.objects.get_or_create(
                usuario=request.user,
                defaults={
                    "nome": (
                        request.user.get_full_name()
                        or request.user.username
                    )
                },
            )

            # ==================================================
            # CRIAR OU REATIVAR VÍNCULO
            # ==================================================

            vinculo, criado = (
                VinculoCuidadorPaciente.objects.get_or_create(
                    cuidador=cuidador,
                    paciente=codigo_vinculo.paciente,
                    defaults={
                        "ativo": True
                    },
                )
            )

            if not vinculo.ativo:
                vinculo.ativo = True
                vinculo.save(
                    update_fields=["ativo"]
                )

            # ==================================================
            # MARCAR CÓDIGO COMO UTILIZADO
            # ==================================================

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
