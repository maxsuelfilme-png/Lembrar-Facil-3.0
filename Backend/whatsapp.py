
import os
import re
import logging

import requests


logger = logging.getLogger(__name__)

GRAPH_API_VERSION = os.getenv(
    "WHATSAPP_GRAPH_API_VERSION",
    "v25.0"
)


def normalizar_telefone(telefone):
    numero = re.sub(r"\D", "", str(telefone or ""))

    if len(numero) in (10, 11):
        numero = "55" + numero

    if not numero.startswith("55"):
        return None

    if len(numero) not in (12, 13):
        return None

    return numero


def enviar_template(telefone, nome_template, parametros):
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

    url = (
        f"https://graph.facebook.com/"
        f"{GRAPH_API_VERSION}/"
        f"{phone_number_id}/messages"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    dados = {
        "messaging_product": "whatsapp",
        "to": destinatario,
        "type": "template",
        "template": {
            "name": nome_template,
            "language": {
                "code": "pt_BR"
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": str(parametro)
                        }
                        for parametro in parametros
                    ]
                }
            ]
        }
    }

    try:
        resposta = requests.post(
            url,
            headers=headers,
            json=dados,
            timeout=10
        )

        if resposta.ok:
            logger.info(
                "WhatsApp: solicitação aceita pela Meta. Template: %s",
                nome_template
            )
            return True

        logger.error(
            "WhatsApp: envio recusado. Template: %s | HTTP: %s",
            nome_template,
            resposta.status_code
        )
        return False

    except requests.RequestException:
        logger.exception(
            "WhatsApp: erro de conexão com a Meta."
        )
        return False


def enviar_whatsapp(medicamento, horario, telefone):
    return enviar_template(
        telefone=telefone,
        nome_template="medicamento_atrasado",
        parametros=[
            medicamento,
            horario
        ]
    )


def enviar_sos_whatsapp(nome_paciente, telefone):
    return enviar_template(
        telefone=telefone,
        nome_template="alerta_sos",
        parametros=[
            nome_paciente
        ]
    )
