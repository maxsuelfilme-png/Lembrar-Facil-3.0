
import AsyncStorage from "@react-native-async-storage/async-storage";

// ======================================================
// CONFIGURAÇÃO DA API
// ======================================================

const API_ONLINE =
  "https://lembrar-facil-30-production.up.railway.app/api";

const API_LOCAL =
  "http://192.168.1.100:8000/api";

export const MODO_API: "online" | "local" = "online";

export const API_URL =
  MODO_API === "online" ? API_ONLINE : API_LOCAL;

// ======================================================
// CHAVES DE ARMAZENAMENTO
// ======================================================

// Sessão tradicional: familiar e demais usuários.
// Mantidas para compatibilidade com o código existente.
const ACCESS_TOKEN_KEY = "@lembrafacil:access_token";
const REFRESH_TOKEN_KEY = "@lembrafacil:refresh_token";

// Sessão independente do idoso.
const IDOSO_ACCESS_KEY = "@lembrafacil:idoso_access";
const IDOSO_REFRESH_KEY = "@lembrafacil:idoso_refresh";
const IDOSO_PACIENTE_KEY = "@lembrafacil:idoso_paciente_id";

type LoginResponse = {
  access: string;
  refresh: string;
};

type RefreshResponse = {
  access: string;
  refresh?: string;
};

type AtivacaoPacienteResponse = LoginResponse & {
  paciente_id: number;
};

type TipoSessao = "usuario" | "idoso";

const renovacoes: Partial<
  Record<TipoSessao, Promise<string | null>>
> = {};

let ativacaoIdosoEmAndamento:
  Promise<string> | null = null;

// ======================================================
// CONFIGURAÇÃO DAS SESSÕES
// ======================================================

function chavesSessao(tipo: TipoSessao) {
  if (tipo === "idoso") {
    return {
      access: IDOSO_ACCESS_KEY,
      refresh: IDOSO_REFRESH_KEY,
    };
  }

  return {
    access: ACCESS_TOKEN_KEY,
    refresh: REFRESH_TOKEN_KEY,
  };
}

async function salvarSessao(
  tipo: TipoSessao,
  dados: LoginResponse
): Promise<void> {
  const chaves = chavesSessao(tipo);

  await AsyncStorage.multiSet([
    [chaves.access, dados.access],
    [chaves.refresh, dados.refresh],
  ]);
}

async function limparSessao(
  tipo: TipoSessao
): Promise<void> {
  const chaves = chavesSessao(tipo);

  await AsyncStorage.multiRemove([
    chaves.access,
    chaves.refresh,
  ]);
}

// ======================================================
// LOGIN TRADICIONAL
// ======================================================

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

  await salvarSessao("usuario", dados);

  return dados;
}

// ======================================================
// CADASTRO TRADICIONAL
// ======================================================

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

// ======================================================
// CONSULTAR TOKENS
// ======================================================

export async function pegarAccessToken():
  Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function pegarRefreshToken():
  Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function pegarAccessTokenIdoso():
  Promise<string | null> {
  return AsyncStorage.getItem(IDOSO_ACCESS_KEY);
}

export async function pegarPacienteId():
  Promise<number | null> {
  const valor = await AsyncStorage.getItem(
    IDOSO_PACIENTE_KEY
  );

  if (!valor) return null;

  const id = Number(valor);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

// ======================================================
// VERIFICAR EXPIRAÇÃO DO JWT
// ======================================================

function tokenValido(token: string): boolean {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      return false;
    }

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

      if (indice < 0) return false;

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

    return (
      typeof payload.exp === "number" &&
      payload.exp * 1000 > Date.now() + 30000
    );
  } catch {
    return false;
  }
}

// ======================================================
// RENOVAR SESSÃO
// ======================================================

