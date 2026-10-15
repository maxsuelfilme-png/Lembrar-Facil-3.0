# 💚 LembraFácil

### Cuidando da sua rotina com carinho 💊

O **LembraFácil** é um aplicativo mobile desenvolvido para auxiliar pessoas idosas na organização de seus medicamentos, oferecendo uma interface simples, acessível e intuitiva.

O projeto busca facilitar o acompanhamento dos horários de medicação e permitir que familiares ou cuidadores participem do cuidado com a saúde da pessoa idosa.

O aplicativo é desenvolvido com **React Native, Expo e TypeScript**, integrado a uma API REST construída com **Python e Django REST Framework**, utilizando **PostgreSQL** e hospedagem na plataforma **Railway**.

---

## 🎯 Objetivo do projeto

Desenvolver uma solução tecnológica que contribua para a autonomia, segurança e qualidade de vida das pessoas idosas, facilitando o gerenciamento de medicamentos e o acompanhamento da rotina de cuidados.

O LembraFácil foi idealizado como um projeto acadêmico do curso de **Análise e Desenvolvimento de Sistemas (ADS)**.

## 📱 Funcionalidades

### 👴 Área do idoso
- Interface acessível e intuitiva.
- Acesso inicial sem necessidade de digitar usuário e senha.
- Cadastro e gerenciamento de medicamentos.
- Consulta da rotina diária.
- Visualização dos horários de medicação.
- Identificação de medicamentos pendentes, atrasados e tomados.
- Confirmação manual da medicação pelo botão **TOMEI O MEDICAMENTO**.

### 👨‍👩‍👧 Área da família
- Autenticação com usuário e senha.
- Área destinada a familiares e cuidadores.
- Cadastro e consulta de informações.
- Estrutura para acompanhamento de pacientes vinculados.

### 📷 Leitura de receitas
- Utilização da câmera ou galeria do celular.
- Integração com OCR.space para reconhecimento de texto.
- Extração de informações da receita.
- Revisão e correção manual antes de salvar.
- Cadastro dos medicamentos identificados.

**Importante:** o reconhecimento de texto não substitui a conferência da receita médica. Os dados devem ser revisados antes de serem cadastrados.

### 🔔 Lembretes de medicamentos
O projeto possui integração em desenvolvimento com o `expo-notifications` para agendamento de notificações locais.

A entrega dos lembretes depende das permissões do Android, da configuração do aplicativo e de uma versão compatível do APK.

Essa funcionalidade ainda requer validação em dispositivo físico.

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Frontend | React Native, Expo, TypeScript |
| Navegação | Expo Router |
| Backend | Python, Django |
| API | Django REST Framework |
| Autenticação | JWT / SimpleJWT |
| Banco de dados | PostgreSQL |
| Hospedagem | Railway |
| OCR | OCR.space |
| Notificações | Expo Notifications |
| Versionamento | Git e GitHub |
| Desenvolvimento | Visual Studio Code |

## 🏗️ Arquitetura do sistema

```text
                 LEMBRAFÁCIL
                      |
               APLICATIVO MOBILE
             React Native + Expo
                      |
                 API REST
            Django REST Framework
                      |
               AUTENTICAÇÃO JWT
                      |
                 POSTGRESQL
                      |
                   RAILWAY
```

O frontend é responsável pela interface e interação com o usuário.

O backend gerencia a autenticação, os medicamentos, os pacientes, os cuidadores e os registros da rotina.

O banco de dados PostgreSQL armazena as informações persistentes do sistema.

## 📂 Estrutura do projeto

```text
LembraFacil/
│
├── Frontend/
│   ├── app/
│   │   ├── index.tsx
│   │   ├── idoso.tsx
│   │   ├── familia.tsx
│   │   ├── receita.tsx
│   │   ├── medicamentos.tsx
│   │   └── rotina.tsx
│   │
│   ├── src/
│   │   ├── screens/
│   │   │   ├── IdosoScreen.tsx
│   │   │   ├── FamiliaScreen.tsx
│   │   │   ├── ReceitaScreen.tsx
│   │   │   ├── MedicamentosScreen.tsx
│   │   │   └── RotinaScreen.tsx
│   │   │
│   │   └── services/
│   │       ├── authService.ts
│   │       ├── medicamentosService.ts
│   │       ├── registrosService.ts
│   │       └── lembretesService.ts
│   │
│   ├── assets/
│   ├── app.json
│   ├── eas.json
│   └── package.json
│
└── Backend/
    ├── medicamentos/
    ├── pacientes/
    ├── cuidadores/
    ├── usuarios/
    ├── receitas/
    ├── horarios/
    ├── confirmacoes/
    └── manage.py
```

