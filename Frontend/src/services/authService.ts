import AsyncStorage from "@react-native-async-storage/async-storage";

// IP do computador onde o VIVERBACK está rodando
export const API_URL = "http://10.41.236.233:8000/api";

const ACCESS_TOKEN_KEY = "@lembrafacil:access_token";
const REFRESH_TOKEN_KEY = "@lembrafacil:refresh_token";

type LoginResponse = {
  access: string;
  refresh: string;
};

// ======================================================
// LOGIN
//======================================================

export async function fazerLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/token/`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const corpo = await response.text();
    console.log("Login falhou:", response.status, corpo);
    throw new Error("Usuário ou senha inválidos.");
  }

  const dados: LoginResponse = await response.json();

  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, dados.access],
    [REFRESH_TOKEN_KEY, dados.refresh],
  ]);

  return dados;
}

// ======================================================
// CADASTRO + LOGIN AUTOMÁTICO
// ======================================================

export async function cadastrarEFazerLogin(
  username: string,
  nome: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/usuarios/cadastro/ `, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({ username, nome, password }),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => null);
    console.log("Cadastro falhou:", response.status, erro);

    // O DRF devolve algo como {"username": ["..."], "password": ["..."]}
    const mensagem = erro
      ? Object.values(erro).flat().join("\n")
      : "Erro ao cadastrar.";

    throw new Error(mensagem);
  }

  // Cadastro ok: entra automaticamente com os mesmos dados
  return fazerLogin(username, password);
}

// ======================================================
// PEGAR ACCESS TOKEN
// ======================================================

export async function pegarAccessToken(): Promise<string | null> {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

// ======================================================
// PEGAR REFRESH TOKEN
// ======================================================

export async function pegarRefreshToken(): Promise<string | null> {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

// ======================================================
// RENOVAR ACCESS TOKEN
// ======================================================

export async function renovarAccessToken(): Promise<string> {
  const refresh = await pegarRefreshToken();

  if (!refresh) {
    throw new Error("Usuário não autenticado.");
  }

  const response = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      refresh,
    }),
  });

  if (!response.ok) {
    await logout();
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const dados = await response.json();

  await AsyncStorage.setItem(
    ACCESS_TOKEN_KEY,
    dados.access
  );

  return dados.access;
}

// ======================================================
// VERIFICAR SE ESTÁ LOGADO
// ======================================================

export async function estaLogado(): Promise<boolean> {
  const token = await pegarAccessToken();

  return !!token;
}

// ======================================================
// LOGOUT
// ======================================================

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);
}