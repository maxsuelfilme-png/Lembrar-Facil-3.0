
import AsyncStorage from "@react-native-async-storage/async-storage";

// ======================================================
// CONFIGURAÇÃO DA API
// ======================================================

const API_ONLINE =
  "https://lembrar-facil-30-production.up.railway.app/api";

const API_LOCAL =
  "http://10.172.255.132:8000/api";

export const MODO_API: "online" | "online" = "online";

export const API_URL =
  MODO_API === "online" ? API_ONLINE : API_LOCAL;

// ======================================================
// CHAVES DAS SESSÕES
// ======================================================

const ACCESS_TOKEN_KEY = "@lembrafacil:access_token";
const REFRESH_TOKEN_KEY = "@lembrafacil:refresh_token";

const FARMACIA_ACCESS_KEY =
  "@lembrafacil:farmacia_access";
const FARMACIA_REFRESH_KEY =
  "@lembrafacil:farmacia_refresh";

const IDOSO_ACCESS_KEY = "@lembrafacil:idoso_access";
const IDOSO_REFRESH_KEY = "@lembrafacil:idoso_refresh";
const IDOSO_PACIENTE_KEY =
  "@lembrafacil:idoso_paciente_id";

// ======================================================
// TIPOS
// ======================================================

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

type TipoSessao = "usuario" | "farmacia" | "idoso";

type ChavesSessao = {
  access: string;
  refresh: string;
};

// ======================================================
// CONTROLE DE REQUISIÇÕES
// ======================================================

const renovacoes: Partial<
  Record<TipoSessao, Promise<string | null>>
> = {};

let ativacaoIdosoEmAndamento: Promise<string> | null =
  null;

// ======================================================
// CHAVES DE CADA SESSÃO
// ======================================================

function chavesSessao(tipo: TipoSessao): ChavesSessao {
  if (tipo === "idoso") {
    return {
      access: IDOSO_ACCESS_KEY,
      refresh: IDOSO_REFRESH_KEY,
    };
  }

  if (tipo === "farmacia") {
    return {
      access: FARMACIA_ACCESS_KEY,
      refresh: FARMACIA_REFRESH_KEY,
    };
  }

  return {
    access: ACCESS_TOKEN_KEY,
    refresh: REFRESH_TOKEN_KEY,
  };
}

// ======================================================
// SALVAR E LIMPAR SESSÃO
// ======================================================

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
// MENSAGENS DE ERRO DA API
// ======================================================

async function mensagemErro(
  response: Response,
  padrao: string
): Promise<string> {
  const dados = await response.json().catch(() => null);

  if (!dados) {
    return padrao;
  }

  if (typeof dados.detail === "string") {
    return dados.detail;
  }

  if (typeof dados === "object") {
    const mensagens = Object.values(dados)
      .flat()
      .map(String)
      .join("\n");

    return mensagens || padrao;
  }

  return padrao;
}

// ======================================================
// LOGIN COM JWT
// ======================================================

async function autenticar(
  username: string,
  password: string,
  tipo: "usuario" | "farmacia"
): Promise<LoginResponse> {
  const endpoint =
    tipo === "farmacia"
      ? "/farmacias/token/"
      : "/token/";

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await mensagemErro(
        response,
        "Não foi possível entrar. Confira seu usuário e senha."
      )
    );
  }

  const dados: LoginResponse = await response.json();

  if (!dados.access || !dados.refresh) {
    throw new Error(
      "O servidor não retornou os tokens de autenticação."
    );
  }

  await salvarSessao(tipo, dados);

  return dados;
}

// ======================================================
// LOGIN DO FAMILIAR
// ======================================================

export async function fazerLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  return autenticar(username, password, "usuario");
}

// ======================================================
// LOGIN EXCLUSIVO DA FARMÁCIA
// ======================================================

export async function fazerLoginFarmacia(
  username: string,
  password: string
): Promise<LoginResponse> {
  return autenticar(username, password, "farmacia");
}

// ======================================================
// CADASTRO DO FAMILIAR
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
    throw new Error(
      await mensagemErro(
        response,
        "Não foi possível realizar o cadastro."
      )
    );
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

  if (!valor) {
    return null;
  }

  const id = Number(valor);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

// ======================================================
// DECODIFICAR JWT
// ======================================================

