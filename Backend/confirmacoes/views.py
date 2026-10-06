from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import ConfirmacaoDose
from .serializers import ConfirmacaoDoseSerializer


class ConfirmacaoDoseViewSet(viewsets.ModelViewSet):
    serializer_class = ConfirmacaoDoseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConfirmacaoDose.objects.filter(
            usuario=self.request.user
        ).select_related(
            'medicamento',
            'horario'
        ).order_by('-data', 'horario_previsto')

    def _validar_vinculos(self, medicamento, horario):
        if medicamento.usuario != self.request.user:
            raise PermissionDenied(
                'Este medicamento não pertence ao usuário.'
            )

        if horario is not None and horario.medicamento_id != medicamento.id:
            raise ValidationError(
                'Este horário não pertence ao medicamento informado.'
            )

    def perform_create(self, serializer):
        medicamento = serializer.validated_data['medicamento']
        horario = serializer.validated_data.get('horario')

        self._validar_vinculos(medicamento, horario)

        extras = {'usuario': self.request.user}

        # Se o app não mandou o horário previsto, usa o do medicamento
        if not serializer.validated_data.get('horario_previsto'):
            extras['horario_previsto'] = (
                horario.horario if horario else medicamento.horario
            )

        status = serializer.validated_data.get('status', 'pendente')

        if status == 'tomado':
            extras['confirmado_em'] = timezone.now()

        try:
            with transaction.atomic():
                serializer.save(**extras)
        except IntegrityError:
            raise ValidationError(
                'Já existe um registro deste medicamento neste horário e data.'
            )

    def perform_update(self, serializer):
        instancia = serializer.instance

        medicamento = serializer.validated_data.get(
            'medicamento', instancia.medicamento
        )
        horario = serializer.validated_data.get(
            'horario', instancia.horario
        )

        self._validar_vinculos(medicamento, horario)

        status = serializer.validated_data.get('status', instancia.status)

        extras = {}

        if status == 'tomado' and instancia.confirmado_em is None:
            extras['confirmado_em'] = timezone.now()
        elif status != 'tomado':
            extras['confirmado_em'] = None

        serializer.save(**extras)