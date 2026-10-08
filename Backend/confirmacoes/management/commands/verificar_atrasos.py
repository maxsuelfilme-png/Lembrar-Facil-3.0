
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from horarios.models import HorarioMedicamento
from confirmacoes.models import ConfirmacaoDose
from cuidadores.models import VinculoCuidadorPaciente
from whatsapp import enviar_whatsapp


class Command(BaseCommand):
    help = "Verifica medicamentos atrasados e avisa familiares pelo WhatsApp"

    def avisar_familiares(self, medicamento, hora_formatada):
        """
        Busca os cuidadores vinculados ao paciente
        e envia um alerta ao WhatsApp cadastrado.
        """

        vinculos = VinculoCuidadorPaciente.objects.filter(
            paciente__usuario=medicamento.usuario,
            ativo=True,
        ).select_related("cuidador")

        if not vinculos.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Nenhum familiar vinculado ao paciente."
                )
            )
            return

        for vinculo in vinculos:
            cuidador = vinculo.cuidador

            telefone = "".join(
                c for c in (cuidador.telefone or "")
                if c.isdigit()
            )

            if len(telefone) == 11:
                telefone = "55" + telefone

            if len(telefone) not in (12, 13):
                self.stdout.write(
                    self.style.WARNING(
                        f"Telefone inválido: {cuidador.nome}"
                    )
                )
                continue

            try:
                enviado = enviar_whatsapp(
                    medicamento.nome,
                    hora_formatada,
                    telefone,
                )

                if enviado:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"WhatsApp enviado para {cuidador.nome}"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Falha ao enviar para {cuidador.nome}"
                        )
                    )

            except Exception as erro:
                self.stdout.write(
                    self.style.ERROR(
                        f"Erro no WhatsApp: {erro}"
                    )
                )

    def handle(self, *args, **options):

        agora = timezone.localtime()
        hoje = agora.date()
        tolerancia = timedelta(minutes=2)

        horarios = HorarioMedicamento.objects.filter(
            ativo=True,
            medicamento__ativo=True,
        ).select_related(
            "medicamento",
            "medicamento__usuario",
        )

        novos_atrasos = 0

        for horario in horarios:

            medicamento = horario.medicamento

            horario_programado = timezone.make_aware(
                datetime.combine(
                    hoje,
                    horario.horario,
                ),
                timezone.get_current_timezone(),
            )

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

            novo_atraso = criada

            if not criada and confirmacao.status == "pendente":
                confirmacao.status = "atrasado"
                confirmacao.horario = horario

                confirmacao.save(
                    update_fields=[
                        "status",
                        "horario",
                    ]
                )

                novo_atraso = True

            if not novo_atraso:
                continue

            novos_atrasos += 1

            nome_medicamento = medicamento.nome
            hora_formatada = horario.horario.strftime("%H:%M")

            self.stdout.write(
                self.style.WARNING(
                    f"ATRASADO: {nome_medicamento} - {hora_formatada}"
                )
            )

            self.avisar_familiares(
                medicamento,
                hora_formatada,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Verificação concluída. Novos atrasos: {novos_atrasos}"
            )
        )
