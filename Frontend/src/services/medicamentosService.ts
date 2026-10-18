
import {
  API_URL,
  obterTokenValido,
  renovarAccessToken,
  obterTokenValidoIdoso,
  renovarAccessTokenIdoso,
} from "./authService";

// ======================================================
// TIPOS
// ======================================================

export type EstoqueMedicamento = {
  configurado: boolean;
  estoque_restante: number | null;
  doses_restantes: number | null;
  dias_restantes: number | null;
  alerta_estoque: boolean;
};

export type Medicamento = {
  id: string;
  medicamento: string;
  dosagem: string;
  quantidade: string;
  horario: string;
  frequencia: string;
  duracao: string;

  estoque_inicial: number | null;
  consumo_por_dose: number | null;
  unidade_estoque: string;
  estoque_iniciado_em: string | null;
  estoque: EstoqueMedicamento | null;
};

export type DadosMedicamento = {
  medicamento: string;
  dosagem: string;
  quantidade: string;
  horario: string;
  frequencia: string;
  duracao: string;

  estoque_inicial?: number | null;
  consumo_por_dose?: number | null;
  unidade_estoque?: string;
};

export type PerfilMedicamentos = "idoso" | "familiar";

export type OpcoesMedicamentos = {
  perfil?: PerfilMedicamentos;
  pacienteId?: number;
};

type MedicamentoAPI = {
  id: number;
  nome: string;
  dose: string;
  quantidade: string;
  horario: string;
  frequencia: string;
  duracao: string;
  observacao?: string;
  ativo?: boolean;
  criado_em?: string;

  estoque_inicial?: string | number | null;
  consumo_por_dose?: string | number | null;
  unidade_estoque?: string;
  estoque_iniciado_em?: string | null;
  estoque?: EstoqueMedicamento | null;
};

type RespostaReposicaoAPI = {
  mensagem: string;
  quantidade_adicionada: string;
  medicamento: MedicamentoAPI;
};

// ======================================================
// ENDPOINT
// ======================================================

const MEDICAMENTOS_URL =
  `${API_URL.replace(/\/$/, "")}/medicamentos/`;

// ======================================================
// CONVERSÕES
// ======================================================

function numeroOuNull(
  valor: string | number | null | undefined
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

function converterDaAPI(
  item: MedicamentoAPI
): Medicamento {
  return {
    id: String(item.id),
    medicamento: item.nome ?? "",
    dosagem: item.dose ?? "",
    quantidade: String(item.quantidade ?? ""),
    horario: item.horario
      ? String(item.horario).substring(0, 5)
      : "",
    frequencia: item.frequencia ?? "",
    duracao: item.duracao ?? "",

    estoque_inicial: numeroOuNull(
      item.estoque_inicial
    ),

    consumo_por_dose: numeroOuNull(
      item.consumo_por_dose
    ),

    unidade_estoque:
      item.unidade_estoque || "comprimido",

    estoque_iniciado_em:
      item.estoque_iniciado_em ?? null,

    estoque: item.estoque ?? null,
  };
}

// ======================================================
// NORMALIZAR HORÁRIO
// ======================================================

function normalizarHorario(horario: string): string {
  const valor = horario
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  let horas: number;
  let minutos = 0;

  const comSeparador = valor.match(
    /^(\d{1,2})(?:[:h.](\d{1,2}))?$/
  );

  const compacto = valor.match(/^(\d{2})(\d{2})$/);

  if (comSeparador) {
    horas = Number(comSeparador[1]);
    minutos = Number(comSeparador[2] || 0);
  } else if (compacto) {
    horas = Number(compacto[1]);
    minutos = Number(compacto[2]);
  } else {
    throw new Error(
      "Horário inválido. Use o formato 08:00."
    );
  }

  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    throw new Error(
      "Horário inválido. Use o formato 08:00."
    );
  }

  return (
    String(horas).padStart(2, "0") +
    ":" +
    String(minutos).padStart(2, "0") +
    ":00"
  );
}

// ======================================================
// CONVERTER PARA O DJANGO
// ======================================================

