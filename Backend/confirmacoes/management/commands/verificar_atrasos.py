
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from horarios.models import HorarioMedicamento
from confirmacoes.models import ConfirmacaoDose, NotificacaoWhatsApp
from pacientes.models import Paciente
from pacientes.views import buscar_telefone_familiar
from whatsapp import enviar_whatsapp


class Command(BaseCommand):
    help = "Verifica atrasos e envia alertas automáticos pelo WhatsApp"

    def handle(self, *args, **options):
        agora = timezone.localtime()
        hoje = agora.date()

        # Manter 2 minutos de tolerância.
        tolerancia = timedelta(minutes=2)

        novos_atrasos = 0
        mensagens_aceitas = 0
        mensagens_falharam = 0

        horarios = (
            HorarioMedicamento.objects.filter(
                ativo=True,
                medicamento__ativo=True,
            )
            .select_related(
                "medicamento",
                "medicamento__usuario",
            )
        )

        for horario in horarios:
            medicamento = horario.medicamento

            horario_programado = timezone.make_aware(
                datetime.combine(hoje, horario.horario),
                timezone.get_current_timezone(),
            )

            # Ainda está dentro da tolerância.
            if agora < horario_programado + tolerancia:
                continue

            confirmacao, criada = (
                ConfirmacaoDose.objects.get_or_create(
                    usuario=medicamento.usuario,
                    medicamento=medicamento,
                    horario_previsto=horario.horario,
                    data=hoje,
                    defaults={
                        "horario": horario,
                        "status": "atrasado",
                    },
                )
            )

            # Não enviar alerta se já confirmou a dose
            # ou registrou explicitamente que não tomou.
            if confirmacao.status in ("tomado", "nao_tomado"):
                continue

            if criada:
                novos_atrasos += 1

            elif confirmacao.status == "pendente":
                confirmacao.status = "atrasado"
                confirmacao.horario = horario

                confirmacao.save(
                    update_fields=[
                        "status",
                        "horario",
                        "atualizado_em",
                    ]
                )

                novos_atrasos += 1

            # Localizar o paciente dono do medicamento.
            paciente = Paciente.objects.filter(
                usuario=medicamento.usuario
            ).first()

            if paciente is None:
                continue

            # Prioriza familiar vinculado.
            # Se não existir, tenta o contato de emergência.
            telefone = buscar_telefone_familiar(paciente)

            if not telefone:
                continue

            notificacao, _ = (
                NotificacaoWhatsApp.objects.get_or_create(
                    confirmacao=confirmacao,
                    telefone=telefone,
                )
            )

            # Não repetir notificações já aceitas ou entregues.
            if notificacao.status in (
                "aceita",
                "entregue",
                "processando",
            ):
                continue

            # Limite de tentativas.
            if notificacao.tentativas >= 3:
                continue

            # Reserva a tentativa antes do envio.
            with transaction.atomic():
                atualizada = (
                    NotificacaoWhatsApp.objects.filter(
                        pk=notificacao.pk,
                        status__in=["pendente", "falhou"],
                        tentativas__lt=3,
                    )
                    .update(
                        status="processando",
                        tentativas=F("tentativas") + 1,
                    )
                )

            if not atualizada:
                continue

            # O envio acontece fora da transação.
            try:
                enviado = enviar_whatsapp(
                    medicamento.nome,
                    horario.horario.strftime("%H:%M"),
                    telefone,
                )
            except Exception as erro:
                self.stderr.write(
                    f"Falha no envio da notificação "
                    f"{notificacao.pk}: {type(erro).__name__}"
                )
                enviado = False

            notificacao.refresh_from_db()

            if enviado:
                notificacao.status = "aceita"
                notificacao.enviada_em = timezone.now()
                mensagens_aceitas += 1
            else:
                notificacao.status = "falhou"
                mensagens_falharam += 1

            notificacao.save(
                update_fields=[
                    "status",
                    "enviada_em",
                    "atualizado_em",
                ]
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Novos atrasos: {novos_atrasos} | "
                f"Mensagens aceitas pela Meta: {mensagens_aceitas} | "
                f"Falhas: {mensagens_falharam}"
            )
        )
