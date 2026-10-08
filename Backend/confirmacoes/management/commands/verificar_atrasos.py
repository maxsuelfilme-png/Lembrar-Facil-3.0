
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from horarios.models import HorarioMedicamento
from confirmacoes.models import ConfirmacaoDose, NotificacaoWhatsApp
from pacientes.models import Paciente
from whatsapp import enviar_whatsapp, normalizar_telefone


class Command(BaseCommand):
    help = "Verifica atrasos e envia notificações pelo WhatsApp"

    def handle(self, *args, **options):
        agora = timezone.localtime()
        hoje = agora.date()
        tolerancia = timedelta(minutes=2)

        novos_atrasos = 0
        mensagens_aceitas = 0

        horarios = HorarioMedicamento.objects.filter(
            ativo=True,
            medicamento__ativo=True
        ).select_related(
            "medicamento",
            "medicamento__usuario"
        )

        for horario in horarios:
            medicamento = horario.medicamento

            horario_programado = timezone.make_aware(
                datetime.combine(hoje, horario.horario),
                timezone.get_current_timezone()
            )

            if agora < horario_programado + tolerancia:
                continue

            confirmacao, criada = ConfirmacaoDose.objects.get_or_create(
                usuario=medicamento.usuario,
                medicamento=medicamento,
                horario_previsto=horario.horario,
                data=hoje,
                defaults={
                    "horario": horario,
                    "status": "atrasado"
                }
            )

            if confirmacao.status in ("tomado", "nao_tomado"):
                continue

            if criada or confirmacao.status == "pendente":
                if not criada:
                    confirmacao.status = "atrasado"
                    confirmacao.horario = horario
                    confirmacao.save(
                        update_fields=[
                            "status",
                            "horario",
                            "atualizado_em"
                        ]
                    )

                novos_atrasos += 1

            paciente = Paciente.objects.filter(
                usuario=medicamento.usuario
            ).first()

            if not paciente:
                continue

            telefone = normalizar_telefone(
                paciente.telefone_emergencia
            )

            if not telefone:
                continue

            notificacao, _ = NotificacaoWhatsApp.objects.get_or_create(
                confirmacao=confirmacao,
                telefone=telefone
            )

            if notificacao.status in (
                "aceita",
                "entregue",
                "processando"
            ):
                continue

            if notificacao.tentativas >= 3:
                continue

            with transaction.atomic():
                atualizada = NotificacaoWhatsApp.objects.filter(
                    pk=notificacao.pk,
                    status__in=["pendente", "falhou"],
                    tentativas__lt=3
                ).update(
                    status="processando",
                    tentativas=F("tentativas") + 1
                )

            if not atualizada:
                continue

            enviado = enviar_whatsapp(
                medicamento.nome,
                horario.horario.strftime("%H:%M"),
                telefone
            )

            notificacao.refresh_from_db()

            if enviado:
                notificacao.status = "aceita"
                notificacao.enviada_em = timezone.now()
                mensagens_aceitas += 1
            else:
                notificacao.status = "falhou"

            notificacao.save(
                update_fields=[
                    "status",
                    "enviada_em",
                    "atualizado_em"
                ]
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Novos atrasos: {novos_atrasos} | "
                f"Mensagens aceitas pela Meta: {mensagens_aceitas}"
            )
        )