function converterParaAPI(
  medicamento: DadosMedicamento
): Record<string, unknown> {
  if (!medicamento.medicamento.trim()) {
    throw new Error(
      "Informe o nome do medicamento."
    );
  }

  if (!medicamento.dosagem.trim()) {
    throw new Error(
      "Informe a dosagem."
    );
  }

  const dados: Record<string, unknown> = {
    nome: medicamento.medicamento.trim(),
    dose: medicamento.dosagem.trim(),
    quantidade: String(
      medicamento.quantidade ?? ""
    ).trim(),
    horario: normalizarHorario(
      medicamento.horario
    ),
    frequencia: String(
      medicamento.frequencia ?? ""
    ).trim(),
    duracao: String(
      medicamento.duracao ?? ""
    ).trim(),
  };

  // Os campos de estoque são opcionais.
  // O campo antigo "quantidade" continua separado.

  if (
    medicamento.estoque_inicial !== undefined ||
    medicamento.consumo_por_dose !== undefined
  ) {
    const estoque =
      medicamento.estoque_inicial ?? null;

    const consumo =
      medicamento.consumo_por_dose ?? null;

    if (
      (estoque === null) !== (consumo === null)
    ) {
      throw new Error(
        "Informe o estoque inicial e o consumo por dose juntos."
      );
    }

    if (
      estoque !== null &&
      (!Number.isFinite(estoque) || estoque < 0)
    ) {
      throw new Error(
        "O estoque inicial não pode ser negativo."
      );
    }

    if (
      consumo !== null &&
      (!Number.isFinite(consumo) || consumo <= 0)
    ) {
      throw new Error(
        "O consumo por dose deve ser maior que zero."
      );
    }

    dados.estoque_inicial = estoque;
    dados.consumo_por_dose = consumo;
    dados.unidade_estoque =
      medicamento.unidade_estoque?.trim() ||
      "comprimido";
  }

  return dados;
}

// ======================================================
// ERROS DA API
// ======================================================

async function obterMensagemErro(
  response: Response
): Promise<string> {
  const texto = await response.text();

  if (!texto) {
    return `Erro HTTP ${response.status}`;
  }

  try {
    const dados = JSON.parse(texto);

    if (typeof dados.detail === "string") {
      return dados.detail;
    }

    if (typeof dados.message === "string") {
      return dados.message;
    }

    if (typeof dados.mensagem === "string") {
      return dados.mensagem;
    }

    if (
      typeof dados === "object" &&
      dados !== null
    ) {
      return Object.entries(dados)
        .map(([campo, valor]) => {
          const mensagem = Array.isArray(valor)
            ? valor.join(", ")
            : typeof valor === "object" &&
                valor !== null
              ? JSON.stringify(valor)
              : String(valor);

          return `${campo}: ${mensagem}`;
        })
        .join("\n");
    }
  } catch {
    // A resposta não está em JSON.
  }

  return texto.substring(0, 300);
}

// ======================================================
// VALIDAR PERFIL
// ======================================================

function validarOpcoes(
  opcoes: OpcoesMedicamentos
): PerfilMedicamentos {
  const perfil = opcoes.perfil;

  if (
    perfil !== "idoso" &&
    perfil !== "familiar"
  ) {
    throw new Error(
      "Perfil não informado. Abra os medicamentos pela área do idoso ou do familiar."
    );
  }

  if (perfil === "familiar") {
    if (
      !Number.isInteger(opcoes.pacienteId) ||
      (opcoes.pacienteId ?? 0) <= 0
    ) {
      throw new Error(
        "Selecione um paciente vinculado."
      );
    }
  }

  return perfil;
}

// ======================================================
// TOKEN DO PERFIL
// ======================================================

async function obterTokenDoPerfil(
  perfil: PerfilMedicamentos
): Promise<string | null> {
  if (perfil === "idoso") {
    return obterTokenValidoIdoso();
  }

  return obterTokenValido();
}

async function renovarTokenDoPerfil(
  perfil: PerfilMedicamentos
): Promise<string | null> {
  if (perfil === "idoso") {
    return renovarAccessTokenIdoso();
  }

  return renovarAccessToken();
}

// ======================================================
// REQUISIÇÃO AUTENTICADA
// ======================================================

async function fetchAutenticado(
  url: string,
  options: RequestInit,
  perfil: PerfilMedicamentos
): Promise<Response> {
  let token = await obterTokenDoPerfil(perfil);

  if (!token) {
    throw new Error(
      perfil === "idoso"
        ? "A sessão do idoso não está ativa."
        : "Faça login como familiar para continuar."
    );
  }

  const enviar = (accessToken: string) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await enviar(token);

  if (response.status === 401) {
    token = await renovarTokenDoPerfil(perfil);

    if (!token) {
      throw new Error(
        "Sua sessão expirou. Entre novamente."
      );
    }

    response = await enviar(token);
  }

  return response;
}

// ======================================================
// CADASTRAR MEDICAMENTO
// ======================================================

