
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import (
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

        # Evita alterar o estoque inicial de um ciclo
        # já iniciado por meio da edição comum.
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
    # REPOR ESTOQUE
    # ==================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="repor-estoque",
    )
    def repor_estoque(self, request, pk=None):

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

        # Compatível com DecimalField(decimal_places=2).
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

        with transaction.atomic():

            medicamento = (
                self.get_queryset()
                .select_for_update()
                .get(pk=self.get_object().pk)
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

            estoque_atual = calcular_estoque_medicamento(
                medicamento
            )

            restante = Decimal(
                str(estoque_atual["estoque_restante"])
            )

            novo_estoque = restante + quantidade_adicionada

            if novo_estoque > Decimal("99999999.99"):
                raise ValidationError({
                    "quantidade": "O estoque excede o limite permitido."
                })

            medicamento.estoque_inicial = novo_estoque

            # Inicia novo ciclo: as doses antigas não
            # serão descontadas novamente.
            medicamento.estoque_iniciado_em = timezone.now()

            medicamento.save(
                update_fields=[
                    "estoque_inicial",
                    "estoque_iniciado_em",
                ]
            )

        serializer = self.get_serializer(medicamento)

        return Response(
            {
                "mensagem": "Estoque reposto com sucesso.",
                "quantidade_adicionada": str(
                    quantidade_adicionada
                ),
                "medicamento": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ==================================================
    # EXCLUIR MEDICAMENTO
    # ==================================================

    @transaction.atomic
    def perform_destroy(self, instance):
        HorarioMedicamento.objects.filter(
            medicamento=instance
        ).delete()

        instance.delete()