*A estrutura representa os principais diretórios e arquivos do projeto.*

## 🔐 Autenticação

O LembraFácil utiliza autenticação JWT para proteger o acesso à API.

O sistema possui fluxos de autenticação separados para a pessoa idosa e para o familiar.

**Idoso:** pode iniciar uma sessão própria sem precisar preencher um formulário de login tradicional.

**Familiar:** utiliza credenciais de acesso.

As requisições protegidas utilizam o cabeçalho:

```http
Authorization: Bearer TOKEN_DE_ACESSO
```

Cada operação deve respeitar as permissões do usuário autenticado.

## 💊 Rotina de medicamentos

A tela **Minha Rotina** permite acompanhar os medicamentos cadastrados.

Os medicamentos são apresentados com informações como nome, dosagem, quantidade, horário, frequência e duração.

Os estados exibidos são:

- 🟡 **A tomar:** horário ainda não atingido.
- 🔴 **Atrasado:** horário previsto ultrapassado, sem confirmação.
- 🟢 **Tomado:** medicamento confirmado pelo usuário.

Ao pressionar **TOMEI O MEDICAMENTO**, o aplicativo envia a confirmação para o backend, permitindo atualizar o registro da rotina.

A confirmação é manual e não representa uma verificação automática da ingestão do medicamento.

## 🌐 API e hospedagem

O backend do LembraFácil está configurado para hospedagem na Railway.

**Endereço da API:**

https://lembrar-facil-30-production.up.railway.app/api

A API possui recursos para autenticação, medicamentos, pacientes, cuidadores e acompanhamento da rotina.

A disponibilidade dos endpoints depende da implantação e das permissões de acesso.

## 💻 Executando o frontend

### Pré-requisitos

- Node.js
- NPM
- Git
- Expo
- Android ou emulador

Clone o repositório:

```bash
git clone URL_DO_SEU_REPOSITORIO
```

Acesse o frontend:

```bash
cd Frontend
```

Instale as dependências:

```bash
npm install
```

Inicie o Expo:

```bash
npx expo start -c
```

Para executar funcionalidades nativas que não são suportadas no Expo Go, utilize uma compilação Android compatível.

## 🐍 Executando o backend

Acesse a pasta:

```bash
cd Backend
```

Crie um ambiente virtual:

```bash
python -m venv venv
```

Ative no Windows:

```cmd
venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Configure as variáveis de ambiente e a conexão com o banco de dados.

Execute as migrações:

```bash
python manage.py migrate
```

Inicie o servidor:

```bash
python manage.py runserver
```

**Observação:** credenciais, chaves secretas e dados de acesso ao banco não devem ser publicados no GitHub.

## 📦 Gerando o APK Android

O aplicativo pode ser compilado utilizando o Expo Application Services (EAS).

Instale o EAS CLI:

```bash
npm install -g eas-cli
```

Entre na conta Expo:

```bash
eas login
```

Gere uma versão de teste:

```bash
eas build -p android --profile preview
```

O perfil `preview` deve estar configurado no `eas.json` para gerar um arquivo APK.

Após a compilação, o EAS disponibiliza um link para instalação no dispositivo Android.

## 🔄 Atualizando o projeto no GitHub

Para registrar e enviar as alterações:

```bash
git status
git add .
git commit -m "Atualiza funcionalidades do LembraFacil"
git push origin main
```

Para atualizações do aplicativo já instalado, pode ser necessário gerar um novo APK, especialmente quando houver alterações em dependências ou configurações nativas.

## 🚧 Funcionalidades em evolução

- Validação dos lembretes automáticos no Android.
- Aprimoramento do acompanhamento familiar.
- Melhorias na leitura e interpretação de receitas.
- Aperfeiçoamento das regras de frequência e duração dos tratamentos.
- Evolução das notificações e alertas.
- Melhorias contínuas na acessibilidade e na experiência do usuário.

## 🎓 Contexto acadêmico

O LembraFácil é um projeto desenvolvido no contexto do curso de **Análise e Desenvolvimento de Sistemas**, com aplicação prática de conceitos de programação mobile, desenvolvimento backend, APIs REST, autenticação, banco de dados e integração entre sistemas.

O projeto também procura demonstrar como a tecnologia pode contribuir para a inclusão digital e o cuidado com pessoas idosas.

## 💚 Nossa missão

**Utilizar a tecnologia para tornar a rotina de medicamentos mais simples, organizada e acessível, promovendo autonomia e aproximando familiares e cuidadores.**

---

**LembraFácil — Cuidando da sua rotina com carinho. 💚**