export async function adicionarMedicamento(
  medicamento: DadosMedicamento,
  opcoes: OpcoesMedicamentos
): Promise<Medicamento> {
  const perfil = validarOpcoes(opcoes);
  const dados = converterParaAPI(medicamento);

  const corpo =
    perfil === "familiar"
      ? {
          ...dados,
          paciente_id: opcoes.pacienteId,
        }
      : dados;

  const response = await fetchAutenticado(
    MEDICAMENTOS_URL,
    {
      method: "POST",
      body: JSON.stringify(corpo),
    },
    perfil
  );

  if (!response.ok) {
    throw new Error(
      `Não foi possível cadastrar (${response.status}): ${await obterMensagemErro(response)}`
    );
  }

  const resultado: MedicamentoAPI =
    await response.json();

  return converterDaAPI(resultado);
}

// ======================================================
// LISTAR MEDICAMENTOS
// ======================================================

export async function listarMedicamentos(
  opcoes: OpcoesMedicamentos
): Promise<Medicamento[]> {
  const perfil = validarOpcoes(opcoes);

  const url =
    perfil === "familiar"
      ? `${MEDICAMENTOS_URL}?paciente_id=${opcoes.pacienteId}`
      : MEDICAMENTOS_URL;

  const response = await fetchAutenticado(
    url,
    {},
    perfil
  );

  if (!response.ok) {
    throw new Error(
      await obterMensagemErro(response)
    );
  }

  const resultado = await response.json();

  const lista = Array.isArray(resultado)
    ? resultado
    : Array.isArray(resultado?.results)
      ? resultado.results
      : [];

  return lista.map(converterDaAPI);
}

// ======================================================
// BUSCAR MEDICAMENTO
// ======================================================

export async function buscarMedicamento(
  id: string,
  opcoes: OpcoesMedicamentos
): Promise<Medicamento | null> {
  const perfil = validarOpcoes(opcoes);

  const response = await fetchAutenticado(
    `${MEDICAMENTOS_URL}${encodeURIComponent(id)}/`,
    {},
    perfil
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await obterMensagemErro(response)
    );
  }

  const resultado: MedicamentoAPI =
    await response.json();

  return converterDaAPI(resultado);
}

// ======================================================
// ATUALIZAR MEDICAMENTO
// ======================================================

export async function atualizarMedicamento(
  id: string,
  dadosAtualizados: DadosMedicamento,
  opcoes: OpcoesMedicamentos
): Promise<Medicamento | null> {
  const perfil = validarOpcoes(opcoes);

  const dados = converterParaAPI(
    dadosAtualizados
  );

  const response = await fetchAutenticado(
    `${MEDICAMENTOS_URL}${encodeURIComponent(id)}/`,
    {
      method: "PATCH",
      body: JSON.stringify(dados),
    },
    perfil
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await obterMensagemErro(response)
    );
  }

  const resultado: MedicamentoAPI =
    await response.json();

  return converterDaAPI(resultado);
}

// ======================================================
// EXCLUIR MEDICAMENTO
// ======================================================

export async function excluirMedicamento(
  id: string,
  opcoes: OpcoesMedicamentos
): Promise<boolean> {
  const perfil = validarOpcoes(opcoes);

  const response = await fetchAutenticado(
    `${MEDICAMENTOS_URL}${encodeURIComponent(id)}/`,
    {
      method: "DELETE",
    },
    perfil
  );

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error(
      await obterMensagemErro(response)
    );
  }

  return true;
}

// ======================================================
// REPOR ESTOQUE
// ======================================================

export async function reporEstoqueMedicamento(
  id: string | number,
  quantidade: number,
  opcoes: OpcoesMedicamentos = {
    perfil: "idoso",
  }
): Promise<Medicamento> {
  const perfil = validarOpcoes(opcoes);

  // Validação da quantidade
  if (
    !Number.isFinite(quantidade) ||
    quantidade <= 0 ||
    !Number.isInteger(
      Math.round(quantidade * 100)
    ) ||
    Math.abs(
      Math.round(quantidade * 100) / 100 -
        quantidade
    ) > 0.000000001
  ) {
    throw new Error(
      "Informe uma quantidade válida, maior que zero, com até duas casas decimais."
    );
  }

  const response = await fetchAutenticado(
    `${MEDICAMENTOS_URL}${encodeURIComponent(String(id))}/repor-estoque/`,
    {
      method: "POST",
      body: JSON.stringify({
        quantidade,
      }),
    },
    perfil
  );

  if (!response.ok) {
    throw new Error(
      `Não foi possível repor o estoque (${response.status}): ${await obterMensagemErro(response)}`
    );
  }

  const resultado: RespostaReposicaoAPI =
    await response.json();

  return converterDaAPI(
    resultado.medicamento
  );
}
