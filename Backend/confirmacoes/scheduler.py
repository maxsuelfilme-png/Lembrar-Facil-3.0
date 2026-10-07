from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command


def verificar_medicamentos():
    try:
        print("Verificando medicamentos atrasados automaticamente...")
        call_command("verificar_atrasos")
    except Exception as erro:
        print(f"Erro na verificacao automatica: {erro}")


def iniciar_scheduler():
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        verificar_medicamentos,
        "interval",
        minutes=1,
        id="verificar_medicamentos_atrasados",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()

    print("Automacao do LembraFacil iniciada.")