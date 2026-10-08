
import os
import re
import requests


def normalizar_telefone(telefone):
    numero = re.sub(r"\D", "", str(telefone or ""))

    if len(numero) in (10, 11):
        numero = "55" + numero

    if not numero.startswith("55"):
        return None

    if len(numero) not in (12, 13):
        return None

    return numero


def enviar_whatsapp(medicamento, horario, telefone):
    token = os.getenv("WHATSAPP_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    if not token or not phone_number_id:
        print("Configurações da Meta não encontradas.")
        return False

    destinatario = normalizar_telefone(telefone)

    if not destinatario:
        print("Telefone inválido.")
        return False

    url = f"https://graph.facebook.com/v25.0/{phone_number_id}/messages"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    dados = {
        "messaging_product": "whatsapp",
        "to": destinatario,
        "type": "template",
        "template": {
            "name": "medicamento_atrasado",
            "language": {
                "code": "pt_BR"
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": str(medicamento)
                        },
                        {
                            "type": "text",
                            "text": str(horario)
                        }
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
            timeout=20
        )

        print("STATUS META:", resposta.status_code)
        print("RESPOSTA META:", resposta.text)

        return resposta.ok

    except requests.RequestException as erro:
        print("Erro ao enviar WhatsApp:", erro)
        return False
