
import logging
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Medicamento
from .serializers import MedicamentoSerializer
from .estoque import calcular_estoque_medicamento

from horarios.models import HorarioMedicamento
from pacientes.models import Paciente
from cuidadores.models import VinculoCuidadorPaciente


logger = logging.getLogger(__name__)


class MedicamentoViewSet(viewsets.ModelViewSet):

    serializer_class = MedicamentoSerializer
    permission_classes = [IsAuthenticated]

    # ==================================================
    # PACIENTES AUTORIZADOS
    # ==================================================

    def pacientes_autorizados(self):
        return VinculoCuidadorPaciente.objects.filter(
            cuidador__usuario=self.request.user,
            ativo=True,
        ).values_list(
            "paciente__usuario_id",
            flat=True,
        )

    # ==================================================
    # VALIDAR PACIENTE
    # ==================================================

    def obter_paciente_autorizado(self, paciente_id):
        try:
            paciente_id = int(paciente_id)
        except (TypeError, ValueError):
            raise ValidationError({
                "paciente_id": "Informe um ID de paciente válido."
            })

        paciente = Paciente.objects.filter(
            id=paciente_id
        ).first()

        if not paciente:
            raise PermissionDenied(
                "Paciente não encontrado ou não autorizado."
            )

        if paciente.usuario_id == self.request.user.id:
            return paciente

        autorizado = VinculoCuidadorPaciente.objects.filter(
            cuidador__usuario=self.request.user,
            paciente=paciente,
            ativo=True,
        ).exists()

        if not autorizado:
            raise PermissionDenied(
                "Você não possui autorização para este paciente."
            )

        return paciente

    # ==================================================
    # LISTAR MEDICAMENTOS
    # ==================================================

    def get_queryset(self):
        usuario = self.request.user

        queryset = Medicamento.objects.filter(
            Q(usuario=usuario)
            | Q(usuario_id__in=self.pacientes_autorizados())
        ).distinct()

        paciente_id = self.request.query_params.get(
            "paciente_id"
        )

        if paciente_id not in (None, ""):
            paciente = self.obter_paciente_autorizado(
                paciente_id
            )

            queryset = queryset.filter(
                usuario=paciente.usuario
            )

        return queryset.order_by("-id")

    # ==================================================
    # DEFINIR DONO DO MEDICAMENTO
    # ==================================================

    def obter_usuario_destino(self):
        usuario = self.request.user

        paciente_id = self.request.data.get(
            "paciente_id"
        )

        if paciente_id in (None, ""):
            if Paciente.objects.filter(
                usuario=usuario
            ).exists():
                return usuario

            raise ValidationError({
                "paciente_id": (
                    "O familiar precisa informar "
                    "o paciente vinculado."
                )
            })

        paciente = self.obter_paciente_autorizado(
            paciente_id
        )

        return paciente.usuario

    # ==================================================
    # INICIAR CONTROLE DE ESTOQUE
    # ==================================================

    def iniciar_controle_estoque(self, medicamento):
        if (
            medicamento.estoque_inicial is not None
            and medicamento.consumo_por_dose is not None
            and medicamento.consumo_por_dose > 0
            and medicamento.estoque_iniciado_em is None
        ):
            medicamento.estoque_iniciado_em = timezone.now()

            medicamento.save(
                update_fields=["estoque_iniciado_em"]
            )

    # ==================================================
    # CADASTRAR MEDICAMENTO
    # ==================================================

    @transaction.atomic
    def perform_create(self, serializer):
        usuario_destino = self.obter_usuario_destino()

        medicamento = serializer.save(
            usuario=usuario_destino
        )

        self.iniciar_controle_estoque(
            medicamento
        )

        HorarioMedicamento.objects.create(
            medicamento=medicamento,
            horario=medicamento.horario,
            ativo=True,
        )

    # ==================================================
    # ATUALIZAR MEDICAMENTO
    # ==================================================

    @transaction.atomic
    def perform_update(self, serializer):
        medicamento_anterior = serializer.instance

        if medicamento_anterior.estoque_iniciado_em is not None:
            campos_protegidos = {
                "estoque_inicial",
                "consumo_por_dose",
                "unidade_estoque",
            }

            if campos_protegidos.intersection(
                serializer.validated_data.keys()
            ):
                raise ValidationError({
                    "estoque": (
                        "O controle de estoque já foi iniciado. "
                        "Utilize a função de reposição para "
                        "adicionar medicamentos."
                    )
                })

        medicamento = serializer.save()

        self.iniciar_controle_estoque(
            medicamento
        )

        horario_existente = (
            HorarioMedicamento.objects.filter(
                medicamento=medicamento
            )
            .order_by("id")
            .first()
        )

        if horario_existente:
            horario_existente.horario = medicamento.horario
            horario_existente.ativo = True

            horario_existente.save(
                update_fields=[
                    "horario",
                    "ativo",
                ]
            )
        else:
            HorarioMedicamento.objects.create(
                medicamento=medicamento,
                horario=medicamento.horario,
                ativo=True,
            )

    # ==================================================
    # REPOR ESTOQUE COM DIAGNÓSTICO DE ERROS
    # ==================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="repor-estoque",
    )
    def repor_estoque(self, request, pk=None):

        logger.info(
            "LEMBRAFACIL_REPOSICAO_INICIADA medicamento_id=%s",
            pk,
        )

        try:
            quantidade_adicionada = Decimal(
                str(request.data.get("quantidade", ""))
            )
        except (InvalidOperation, TypeError, ValueError):
            raise ValidationError({
                "quantidade": (
                    "Informe uma quantidade numérica válida."
                )
            })

        if (
            not quantidade_adicionada.is_finite()
            or quantidade_adicionada <= 0
        ):
            raise ValidationError({
                "quantidade": (
                    "A quantidade de reposição "
                    "deve ser maior que zero."
                )
            })

        if (
            quantidade_adicionada.as_tuple().exponent < -2
            or quantidade_adicionada > Decimal("99999999.99")
        ):
            raise ValidationError({
                "quantidade": (
                    "Informe uma quantidade com até "
                    "duas casas decimais, dentro do limite."
                )
            })

        try:
            with transaction.atomic():

                medicamento = (
                    self.get_queryset()
                    .select_for_update()
                    .filter(pk=pk)
                    .first()
                )

                if medicamento is None:
                    raise NotFound(
                        "Medicamento não encontrado ou não autorizado."
                    )

                if (
                    medicamento.estoque_inicial is None
                    or medicamento.consumo_por_dose is None
                    or medicamento.consumo_por_dose <= 0
                    or medicamento.estoque_iniciado_em is None
                ):
                    raise ValidationError({
                        "estoque": (
                            "Configure o estoque inicial e "
                            "o consumo por dose antes de repor."
                        )
                    })

                logger.info(
                    "LEMBRAFACIL_REPOSICAO_CALCULANDO medicamento_id=%s",
                    pk,
                )

                estoque_atual = calcular_estoque_medicamento(
                    medicamento
                )

                valor_restante = estoque_atual.get(
                    "estoque_restante"
                )

                if valor_restante is None:
                    raise ValidationError({
                        "estoque": (
                            "Não foi possível calcular "
                            "o estoque restante."
                        )
                    })

                try:
                    restante = Decimal(
                        str(valor_restante)
                    )
                except (InvalidOperation, TypeError, ValueError):
                    raise ValidationError({
                        "estoque": (
                            "O cálculo retornou um valor "
                            "de estoque inválido."
                        )
                    })

                if not restante.is_finite():
                    raise ValidationError({
                        "estoque": (
                            "O estoque calculado é inválido."
                        )
                    })

                novo_estoque = (
                    restante + quantidade_adicionada
                )

                if novo_estoque > Decimal("99999999.99"):
                    raise ValidationError({
                        "quantidade": (
                            "O estoque excede o limite permitido."
                        )
                    })

                logger.info(
                    "LEMBRAFACIL_REPOSICAO_SALVANDO medicamento_id=%s",
                    pk,
                )

                medicamento.estoque_inicial = novo_estoque
                medicamento.estoque_iniciado_em = timezone.now()

                medicamento.save(
                    update_fields=[
                        "estoque_inicial",
                        "estoque_iniciado_em",
                    ]
                )

            logger.info(
                "LEMBRAFACIL_REPOSICAO_SERIALIZANDO medicamento_id=%s",
                pk,
            )

            serializer = self.get_serializer(medicamento)
            dados_medicamento = serializer.data

            logger.info(
                "LEMBRAFACIL_REPOSICAO_SUCESSO medicamento_id=%s",
                pk,
            )

            return Response(
                {
                    "mensagem": "Estoque reposto com sucesso.",
                    "quantidade_adicionada": str(
                        quantidade_adicionada
                    ),
                    "medicamento": dados_medicamento,
                },
                status=status.HTTP_200_OK,
            )

        except (
            ValidationError,
            NotFound,
            PermissionDenied,
        ):
            # Erros esperados são devolvidos ao aplicativo.
            raise

        except Exception:
            # Registra o traceback completo no Railway.
            logger.exception(
                "LEMBRAFACIL_ERRO_REPOSICAO medicamento_id=%s",
                pk,
            )
            raise

    # ==================================================
    # EXCLUIR MEDICAMENTO
    # ==================================================

    @transaction.atomic
    def perform_destroy(self, instance):
        HorarioMedicamento.objects.filter(
            medicamento=instance
        ).delete()

        instance.delete()
