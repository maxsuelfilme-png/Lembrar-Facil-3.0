import {
  API_URL,
  pegarAccessToken,
  renovarAccessToken,
} from "./authService";

// ======================================================
// TIPO USADO PELO APLICATIVO
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

// ======================================================
// TIPO RECEBIDO DO DJANGO
// ======================================================

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
// CONVERTER DJANGO -> APLICATIVO
// ======================================================

function converterDaAPI(
  item: MedicamentoAPI
): Medicamento {
  return {
    id: String(item.id),

    medicamento: item.nome ?? "",

    dosagem: item.dose ?? "",

    quantidade: item.quantidade ?? "",

    // Django pode devolver 08:00:00.
    // No aplicativo mostramos 08:00.
    horario: item.horario
      ? item.horario.substring(0, 5)
      : "",

    frequencia: item.frequencia ?? "",

    duracao: item.duracao ?? "",
  };
}

// ======================================================
// CONVERTER APLICATIVO -> DJANGO
// ======================================================

function converterParaAPI(
  medicamento: Omit<Medicamento, "id">
) {
  return {
    nome: medicamento.medicamento.trim(),

    dose: medicamento.dosagem.trim(),

    quantidade:
      medicamento.quantidade?.trim() ?? "",

    horario: normalizarHorario(
      medicamento.horario
    ),

    frequencia:
      medicamento.frequencia?.trim() ?? "",

    duracao:
      medicamento.duracao?.trim() ?? "",

    observacao: "",

    ativo: true,
  };
}

// ======================================================
// NORMALIZAR HORÁRIO
// Aceita: 8, 8h, 8h30, 8:00, 8.30, 0800, 08:00:00
// Devolve sempre HH:MM:00 ou lança erro se for inválido
// ======================================================

function normalizarHorario(
  horario: string
): string {
  const valor = horario
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  const m =
    valor.match(/^(\d{1,2})[:h.](\d{1,2})?(?:min)?(?::\d{2})?$/) || // 8:00, 8h30, 8h, 8.30, 08:00:00
    valor.match(/^(\d{1,2})()$/) ||                                  // 8
    valor.match(/^(\d{2})(\d{2})$/);                                 // 0800

  if (!m) {
    throw new Error(
      "Horário inválido. Use o formato 08:00."
    );
  }

  const horas = Number(m[1]);
  const minutos = m[2] ? Number(m[2]) : 0;

  if (horas > 23 || minutos > 59) {
    throw new Error(
      "Horário inválido. Use o formato 08:00."
    );
  }

  const hh = String(horas).padStart(2, "0");
  const mm = String(minutos).padStart(2, "0");

  return `${hh}:${mm}:00`;
}

// ======================================================
// FETCH AUTENTICADO
// ======================================================

async function fetchAutenticado(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await pegarAccessToken();

  if (!token) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  let response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,

      ...(options.headers || {}),
    },
  });

  // Access token expirou.
  // Tenta renovar automaticamente.
  if (response.status === 401) {
    token = await renovarAccessToken();

    response = await fetch(url, {
      ...options,

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,

        ...(options.headers || {}),
      },
    });
  }

  return response;
}

// ======================================================
// CREATE
// ======================================================

export async function adicionarMedicamento(
  medicamento: Omit<Medicamento, "id">
): Promise<Medicamento> {
  const dados = converterParaAPI(
    medicamento
  );

  const response = await fetchAutenticado(
    `${API_URL}/medicamentos/`,
    {
      method: "POST",

      body: JSON.stringify(dados),
    }
  );

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao cadastrar medicamento:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível cadastrar o medicamento."
    );
  }

  const resultado: MedicamentoAPI =
    await response.json();

  return converterDaAPI(resultado);
}

// ======================================================
// READ - LISTAR
// ======================================================

export async function listarMedicamentos(): Promise<
  Medicamento[]
> {
  const response = await fetchAutenticado(
    `${API_URL}/medicamentos/`
  );

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao listar medicamentos:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível carregar os medicamentos."
    );
  }

  const resultado = await response.json();

  // Caso a paginação do DRF esteja habilitada
  if (
    resultado &&
    Array.isArray(resultado.results)
  ) {
    return resultado.results.map(
      converterDaAPI
    );
  }

  // Caso o DRF devolva uma lista normal
  if (Array.isArray(resultado)) {
    return resultado.map(
      converterDaAPI
    );
  }

  return [];
}

// ======================================================
// READ - BUSCAR POR ID
// ======================================================

export async function buscarMedicamento(
  id: string
): Promise<Medicamento | null> {
  const response = await fetchAutenticado(
    `${API_URL}/medicamentos/${id}/`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao buscar medicamento:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível buscar o medicamento."
    );
  }

  const resultado: MedicamentoAPI =
    await response.json();

  return converterDaAPI(resultado);
}

// ======================================================
// UPDATE
// ======================================================

export async function atualizarMedicamento(
  id: string,
  dadosAtualizados: Omit<
    Medicamento,
    "id"
  >
): Promise<Medicamento | null> {
  const dados = converterParaAPI(
    dadosAtualizados
  );

  const response = await fetchAutenticado(
    `${API_URL}/medicamentos/${id}/`,
    {
      method: "PATCH",

      body: JSON.stringify(dados),
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao atualizar medicamento:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível atualizar o medicamento."
    );
  }

  const resultado: MedicamentoAPI =
    await response.json();

  return converterDaAPI(resultado);
}

// ======================================================
// DELETE
// ======================================================

export async function excluirMedicamento(
  id: string
): Promise<boolean> {
  const response = await fetchAutenticado(
    `${API_URL}/medicamentos/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao excluir medicamento:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível excluir o medicamento."
    );
  }

  return true;
}