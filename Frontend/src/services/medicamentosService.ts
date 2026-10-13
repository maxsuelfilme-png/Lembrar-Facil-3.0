
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

export type Medicamento = {
  id: string;
  medicamento: string;
  dosagem: string;
  quantidade: string;
  horario: string;
  frequencia: string;
  duracao: string;
};

export type DadosMedicamento = Omit<Medicamento, "id">;

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
};

// ======================================================
// ENDPOINT
// ======================================================

const MEDICAMENTOS_URL =
  `${API_URL.replace(/\/$/, "")}/medicamentos/`;

// ======================================================
// CONVERTER DADOS DO DJANGO PARA O APLICATIVO
// ======================================================

function converterDaAPI(item: MedicamentoAPI): Medicamento {
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
// CONVERTER DADOS DO APLICATIVO PARA O DJANGO
// ======================================================

function converterParaAPI(medicamento: DadosMedicamento) {
  if (!medicamento.medicamento.trim()) {
    throw new Error("Informe o nome do medicamento.");
  }

  if (!medicamento.dosagem.trim()) {
    throw new Error("Informe a dosagem.");
  }

  return {
    nome: medicamento.medicamento.trim(),
    dose: medicamento.dosagem.trim(),
    quantidade: String(
      medicamento.quantidade ?? ""
    ).trim(),
    horario: normalizarHorario(medicamento.horario),
    frequencia: String(
      medicamento.frequencia ?? ""
    ).trim(),
    duracao: String(
      medicamento.duracao ?? ""
    ).trim(),
    observacao: "",
    ativo: true,
  };
}

// ======================================================
// TRATAR ERROS DA API
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

    if (typeof dados === "object" && dados !== null) {
      return Object.entries(dados)
        .map(([campo, valor]) => {
          const mensagem = Array.isArray(valor)
            ? valor.join(", ")
            : String(valor);

          return `${campo}: ${mensagem}`;
        })
        .join("\n");
    }
  } catch {
    // Resposta não está em JSON.
  }

  return texto.substring(0, 300);
}

// ======================================================
// VALIDAR PERFIL E PACIENTE
// ======================================================

function validarOpcoes(
  opcoes: OpcoesMedicamentos
): PerfilMedicamentos {
  const perfil = opcoes.perfil;

  if (perfil !== "idoso" && perfil !== "familiar") {
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
        "Selecione um paciente vinculado antes de cadastrar ou consultar medicamentos."
      );
    }
  }

  return perfil;
}

// ======================================================
// TOKEN DE CADA PERFIL
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
        ? "A sessão do idoso não está ativa. Volte à tela do idoso e tente novamente."
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
        "Sua sessão expirou. Entre novamente no perfil."
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
    const mensagem = await obterMensagemErro(response);

    throw new Error(
      `Não foi possível cadastrar (${response.status}): ${mensagem}`
    );
  }

  const resultado: MedicamentoAPI = await response.json();

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
    throw new Error(await obterMensagemErro(response));
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
// BUSCAR MEDICAMENTO PELO ID
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
    throw new Error(await obterMensagemErro(response));
  }

  const resultado: MedicamentoAPI = await response.json();

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

  const dados = converterParaAPI(dadosAtualizados);

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
    throw new Error(await obterMensagemErro(response));
  }

  const resultado: MedicamentoAPI = await response.json();

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
    throw new Error(await obterMensagemErro(response));
  }

  return true;
}
