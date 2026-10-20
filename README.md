# 💙💚 LembraFácil 3.0

### Tecnologia que cuida de vidas

O **LembraFácil** é um projeto de tecnologia desenvolvido para auxiliar pessoas idosas na organização e no acompanhamento de seus medicamentos, promovendo mais autonomia, segurança e tranquilidade para seus familiares e cuidadores.

O projeto reúne um aplicativo mobile, uma API backend e um portal web para farmácias parceiras.

## 🌐 Portal Web das Farmácias

**Acesse o portal publicado:**

https://lembrafacil-farmacias.vercel.app

O Portal Web LembraFácil permite que farmácias parceiras gerenciem seus medicamentos e mantenham seus dados atualizados.

### Funcionalidades do portal

- Login de farmácias com autenticação.
- Painel administrativo com indicadores.
- Cadastro, edição e exclusão de medicamentos.
- Consulta de preços e quantidades em estoque.
- Identificação de medicamentos com estoque baixo.
- Atualização dos dados da farmácia.
- Configuração de informações de entrega.
- Interface responsiva para computadores e celulares.

## 📱 Aplicativo Mobile

O aplicativo foi desenvolvido com **React Native, Expo e TypeScript**.

### Principais funcionalidades

- Cadastro e autenticação de usuários.
- Cadastro e gerenciamento de medicamentos.
- Registro de dosagens, horários e frequência.
- Leitura de receitas médicas com OCR.
- Revisão das informações identificadas na receita.
- Organização da rotina de medicamentos.
- Cadastro de contato familiar ou cuidador.
- Alertas de atraso de medicação via WhatsApp.
- Consulta de medicamentos em farmácias parceiras.

O objetivo é facilitar o acompanhamento da medicação e contribuir para uma rotina de cuidados mais organizada.

## 🧠 Backend e API

O backend do LembraFácil foi desenvolvido com **Python, Django e Django REST Framework**.

### Responsabilidades

- Gerenciamento de usuários e autenticação JWT.
- Cadastro e consulta de medicamentos.
- Controle de horários e confirmações de doses.
- Gerenciamento de pacientes e cuidadores.
- Gerenciamento de farmácias parceiras.
- Cadastro e controle de produtos das farmácias.
- Integração com a API oficial do WhatsApp.
- Processamento de rotinas automatizadas.

A API está hospedada no **Railway**, utilizando **PostgreSQL** como banco de dados.

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Aplicativo mobile | React Native, Expo, TypeScript |
| Portal Web | React, Vite, TypeScript, CSS |
| Backend | Python, Django, Django REST Framework |
| Autenticação | JWT |
| Banco de dados | PostgreSQL |
| Reconhecimento de receitas | OCR.space |
| Notificações | WhatsApp Cloud API |
| Hospedagem da API | Railway |
| Hospedagem do portal | Vercel |
| Versionamento | Git e GitHub |

## 📂 Estrutura do projeto

```text
Lembrar-Facil-3.0/
│
├── Backend/
│   └── API Django REST
│
├── Frontend/
│   └── Aplicativo React Native + Expo
│
├── WebFarmacia/
│   └── Portal Web React + Vite
│
└── README.md
```

## 🚀 Como executar o projeto

### Backend Django

Acesse a pasta do backend, prepare o ambiente Python, instale as dependências conforme a configuração do projeto e execute:

```bash
python manage.py migrate
python manage.py runserver
```

As variáveis de ambiente necessárias devem ser configuradas localmente. Não publique tokens ou credenciais.

### Aplicativo Mobile

```bash
cd Frontend
npm install
npx expo start
```

### Portal Web das Farmácias

```bash
cd WebFarmacia
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
```

## 🏥 Integração com farmácias

O LembraFácil permite que usuários consultem a disponibilidade de medicamentos cadastrados pelas farmácias parceiras.

O contato para compra é realizado diretamente com o estabelecimento.

O projeto não realiza pagamentos ou vendas de medicamentos dentro do aplicativo.

## 🔐 Segurança

- Autenticação com JWT.
- Proteção de endpoints de usuários autenticados.
- Controle de acesso às informações da farmácia.
- Comunicação com serviços publicados via HTTPS.
- Variáveis de ambiente para configurações sensíveis.

**Atenção:** não incluir senhas, tokens ou arquivos `.env` no repositório público.

## 🎯 Objetivo do projeto

Utilizar a tecnologia para contribuir com a qualidade de vida da pessoa idosa, auxiliando no uso organizado de medicamentos e fortalecendo a comunicação entre pacientes, familiares, cuidadores e farmácias parceiras.

## 📈 Próximas evoluções

- Aprimoramento da experiência do usuário.
- Expansão da rede de farmácias parceiras.
- Evolução dos recursos de acompanhamento de medicamentos.
- Melhorias na acessibilidade.
- Novas funcionalidades de apoio aos cuidadores.

## 👨‍💻 Desenvolvimento

Projeto acadêmico desenvolvido na área de **Análise e Desenvolvimento de Sistemas (ADS)**.

**Repositório:** https://github.com/maxsuelfilme-png/Lembrar-Facil-3.0

**Portal das Farmácias:** https://lembrafacil-farmacias.vercel.app

---

**LembraFácil — Tecnologia a serviço do cuidado.** 💙💚
