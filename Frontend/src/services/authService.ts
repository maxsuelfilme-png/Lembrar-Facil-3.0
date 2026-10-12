
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_ONLINE =
  "https://lembrar-facil-30-production.up.railway.app/api";

const API_LOCAL =
  "http://192.168.1.100:8000/api";

export const MODO_API: "online" | "local" = "online";

export const API_URL =
  MODO_API === "online" ? API_ONLINE : API_LOCAL;

const ACCESS_TOKEN_KEY = "@lembrafacil:access_token";
const REFRESH_TOKEN_KEY = "@lembrafacil:refresh_token";

type LoginResponse = {
  access: string;
  refresh: string;
};

export async function fazerLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username.trim(),
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      "Não foi possível entrar. Confira seu usuário e senha."
    );
  }

  const dados: LoginResponse = await response.json();

  if (!dados.access || !dados.refresh) {
    throw new Error(
      "O servidor não retornou os tokens de autenticação."
    );
  }

  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, dados.access],
    [REFRESH_TOKEN_KEY, dados.refresh],
  ]);

  return dados;
}

export async function cadastrarEFazerLogin(
  username: string,
  nome: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/usuarios/cadastro/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        nome: nome.trim(),
        password,
      }),
    }
  );

  if (!response.ok) {
    const erro = await response.json().catch(() => null);

    const mensagem = erro
      ? Object.values(erro)
          .flat()
          .map(String)
          .join("\n")
      : "Não foi possível realizar o cadastro.";

    throw new Error(mensagem);
  }

  return fazerLogin(username, password);
}

export async function pegarAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function pegarRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function renovarAccessToken(): Promise<string | null> {
  const refresh = await pegarRefreshToken();

  if (!refresh) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/token/refresh/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    }
  );

  if (!response.ok) {
    await logout();
    return null;
  }

  const dados: { access?: string } = await response.json();

  if (!dados.access) {
    await logout();
    return null;
  }

  await AsyncStorage.setItem(
    ACCESS_TOKEN_KEY,
    dados.access
  );

  return dados.access;
}

export async function estaLogado(): Promise<boolean> {
  const token = await pegarAccessToken();

  if (token) {
    return true;
  }

  const renovado = await renovarAccessToken();

  return !!renovado;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);
}
