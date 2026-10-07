# 💊 LembraFácil 3.0

O **LembraFácil** é um aplicativo para auxiliar no controle da rotina de medicamentos, especialmente de pessoas idosas.

O sistema permite cadastrar medicamentos, organizar horários, confirmar doses, realizar leitura de receitas e avisar um familiar/cuidador pelo WhatsApp quando um medicamento estiver atrasado.

---

## 🚀 Principais funcionalidades

- 🔐 Login com autenticação JWT
- 👴 Área do idoso
- 👨‍👩‍👧 Área da família/cuidador
- 💊 Cadastro de medicamentos
- ⏰ Controle dos horários
- ✅ Confirmação de medicamento tomado
- 📋 Rotina diária
- 📷 Leitura de receitas com OCR
- ⚠️ Identificação de medicamentos atrasados
- 📱 Integração com WhatsApp
- 🤖 Verificação automática com APScheduler

---

# 🛠️ Tecnologias utilizadas

## Backend

- Python
- Django
- Django REST Framework
- Simple JWT
- Django CORS Headers
- Pillow
- python-dotenv
- Requests
- APScheduler
- SQLite

## Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- AsyncStorage

## Integrações

- OCR
- Meta WhatsApp Cloud API

---

# 📥 Baixando o projeto

Clone o repositório:

```bash
git clone https://github.com/maxsuelfilme-png/Lembrar-Facil-3.0.git
```

Entre na pasta:

```bash
cd Lembrar-Facil-3.0
```

---

# 🐍 Configuração do Backend

Entre na pasta Backend:

```bash
cd Backend
```

## 1. Criar ambiente virtual

No Windows:

```bash
python -m venv venv
```

Ative o ambiente:

```bash
venv\Scripts\activate
```

Quando estiver ativado, deverá aparecer:

```text
(venv)
```

no início do terminal.

---

## 2. Instalar as dependências

A forma recomendada é:

```bash
pip install -r requirements.txt
```

Caso seja necessário instalar manualmente as principais bibliotecas:

```bash
pip install Django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install Pillow
pip install python-dotenv
pip install requests
pip install APScheduler
```

Também é possível instalar de uma vez:

```bash
pip install Django djangorestframework djangorestframework-simplejwt django-cors-headers Pillow python-dotenv requests APScheduler
```

---

## 3. Atualizar o requirements.txt

Depois de instalar novas bibliotecas:

```bash
pip freeze > requirements.txt
```

---

## 4. Configurar o arquivo .env

Crie:

```text
Backend/.env
```

Exemplo:

```env
WHATSAPP_TOKEN=SEU_TOKEN_DA_META
WHATSAPP_PHONE_NUMBER_ID=SEU_PHONE_NUMBER_ID
WHATSAPP_DESTINATARIO=NUMERO_DO_FAMILIAR
```

⚠️ Nunca envie o arquivo `.env` para o GitHub.

---

## 5. Criar as migrações

```bash
python manage.py makemigrations
```

Depois:

```bash
python manage.py migrate
```

---

## 6. Criar usuário administrador

```bash
python manage.py createsuperuser
```

Informe:

```text
Username:
Email:
Password:
```

---

## 7. Rodar o Backend

```bash
python manage.py runserver 0.0.0.0:8000
```

O servidor será iniciado na porta:

```text
8000
```

Ao iniciar corretamente, a automação também deverá apresentar:

```text
Automacao do LembraFacil iniciada.
```

A verificação dos medicamentos atrasados será executada automaticamente pelo APScheduler.

---

# 📱 Configuração do Frontend

Abra outro terminal.

Entre na pasta Frontend:

```bash
cd Frontend
```

Instale as dependências:

```bash
npm install
```

Caso o Expo apresente problemas:

```bash
npx expo install
```

Para iniciar:

```bash
npx expo start
```

---

# 🌐 Configuração da API

No Frontend, configure o endereço do computador onde o Django está rodando.

Exemplo:

```typescript
export const API_URL = "http://SEU_IP:8000/api";
```

Para descobrir o IP no Windows:

```bash
ipconfig
```

Procure o endereço IPv4 da rede utilizada.

Exemplo:

```text
IPv4: 192.168.0.100
```

Então:

```typescript
export const API_URL = "http://192.168.0.100:8000/api";
```

O mesmo IP precisa estar autorizado no `ALLOWED_HOSTS` do Django.

Exemplo:

```python
ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "192.168.0.100",
]
```

---

# 🔑 Principais rotas da API

```text
/api/medicamentos/
/api/horarios/
/api/confirmacoes/
/api/receitas/
/api/usuarios/
/api/pacientes/
/api/cuidadores/
/api/token/
/api/token/refresh/
```

---

# ⏰ Automação de medicamentos atrasados

O LembraFácil utiliza o APScheduler.

Fluxo:

```text
Horário do medicamento
        ↓
Paciente não confirma
        ↓
Tempo de tolerância é ultrapassado
        ↓
Backend identifica o atraso
        ↓
APScheduler executa a verificação
        ↓
WhatsApp Cloud API
        ↓
Familiar/cuidador recebe o alerta
```

Para testar manualmente a verificação:

```bash
python manage.py verificar_atrasos
```

Normalmente esse comando não precisa ser executado manualmente, pois o APScheduler realiza a verificação automaticamente enquanto o Backend estiver rodando.

---

# 🔐 Segurança

Nunca publique:

```text
.env
Tokens da Meta
Senhas
Chaves secretas
Credenciais
```

O `.gitignore` deve incluir:

```gitignore
.env
venv/
__pycache__/
*.pyc
node_modules/
.expo/
```

---

# 🔄 Comandos Git

Verificar alterações:

```bash
git status
```

Adicionar alterações:

```bash
git add .
```

Criar commit:

```bash
git commit -m "Atualizar projeto"
```

Enviar para o GitHub:

```bash
git push
```

Para baixar as alterações mais recentes em outro computador:

```bash
git pull
```

---

# ▶️ Resumo para rodar o projeto

## Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Frontend

Em outro terminal:

```bash
cd Frontend
npm install
npx expo start
```

---

# 🎓 Projeto acadêmico

Projeto desenvolvido no curso de **Análise e Desenvolvimento de Sistemas (ADS)**.

**O objetivo do LembraFácil é utilizar tecnologia para auxiliar pacientes, familiares e cuidadores na organização e acompanhamento da rotina de medicamentos**.

---

# 👨‍💻 LembraFácil 3.0

Desenvolvido por Maxsuel José e Icaro Veras.