# 💊 LembraFácil — Backend

Backend do projeto LembraFácil, responsável pelo gerenciamento de usuários,
medicamentos, horários, pacientes, cuidadores e registros de medicação.

## 🚀 Funcionalidades

* Cadastro e autenticação de usuários com JWT
* Cadastro, consulta, atualização e exclusão de medicamentos
* Cadastro de horários dos medicamentos
* Registro de medicamentos tomados
* Gerenciamento de pacientes
* Gerenciamento de cuidadores
* Vinculação entre cuidador e paciente
* Identificação de doses em atraso (em desenvolvimento)

## 🛠️ Tecnologias utilizadas

* Python
* Django
* Django REST Framework
* djangorestframework-simplejwt (JWT)
* SQLite
* django-cors-headers

## ▶️ Como rodar

```bash
git clone https://github.com/IcaroVeras/LembraFacil-Backend-2.0.git
cd LembraFacil-Backend-2.0

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

O banco `db.sqlite3` é criado automaticamente no `migrate`. Ele não é versionado,
então cada pessoa começa com um banco vazio.

Para testar pelo celular, os dois aparelhos precisam estar no mesmo Wi-Fi, e o IP
do computador deve estar em `ALLOWED_HOSTS` no `config/settings.py`.

## 🔐 Autenticação

A API utiliza autenticação JWT.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/usuarios/cadastro/` | Cria uma conta |
| POST | `/api/token/` | Login (devolve os tokens access e refresh) |
| POST | `/api/token/refresh/` | Renova o token de acesso |

As demais rotas exigem o header `Authorization: Bearer <access_token>`.

## 💊 Medicamentos

A API permite cadastrar e gerenciar:

* Nome do medicamento
* Dose
* Quantidade
* Horário
* Frequência
* Duração
* Observação
* Status do medicamento

Cada medicamento é associado ao usuário autenticado, e cada usuário só enxerga
os próprios medicamentos.

| Método | Rota | Descrição |
|---|---|---|
| GET, POST | `/api/medicamentos/` | Lista e cadastra |
| GET, PATCH, DELETE | `/api/medicamentos/<id>/` | Detalhe, edição e exclusão |

## ⏰ Registros de dose

O sistema registra se cada dose foi tomada ou não.

| Método | Rota | Descrição |
|---|---|---|
| GET, POST | `/api/registros/` | Lista e cria registros |
| PATCH | `/api/registros/<id>/` | Confirma a dose como tomada |

Está prevista uma rotina para identificar doses não confirmadas no horário esperado.

## 👨‍👩‍👧 Pacientes e cuidadores

O backend possui estrutura para gerenciar pacientes e cuidadores, permitindo criar
vínculos para acompanhar a rotina de medicamentos.

## 📲 Notificações

Está prevista a integração de notificações automáticas para avisar o familiar ou
cuidador quando uma dose não for confirmada dentro do horário esperado.

## 📱 Aplicativo

O frontend (React Native com Expo) está em:
https://github.com/IcaroVeras/LembraFacil-Frontend-2.0

## 🎯 Objetivo

Fornecer a estrutura de backend necessária para que o aplicativo LembraFácil possa
controlar medicamentos, horários e o acompanhamento da rotina de medicação de forma
organizada e segura.

## 🚧 Status

Projeto em desenvolvimento.
