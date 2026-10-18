
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from medicamentos.models import (
    Medicamento,
    NotificacaoEstoqueWhatsApp,
)
from medicamentos.estoque import calcular_estoque_medicamento
from pacientes.models import Paciente
from pacientes.views import buscar_telefone_familiar
from whatsapp import (
    enviar_whatsapp_estoque,
    normalizar_telefone,
)


class Command(BaseCommand):

    help = (
        "Verifica medicamentos com estoque baixo "
        "e envia alertas aos familiares."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--simular",
            action="store_true",
            help="Verifica sem criar notificacoes nem enviar WhatsApp.",
        )

    def handle(self, *args, **options):

        simular = options["simular"]

        verificados = 0
        estoque_baixo = 0
        mensagens_aceitas = 0
        mensagens_falharam = 0

        medicamentos = (
            Medicamento.objects.filter(
                ativo=True,
                estoque_inicial__isnull=False,
                consumo_por_dose__gt=0,
                estoque_iniciado_em__isnull=False,
            )
            .select_related("usuario")
            .prefetch_related("horarios")
        )

        for medicamento in medicamentos:

            verificados += 1

            estoque = calcular_estoque_medicamento(
                medicamento
            )

            if not estoque.get("alerta_estoque"):
                continue

            dias_restantes = estoque.get(
                "dias_restantes"
            )

            if dias_restantes is None:
                continue

            estoque_baixo += 1

            paciente = Paciente.objects.filter(
                usuario=medicamento.usuario
            ).first()

            if paciente is None:
                continue

            telefone = normalizar_telefone(
                buscar_telefone_familiar(paciente)
            )

            if not telefone:
                continue

            if simular:
                self.stdout.write(
                    f"[SIMULACAO] Medicamento ID "
                    f"{medicamento.pk} | "
                    f"Dias restantes: {dias_restantes}"
                )
                continue

            notificacao, _ = (
                NotificacaoEstoqueWhatsApp.objects.get_or_create(
                    medicamento=medicamento,
                    telefone=telefone,
                    ciclo_estoque=medicamento.estoque_iniciado_em,
                )
            )

            if notificacao.status in (
                "aceita",
                "entregue",
                "processando",
            ):
                continue

            if notificacao.tentativas >= 3:
                continue

            with transaction.atomic():

                reservada = (
                    NotificacaoEstoqueWhatsApp.objects.filter(
                        pk=notificacao.pk,
                        status__in=[
                            "pendente",
                            "falhou",
                        ],
                        tentativas__lt=3,
                    )
                    .update(
                        status="processando",
                        tentativas=F("tentativas") + 1,
                    )
                )

            if not reservada:
                continue

            nome_paciente = (
                paciente.nome
                or medicamento.usuario.username
            )

            try:
                enviado = enviar_whatsapp_estoque(
                    nome_paciente=nome_paciente,
                    nome_medicamento=medicamento.nome,
                    dias_restantes=dias_restantes,
                    telefone=telefone,
                )

            except Exception as erro:
                self.stderr.write(
                    f"Falha na notificacao "
                    f"{notificacao.pk}: "
                    f"{type(erro).__name__}"
                )
                enviado = False

            campos = {
                "status": (
                    "aceita" if enviado else "falhou"
                )
            }

            if enviado:
                campos["enviada_em"] = timezone.now()
                mensagens_aceitas += 1
            else:
                mensagens_falharam += 1

            NotificacaoEstoqueWhatsApp.objects.filter(
                pk=notificacao.pk,
                status="processando",
            ).update(**campos)

        self.stdout.write(
            self.style.SUCCESS(
                f"Medicamentos verificados: {verificados} | "
                f"Estoque baixo: {estoque_baixo} | "
                f"Mensagens aceitas pela Meta: "
                f"{mensagens_aceitas} | "
                f"Falhas: {mensagens_falharam}"
            )
        )

        if simular:
            self.stdout.write(
                "Simulacao concluida. "
                "Nenhuma mensagem foi enviada."
            )
