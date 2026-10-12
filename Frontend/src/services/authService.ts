
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

type RefreshResponse = {
  access: string;
  refresh?: string;
};

// Evita várias renovações simultâneas
let renovacaoEmAndamento: Promise<string | null> | null = null;

// LOGIN
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

// CADASTRO E LOGIN
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

// CONSULTAR TOKENS SALVOS
export async function pegarAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function pegarRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

// VERIFICAR EXPIRAÇÃO DO JWT
function tokenValido(token: string): boolean {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      return false;
    }

    // Compatível com React Native / Expo
    const base64 = partes[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const caracteres =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    let bits = 0;
    let valor = 0;
    let resultado = "";

    for (const caractere of base64.replace(/=+$/, "")) {
      const indice = caracteres.indexOf(caractere);

      if (indice < 0) {
        return false;
      }

      valor = (valor << 6) | indice;
      bits += 6;

      if (bits >= 8) {
        bits -= 8;
        resultado += String.fromCharCode(
          (valor >> bits) & 255
        );
      }
    }

    const payload = JSON.parse(resultado);

    if (typeof payload.exp !== "number") {
      return false;
    }

    // Margem de segurança de 30 segundos
    return payload.exp * 1000 > Date.now() + 30000;
  } catch {
    return false;
  }
}

// RENOVAÇÃO AUTOMÁTICA
export async function renovarAccessToken(): Promise<string | null> {
  if (renovacaoEmAndamento) {
    return renovacaoEmAndamento;
  }

  renovacaoEmAndamento = executarRenovacao();

  try {
    return await renovacaoEmAndamento;
  } finally {
    renovacaoEmAndamento = null;
  }
}

async function executarRenovacao(): Promise<string | null> {
  const refresh = await pegarRefreshToken();

  if (!refresh) {
    return null;
  }

  try {
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
      if (response.status === 401 || response.status === 403) {
        await logout();
      }

      return null;
    }

    const dados: RefreshResponse = await response.json();

    if (!dados.access || !tokenValido(dados.access)) {
      return null;
    }

    const itens: [string, string][] = [
      [ACCESS_TOKEN_KEY, dados.access],
    ];

    // Compatível com rotação de refresh tokens
    if (dados.refresh) {
      itens.push([REFRESH_TOKEN_KEY, dados.refresh]);
    }

    await AsyncStorage.multiSet(itens);

    return dados.access;
  } catch (erro) {
    console.error("Erro ao renovar sessão:", erro);
    return null;
  }
}

// VERIFICAR SE ESTÁ LOGADO
export async function estaLogado(): Promise<boolean> {
  const token = await pegarAccessToken();

  if (token && tokenValido(token)) {
    return true;
  }

  const renovado = await renovarAccessToken();

  return !!renovado;
}

// OBTER TOKEN VÁLIDO PARA REQUISIÇÕES
export async function obterTokenValido(): Promise<string | null> {
  const token = await pegarAccessToken();

  if (token && tokenValido(token)) {
    return token;
  }

  return renovarAccessToken();
}

// SAIR DA CONTA
export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);
}
