
import os
import re
import logging

import requests


logger = logging.getLogger(__name__)

GRAPH_API_VERSION = os.getenv(
    "WHATSAPP_GRAPH_API_VERSION",
    "v25.0",
)


# ======================================================
# NORMALIZAR TELEFONE BRASILEIRO
# ======================================================

def normalizar_telefone(telefone):
    numero = re.sub(r"\D", "", str(telefone or ""))

    if len(numero) in (10, 11):
        numero = "55" + numero

    if not numero.startswith("55"):
        return None

    if len(numero) not in (12, 13):
        return None

    return numero


# ======================================================
# ENVIAR TEMPLATE PELA META
# ======================================================

def enviar_template(
    telefone,
    nome_template,
    parametros,
    nomes_parametros=None,
):
    token = os.getenv("WHATSAPP_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    if not token or not phone_number_id:
        logger.error(
            "WhatsApp: token ou Phone Number ID não configurado."
        )
        return False

    destinatario = normalizar_telefone(telefone)

    if not destinatario:
        logger.error(
            "WhatsApp: telefone do destinatário inválido."
        )
        return False

    if nomes_parametros is not None:
        if len(nomes_parametros) != len(parametros):
            logger.error(
                "WhatsApp: quantidade de nomes e parâmetros diferente."
            )
            return False

    url = (
        f"https://graph.facebook.com/"
        f"{GRAPH_API_VERSION}/"
        f"{phone_number_id}/messages"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    parametros_formatados = []

    for indice, parametro in enumerate(parametros):
        item = {
            "type": "text",
            "text": str(parametro),
        }

        if nomes_parametros is not None:
            item["parameter_name"] = nomes_parametros[indice]

        parametros_formatados.append(item)

    dados = {
        "messaging_product": "whatsapp",
        "to": destinatario,
        "type": "template",
        "template": {
            "name": nome_template,
            "language": {
                "code": "pt_BR",
            },
            "components": [
                {
                    "type": "body",
                    "parameters": parametros_formatados,
                }
            ],
        },
    }

    try:
        resposta = requests.post(
            url,
            headers=headers,
            json=dados,
            timeout=10,
        )

        if resposta.ok:
            logger.info(
                "WhatsApp: solicitação aceita pela Meta. "
                "Template=%s | HTTP=%s",
                nome_template,
                resposta.status_code,
            )
            return True

        try:
            corpo_erro = resposta.json()
            erro_meta = corpo_erro.get("error", {})

            if not isinstance(erro_meta, dict):
                erro_meta = {}

        except (ValueError, AttributeError):
            erro_meta = {}

        logger.error(
            "WhatsApp recusou template=%s | "
            "HTTP=%s | codigo=%s | "
            "subcodigo=%s | mensagem=%s | detalhes=%s",
            nome_template,
            resposta.status_code,
            erro_meta.get("code"),
            erro_meta.get("error_subcode"),
            erro_meta.get("message"),
            erro_meta.get("error_data", {}).get("details")
            if isinstance(erro_meta.get("error_data"), dict)
            else None,
        )

        return False

    except requests.RequestException:
        logger.exception(
            "WhatsApp: erro de conexão com a Meta."
        )
        return False


# ======================================================
# ALERTA AUTOMÁTICO DE MEDICAMENTO ATRASADO
# ======================================================

def enviar_whatsapp(medicamento, horario, telefone):
    return enviar_template(
        telefone=telefone,
        nome_template="medicamento_atrasado",
        parametros=[
            medicamento,
            horario,
        ],
    )


# ======================================================
# ALERTA MANUAL DO BOTÃO SOS
# ======================================================

def enviar_sos_whatsapp(nome_paciente, telefone):
    return enviar_template(
        telefone=telefone,
        nome_template="alerta_sos",
        parametros=[
            nome_paciente,
        ],
        nomes_parametros=[
            "nome_paciente",
        ],
    )


# ======================================================
# ALERTA DE MEDICAMENTO ACABANDO
# ======================================================

def enviar_whatsapp_estoque(
    nome_paciente,
    nome_medicamento,
    dias_restantes,
    telefone,
):
    return enviar_template(
        telefone=telefone,
        nome_template="medicamento_acabando",
        parametros=[
            nome_paciente,
            nome_medicamento,
            str(dias_restantes),
        ],
    )