async function executarRenovacao(
  tipo: TipoSessao
): Promise<string | null> {
  const chaves = chavesSessao(tipo);

  const refresh = await AsyncStorage.getItem(
    chaves.refresh
  );

  if (!refresh) return null;

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
      if (
        response.status === 401 ||
        response.status === 403
      ) {
        await limparSessao(tipo);
      }

      return null;
    }

    const dados: RefreshResponse =
      await response.json();

    if (!dados.access || !tokenValido(dados.access)) {
      return null;
    }

    const itens: [string, string][] = [
      [chaves.access, dados.access],
    ];

    if (dados.refresh) {
      itens.push([chaves.refresh, dados.refresh]);
    }

    await AsyncStorage.multiSet(itens);

    return dados.access;
  } catch (erro) {
    console.error(
      `Erro ao renovar sessão ${tipo}:`,
      erro
    );
    return null;
  }
}

async function renovarSessao(
  tipo: TipoSessao
): Promise<string | null> {
  if (renovacoes[tipo]) {
    return renovacoes[tipo]!;
  }

  const promessa = executarRenovacao(tipo);
  renovacoes[tipo] = promessa;

  try {
    return await promessa;
  } finally {
    if (renovacoes[tipo] === promessa) {
      delete renovacoes[tipo];
    }
  }
}

export async function renovarAccessToken():
  Promise<string | null> {
  return renovarSessao("usuario");
}

export async function renovarAccessTokenIdoso():
  Promise<string | null> {
  return renovarSessao("idoso");
}

// ======================================================
// OBTER TOKEN VÁLIDO
// ======================================================

async function obterTokenDaSessao(
  tipo: TipoSessao
): Promise<string | null> {
  const chaves = chavesSessao(tipo);

  const token = await AsyncStorage.getItem(
    chaves.access
  );

  if (token && tokenValido(token)) {
    return token;
  }

  return renovarSessao(tipo);
}

// Mantém compatibilidade com o familiar.
export async function obterTokenValido():
  Promise<string | null> {
  return obterTokenDaSessao("usuario");
}

export async function estaLogado():
  Promise<boolean> {
  return !!(await obterTokenValido());
}

// ======================================================
// ATIVAÇÃO AUTOMÁTICA DO IDOSO
// ======================================================

async function executarAtivacaoIdoso():
  Promise<string> {
  const tokenExistente = await obterTokenDaSessao(
    "idoso"
  );

  if (tokenExistente) {
    return tokenExistente;
  }

  // Se ainda existe refresh, não criamos outra
  // conta automaticamente: evitamos perder
  // o vínculo com o paciente anterior.
  const refreshExistente = await AsyncStorage.getItem(
    IDOSO_REFRESH_KEY
  );

  const pacienteExistente = await pegarPacienteId();

  if (refreshExistente || pacienteExistente) {
    throw new Error(
      "A sessão do paciente expirou. É necessário recuperar a conta antes de continuar."
    );
  }

  const response = await fetch(
    `${API_URL}/usuarios/ativar-paciente/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    const texto = await response.text();

    throw new Error(
      `Não foi possível ativar o paciente (${response.status}): ${texto.substring(0, 200)}`
    );
  }

  const dados: AtivacaoPacienteResponse =
    await response.json();

  if (
    !dados.access ||
    !dados.refresh ||
    !dados.paciente_id
  ) {
    throw new Error(
      "O servidor retornou uma ativação incompleta."
    );
  }

  await salvarSessao("idoso", dados);

  await AsyncStorage.setItem(
    IDOSO_PACIENTE_KEY,
    String(dados.paciente_id)
  );

  return dados.access;
}

export async function iniciarSessaoIdoso():
  Promise<string> {
  if (ativacaoIdosoEmAndamento) {
    return ativacaoIdosoEmAndamento;
  }

  ativacaoIdosoEmAndamento =
    executarAtivacaoIdoso();

  try {
    return await ativacaoIdosoEmAndamento;
  } finally {
    ativacaoIdosoEmAndamento = null;
  }
}

export async function obterTokenValidoIdoso():
  Promise<string | null> {
  return obterTokenDaSessao("idoso");
}

// ======================================================
// LOGOUT
// ======================================================

// Sair da conta do familiar não apaga
// a conta automática do idoso.
export async function logout(): Promise<void> {
  await limparSessao("usuario");
}
