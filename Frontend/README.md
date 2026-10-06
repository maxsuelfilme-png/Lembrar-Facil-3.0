# 💊 LembraFácil — Frontend

O LembraFácil é um aplicativo desenvolvido para auxiliar no controle da rotina de
medicamentos, facilitando o acompanhamento dos horários e das doses.

## 📱 Funcionalidades

- Login e cadastro de usuário
- Cadastro, edição e exclusão de medicamentos
- Visualização dos medicamentos cadastrados
- Leitura de receitas através de OCR
- Extração de informações da receita
- Edição e confirmação das informações antes de salvar
- Controle dos horários dos medicamentos
- Confirmação de doses tomadas
- Acompanhamento da rotina de medicação
- Aviso ao familiar/cuidador pelo WhatsApp
- Área destinada ao familiar/cuidador
- Identificação de doses em atraso (em desenvolvimento)

## 📷 Leitura de Receita com OCR

O aplicativo permite fotografar ou selecionar uma imagem de uma receita médica.

A tecnologia OCR transforma o conteúdo da imagem em texto para auxiliar na
identificação de informações como:

- Nome do medicamento
- Dosagem
- Quantidade
- Horário
- Frequência
- Duração do tratamento

As informações podem ser conferidas e corrigidas pelo usuário antes de serem salvas.

## 🛠️ Tecnologias utilizadas

- React Native
- Expo
- Expo Router
- TypeScript
- AsyncStorage
- Expo Camera
- Expo Image Picker
- API REST

## ▶️ Como rodar

Pré-requisitos: Node.js instalado e o aplicativo **Expo Go** no celular.

```bash
git clone https://github.com/IcaroVeras/LembraFacil-Frontend-2.0.git
cd LembraFacil-Frontend-2.0

npm install
npx expo start
```

Leia o QR Code com o Expo Go (Android) ou com a câmera (iPhone). O celular e o
computador precisam estar no **mesmo Wi-Fi**.

## 🔗 Backend

O aplicativo se comunica com uma API desenvolvida em Django REST Framework, para
autenticação e gerenciamento dos medicamentos e registros de dose.

Repositório do backend: https://github.com/IcaroVeras/LembraFacil-Backend-2.0

Para o app encontrar o servidor, edite o endereço em `src/services/authService.ts`:

```ts
export const API_URL = "http://IP_DO_SEU_COMPUTADOR:8000/api";
```

Use o IP do computador onde o backend está rodando (`ipconfig` no Windows) e inicie o
servidor com `python manage.py runserver 0.0.0.0:8000`. O IP precisa estar em
`ALLOWED_HOSTS` no `settings.py` do backend.

## 🎯 Objetivo

O objetivo do LembraFácil é tornar o controle de medicamentos mais simples e
organizado, especialmente para idosos, familiares e cuidadores.

## 🚧 Status

Projeto em desenvolvimento.
