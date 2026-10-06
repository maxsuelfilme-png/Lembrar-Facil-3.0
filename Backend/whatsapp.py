import os
import requests


def enviar_whatsapp(medicamento, horario):
    token = os.getenv("WHATSAPP_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    destinatario = os.getenv("WHATSAPP_DESTINATARIO")

    if not token or not phone_number_id or not destinatario:
        print("ERRO: Configuracoes do WhatsApp nao encontradas.")
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

        if resposta.ok:
            print("WhatsApp enviado com sucesso!")
            return True

        print("Erro ao enviar WhatsApp!")
        return False

    except requests.RequestException as erro:
        print("Erro de conexao com a Meta:")
        print(erro)
        return False