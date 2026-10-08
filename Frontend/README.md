# 💚 LembraFácil 3.0

### Sistema de Gerenciamento de Medicamentos e Alertas Automáticos

O **LembraFácil** é um aplicativo desenvolvido para auxiliar pessoas idosas e seus familiares na organização e no acompanhamento de medicamentos.

O sistema permite cadastrar medicamentos, organizar horários, acompanhar a rotina e enviar alertas automáticos pelo WhatsApp ao familiar responsável quando uma dose não é confirmada no horário previsto.

## 🚀 Funcionalidades

- Cadastro e autenticação de usuários com JWT.
- Cadastro, edição, consulta e exclusão de medicamentos.
- Registro de dosagem, quantidade, horário, frequência e duração.
- Leitura de receitas médicas com auxílio de OCR e revisão dos dados identificados.
- Tela de acompanhamento da rotina de medicamentos.
- Cadastro do nome e WhatsApp do familiar responsável.
- Armazenamento dos dados em banco PostgreSQL.
- Identificação automática de medicamentos atrasados.
- Envio automático de alertas pelo WhatsApp Business Cloud API.
- Acesso ao backend hospedado online no Railway.

## 📲 Alertas automáticos pelo WhatsApp

O LembraFácil possui integração com a API oficial do WhatsApp da Meta.

**Funcionamento:**

1. O usuário cadastra um medicamento e seu horário.
2. Na tela Família, informa o nome e o WhatsApp do familiar responsável.
3. O Django armazena o contato no banco de dados.
4. O sistema verifica periodicamente os horários dos medicamentos.
5. Quando uma dose ultrapassa a tolerância configurada sem confirmação, o sistema registra o atraso.
6. O backend consulta o WhatsApp do familiar e solicita o envio de uma mensagem automática.

**Exemplo de mensagem:**

> Alerta de medicamento
>
> O medicamento Teste, previsto para 16:42, ainda não foi confirmado como tomado. Por favor, verifique a rotina do paciente.

**Status da integração:** envio e recebimento de mensagens validados em ambiente de testes da Meta. Nessa modalidade, os destinatários precisam estar autorizados. O uso com familiares em geral depende da configuração de produção da API.

## 🛠️ Tecnologias utilizadas

| Componente | Tecnologia |
|---|---|
| Frontend | React Native, Expo e TypeScript |
| Backend | Python, Django e Django REST Framework |
| Autenticação | JWT |
| Banco de dados | PostgreSQL |
| Hospedagem | Railway |
| Automação | APScheduler |
| Mensagens | WhatsApp Business Cloud API |
| Leitura de receitas | OCR |
| Versionamento | Git e GitHub |

## 📂 Estrutura do projeto

```text
Lembra-Facil/
├── Backend/
│   ├── config/
│   ├── medicamentos/
│   ├── horarios/
│   ├── confirmacoes/
│   ├── pacientes/
│   ├── cuidadores/
│   ├── usuarios/
│   ├── receitas/
│   ├── whatsapp.py
│   └── manage.py
│
├── Frontend/
│   ├── app/
│   ├── src/
│   │   ├── screens/
│   │   └── services/
│   └── package.json
│
└── README.md
```

## 💻 Como executar o projeto

### Backend

Entre na pasta `Backend`, crie e ative um ambiente virtual e instale as dependências:

```bash
python -m venv venv
```

No Windows:

```powershell
venv\Scripts\activate
```

Depois:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

É necessário configurar previamente as variáveis de ambiente e o banco de dados.

### Frontend

Entre na pasta `Frontend`:

```bash
npm install
npx expo start
```

Abra o aplicativo pelo Expo Go ou por uma versão de desenvolvimento compatível.

## ☁️ Backend online

O backend está hospedado no Railway:

https://lembrar-facil-30-production.up.railway.app

O aplicativo utiliza uma API REST para comunicação com o banco de dados e autenticação dos usuários.

## 🔐 Segurança

- Autenticação por tokens