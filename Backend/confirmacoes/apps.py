from django.apps import AppConfig
import os


class ConfirmacoesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "confirmacoes"

    def ready(self):
        # Evita iniciar duas vezes por causa do autoreload do Django
        if os.environ.get("RUN_MAIN") == "true":
            from .scheduler import iniciar_scheduler
            iniciar_scheduler()