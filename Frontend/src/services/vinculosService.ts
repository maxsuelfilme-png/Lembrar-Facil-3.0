
import {
  API_URL,
  obterTokenValido,
  obterTokenValidoIdoso,
} from "./authService";

// ======================================================
// TIPOS
// ======================================================

export type VinculoPaciente = {
  id: number;
  paciente: number;
  paciente_nome: string;
  ativo: boolean;
  criado_em: string;
};

export type RespostaVinculo = {
  detail: string;
  paciente_id: number;
  vinculo_id: number;
};

export type RespostaCodigoVinculo = {
  codigo: string;
  expira_em?: string;
  detail?: string;
};

// ======================================================
// URL DO BACKEND
// ======================================================

const CUIDADORES_URL =
  `${API_URL.replace(/\/+$/, "")}/cuidadores`;

// ======================================================
// TRATAR RESPOSTA DO DJANGO
// ======================================================

async function lerResposta(
  resposta: Response
): Promise<any> {
  const dados = await resposta
    .json()
    .catch(() => ({}));

  if (!resposta.ok) {
    const mensagem =
      dados.detail ||
      dados.erro ||
      dados.error ||
      dados.message ||
      `Erro na comunicação (${resposta.status}).`;

    throw new Error(
      typeof mensagem === "string"
        ? mensagem
        : JSON.stringify(mensagem)
    );
  }

  return dados;
}

// ======================================================
// REQUISIÇÕES DO FAMILIAR
// ======================================================

async function requisicaoFamiliar(
  caminho: string,
  opcoes: RequestInit = {}
) {
  const token = await obterTokenValido();

  if (!token) {
    throw new Error(
      "Faça login como familiar para continuar."
    );
  }

  const resposta = await fetch(
    `${CUIDADORES_URL}/${caminho}`,
    {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...opcoes.headers,
      },
    }
  );

  return lerResposta(resposta);
}

// ======================================================
// REQUISIÇÕES DO IDOSO
// ======================================================

async function requisicaoIdoso(
  caminho: string,
  opcoes: RequestInit = {}
) {
  const token = await obterTokenValidoIdoso();

  if (!token) {
    throw new Error(
      "A sessão do idoso não está disponível."
    );
  }

  const resposta = await fetch(
    `${CUIDADORES_URL}/${caminho}`,
    {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...opcoes.headers,
      },
    }
  );

  return lerResposta(resposta);
}

// ======================================================
// GERAR CÓDIGO NA TELA DO IDOSO
// ======================================================

export async function gerarCodigoVinculoIdoso():
  Promise<RespostaCodigoVinculo> {
  const dados = await requisicaoIdoso(
    "gerar-codigo/",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );

  if (
    typeof dados.codigo !== "string" ||
    !/^[A-F0-9]{16}$/.test(dados.codigo)
  ) {
    throw new Error(
      "O servidor não retornou um código de vínculo válido."
    );
  }

  return {
    codigo: dados.codigo,
    expira_em: dados.expira_em,
    detail: dados.detail,
  };
}

// ======================================================
// VINCULAR IDOSO NA TELA FAMÍLIA
// ======================================================

export async function vincularPaciente(
  codigo: string
): Promise<RespostaVinculo> {
  const codigoLimpo = codigo
    .trim()
    .toUpperCase();

  if (!/^[A-F0-9]{16}$/.test(codigoLimpo)) {
    throw new Error(
      "O código deve conter 16 caracteres válidos."
    );
  }

  return requisicaoFamiliar(
    "vincular-paciente/",
    {
      method: "POST",
      body: JSON.stringify({
        codigo: codigoLimpo,
      }),
    }
  );
}

// ======================================================
// LISTAR IDOSOS VINCULADOS AO FAMILIAR
// ======================================================

export async function listarPacientesVinculados():
  Promise<VinculoPaciente[]> {
  const dados = await requisicaoFamiliar(
    "vinculos/"
  );

  if (Array.isArray(dados)) {
    return dados;
  }

  if (Array.isArray(dados.results)) {
    return dados.results;
  }

  return [];
}
