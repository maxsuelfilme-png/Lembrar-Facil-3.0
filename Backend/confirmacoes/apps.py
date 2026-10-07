from django.apps import AppConfig
import os


class ConfirmacoesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "confirmacoes"

    def ready(self):
        # No servidor local com runserver:
        # inicia somente no processo correto do autoreload.
        if "runserver" in os.sys.argv:
            if os.environ.get("RUN_MAIN") == "true":
                from .scheduler import iniciar_scheduler
                iniciar_scheduler()

        # No Railway/Gunicorn:
        elif "gunicorn" in os.environ.get("SERVER_SOFTWARE", "").lower():
            from .scheduler import iniciar_scheduler
            iniciar_scheduler()