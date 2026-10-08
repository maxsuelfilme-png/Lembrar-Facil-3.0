
import os
import re
import requests


def normalizar_telefone(telefone):
    """
    Remove caracteres especiais e adiciona
    o código do Brasil quando necessário.
    """

    numero = re.sub(r"\D", "", str(telefone or ""))

    if len(numero) in (10, 11):
        numero = "55" + numero

    if not numero.startswith("55"):
        return None

    if len(numero) not in (12, 13):
        return None

    return numero


def enviar_whatsapp(medicamento, horario, telefone):
    """
    Envia alerta de medicamento atrasado
    ao telefone do familiar cadastrado.
    """

    token = os.getenv("WHATSAPP_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    if not token or not phone_number_id:
        print("ERRO: Configuracoes da Meta nao encontradas.")
        return False

    destinatario = normalizar_telefone(telefone)

    if not destinatario:
        print("ERRO: Telefone do familiar invalido.")
        return False

    url = (
        f"https://graph.facebook.com/v25.0/"
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

        if resposta.ok:
            print("Mensagem aceita pela Meta!")
            return True

        print("Erro ao enviar WhatsApp.")
        return False

    except requests.RequestException as erro:
        print("Erro de conexao com a Meta:", erro)
        return False