function decodificarPayloadJWT(
  token: string
): Record<string, unknown> | null {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      return null;
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

      if (indice < 0) {
        return null;
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

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ======================================================
// VALIDAR EXPIRAÇÃO DO JWT
// ======================================================

function tokenValido(token: string): boolean {
  const payload = decodificarPayloadJWT(token);

  return (
    payload !== null &&
    typeof payload.exp === "number" &&
    payload.exp * 1000 > Date.now() + 30000
  );
}

// ======================================================
// RENOVAÇÃO DOS TOKENS
// ======================================================

async function executarRenovacao(
  tipo: TipoSessao
): Promise<string | null> {
  const chaves = chavesSessao(tipo);

  const refresh = await AsyncStorage.getItem(
    chaves.refresh
  );

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
      console.warn("Falha na renovação:", {
        tipo,
        statusHTTP: response.status,
      });

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
      itens.push([
        chaves.refresh,
        dados.refresh,
      ]);
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

// ======================================================
// EVITAR RENOVAÇÕES SIMULTÂNEAS
// ======================================================

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

// ======================================================
// RENOVAÇÃO POR TIPO DE USUÁRIO
// ======================================================

export async function renovarAccessToken():
  Promise<string | null> {
  return renovarSessao("usuario");
}

export async function renovarAccessTokenFarmacia():
  Promise<string | null> {
  return renovarSessao("farmacia");
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

export async function obterTokenValido():
  Promise<string | null> {
  return obterTokenDaSessao("usuario");
}

export async function obterTokenValidoFarmacia():
  Promise<string | null> {
  return obterTokenDaSessao("farmacia");
}

export async function obterTokenValidoIdoso():
  Promise<string | null> {
  return obterTokenDaSessao("idoso");
}

// ======================================================
// DIAGNÓSTICO DO FAMILIAR
// ======================================================

export async function diagnosticarUsuarioFamiliar() {
  const token = await obterTokenValido();

  if (!token) {
    console.log(
      "DIAGNÓSTICO FAMILIAR: nenhum usuário conectado."
    );
    return null;
  }

  const payload = decodificarPayloadJWT(token);

  if (!payload) {
    return null;
  }

  const diagnostico = {
    user_id: payload.user_id ?? null,
    token_type: payload.token_type ?? null,
  };

  console.log(
    "DIAGNÓSTICO FAMILIAR:",
    diagnostico
  );

  return diagnostico;
}

// ======================================================
// VERIFICAR LOGIN DO FAMILIAR
// ======================================================

export async function estaLogado():
  Promise<boolean> {
  return Boolean(await obterTokenValido());
}

// ======================================================
// DIAGNÓSTICO DA SESSÃO DO IDOSO
// ======================================================

export async function diagnosticarSessaoIdoso() {
  const access = await AsyncStorage.getItem(
    IDOSO_ACCESS_KEY
  );

  const refresh = await AsyncStorage.getItem(
    IDOSO_REFRESH_KEY
  );

  const pacienteId = await pegarPacienteId();

  const diagnostico = {
    possuiAccess: Boolean(access),
    accessAindaValido: access
      ? tokenValido(access)
      : false,
    possuiRefresh: Boolean(refresh),
    possuiPacienteId: pacienteId !== null,
  };

  console.log(
    "DIAGNÓSTICO DA SESSÃO DO IDOSO:",
    diagnostico
  );

  return diagnostico;
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

  const refreshExistente =
    await AsyncStorage.getItem(
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
    throw new Error(
      `Não foi possível ativar o paciente. Erro HTTP ${response.status}.`
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

  await AsyncStorage.multiSet([
    [IDOSO_ACCESS_KEY, dados.access],
    [IDOSO_REFRESH_KEY, dados.refresh],
    [
      IDOSO_PACIENTE_KEY,
      String(dados.paciente_id),
    ],
  ]);

  console.log(
    "Primeira sessão do idoso ativada com sucesso."
  );

  return dados.access;
}

// ======================================================
// INICIAR SESSÃO DO IDOSO
// ======================================================

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

// ======================================================
// LOGOUT DO FAMILIAR
// ======================================================

export async function logout(): Promise<void> {
  await limparSessao("usuario");
}

// ======================================================
// LOGOUT DA FARMÁCIA
// ======================================================

export async function logoutFarmacia():
  Promise<void> {
  await limparSessao("farmacia");
}

// ======================================================
// LIMPEZA DA SESSÃO ANTIGA DO IDOSO
// SOMENTE PARA TESTES
// ======================================================

export async function limparSessaoAntigaIdoso():
  Promise<void> {
  await AsyncStorage.multiRemove([
    IDOSO_ACCESS_KEY,
    IDOSO_REFRESH_KEY,
    IDOSO_PACIENTE_KEY,
  ]);

  console.log(
    "Sessão antiga do idoso removida do celular."
  );
}
