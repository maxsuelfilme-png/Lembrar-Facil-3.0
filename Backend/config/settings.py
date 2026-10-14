
from pathlib import Path
from datetime import timedelta
import os

from dotenv import load_dotenv
import dj_database_url


# ======================================================
# CONFIGURAÇÕES INICIAIS
# ======================================================

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# ======================================================
# SEGURANÇA
# ======================================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    if os.getenv("RAILWAY_ENVIRONMENT"):
        raise RuntimeError(
            "Configure SECRET_KEY no Railway."
        )

    SECRET_KEY = "chave-local-apenas-para-desenvolvimento"


DEBUG = os.getenv("DEBUG", "False").lower() == "true"


ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "172.16.0.190",
    ".railway.app",
]


CSRF_TRUSTED_ORIGINS = [
    "https://lembrar-facil-30-production.up.railway.app",
]


# ======================================================
# APLICATIVOS INSTALADOS
# ======================================================

INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Bibliotecas
    "rest_framework",
    "corsheaders",

    # Aplicativos do LembraFácil
    "medicamentos",
    "usuarios",
    "horarios",
    "confirmacoes.apps.ConfirmacoesConfig",
    "receitas",
    "pacientes",
    "cuidadores",
    "farmacias",
]


# ======================================================
# MIDDLEWARE
# ======================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ======================================================
# ROTAS E TEMPLATES
# ======================================================

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ======================================================
# BANCO DE DADOS
# ======================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ======================================================
# VALIDAÇÃO DE SENHAS
# ======================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ======================================================
# IDIOMA E FUSO HORÁRIO
# ======================================================

LANGUAGE_CODE = "pt-br"

TIME_ZONE = "America/Recife"

USE_I18N = True

USE_TZ = True


# ======================================================
# ARQUIVOS ESTÁTICOS E MÍDIA
# ======================================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ======================================================
# EMAIL
# ======================================================

EMAIL_BACKEND = (
    "django.core.mail.backends.console.EmailBackend"
)


# ======================================================
# DJANGO REST FRAMEWORK
# ======================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication."
        "JWTAuthentication",
    ),
}


# ======================================================
# AUTENTICAÇÃO JWT
# ======================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": False,
}


# ======================================================
# CORS
# ======================================================

CORS_ALLOW_ALL_ORIGINS = True


# ======================================================
# SEGURANÇA HTTPS
# ======================================================

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SESSION_COOKIE_SECURE = not DEBUG

CSRF_COOKIE_SECURE = not DEBUG

SECURE_CONTENT_TYPE_NOSNIFF = True
