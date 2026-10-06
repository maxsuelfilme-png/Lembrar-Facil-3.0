from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from horarios.models import HorarioMedicamento
from confirmacoes.models import ConfirmacaoDose
from whatsapp import enviar_whatsapp


class Command(BaseCommand):
    help = "Verifica medicamentos atrasados e envia aviso pelo WhatsApp"

    def handle(self, *args, **options):

        agora = timezone.localtime()
        hoje = agora.date()

        tolerancia = timedelta(minutes=2)

        horarios = HorarioMedicamento.objects.filter(
            ativo=True,
            medicamento__ativo=True
        ).select_related(
            "medicamento",
            "medicamento__usuario"
        )

        novos_atrasos = 0

        for horario in horarios:

            medicamento = horario.medicamento

            horario_programado = timezone.make_aware(
                datetime.combine(
                    hoje,
                    horario.horario
                ),
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
                    "status": "atrasado",
                }
            )

            if criada:

                novos_atrasos += 1

                nome_medicamento = medicamento.nome
                hora_formatada = horario.horario.strftime("%H:%M")

                self.stdout.write(
                    self.style.WARNING(
                        f"ATRASADO: {nome_medicamento} - {hora_formatada}"
                    )
                )

                enviado = enviar_whatsapp(
                    nome_medicamento,
                    hora_formatada
                )

                if enviado:
                    self.stdout.write(
                        self.style.SUCCESS(
                            "Aviso enviado para o WhatsApp."
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            "Nao foi possivel enviar o aviso."
                        )
                    )

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

                nome_medicamento = medicamento.nome
                hora_formatada = horario.horario.strftime("%H:%M")

                self.stdout.write(
                    self.style.WARNING(
                        f"ATRASADO: {nome_medicamento} - {hora_formatada}"
                    )
                )

                enviado = enviar_whatsapp(
                    nome_medicamento,
                    hora_formatada
                )

                if enviado:
                    self.stdout.write(
                        self.style.SUCCESS(
                            "Aviso enviado para o WhatsApp."
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            "Nao foi possivel enviar o aviso."
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Verificacao concluida. Novos atrasos: {novos_atrasos}"
            )
        )