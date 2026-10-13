
import {
  API_URL,
  obterTokenValido,
  renovarAccessToken,
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
// CONVERTER API -> APP
// ======================================================

function converterDaAPI(
  item: MedicamentoAPI
): Medicamento {
  return {
    id: String(item.id),
    medicamento: item.nome ?? "",
    dosagem: item.dose ?? "",
    quantidade: String(item.quantidade ?? ""),
    horario: item.horario
      ? item.horario.substring(0, 5)
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
    /^(\d{1,2})(?:[:h.](\d{1,2})?)?(?::\d{2})?$/
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

  if (horas > 23 || minutos > 59) {
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
// CONVERTER APP -> API
// ======================================================

function converterParaAPI(
  medicamento: Omit<Medicamento, "id">
) {
  if (!medicamento.medicamento.trim()) {
    throw new Error("Informe o medicamento.");
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
// MENSAGEM REAL DO BACKEND
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
// REQUISIÇÃO AUTENTICADA
// ======================================================

async function fetchAutenticado(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await obterTokenValido();

  if (!token) {
    throw new Error(
      "É necessário autenticar o paciente para salvar medicamentos no servidor."
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
    token = await renovarAccessToken();

    if (!token) {
      throw new Error(
        "Sessão expirada. É necessário autenticar novamente."
      );
    }

    response = await enviar(token);
  }

  return response;
}

// ======================================================
// CREATE
// ======================================================

export async function adicionarMedicamento(
  medicamento: Omit<Medicamento, "id">
): Promise<Medicamento> {
  const dados = converterParaAPI(medicamento);

  const response = await fetchAutenticado(
    `${API_URL.replace(/\/$/, "")}/medicamentos/`,
    {
      method: "POST",
      body: JSON.stringify(dados),
    }
  );

  if (!response.ok) {
    const mensagem = await obterMensagemErro(response);

    console.error(
      "Erro ao cadastrar medicamento:",
      response.status,
      mensagem
    );

    throw new Error(
      `Não foi possível cadastrar (${response.status}): ${mensagem}`
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
    `${API_URL.replace(/\/$/, "")}/medicamentos/`
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
// READ - BUSCAR POR ID
// ======================================================

export async function buscarMedicamento(
  id: string
): Promise<Medicamento | null> {
  const response = await fetchAutenticado(
    `${API_URL.replace(/\/$/, "")}/medicamentos/${id}/`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await obterMensagemErro(response)
    );
  }

  return converterDaAPI(await response.json());
}

// ======================================================
// UPDATE
// ======================================================

export async function atualizarMedicamento(
  id: string,
  dadosAtualizados: Omit<Medicamento, "id">
): Promise<Medicamento | null> {
  const dados = converterParaAPI(dadosAtualizados);

  const response = await fetchAutenticado(
    `${API_URL.replace(/\/$/, "")}/medicamentos/${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify(dados),
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await obterMensagemErro(response)
    );
  }

  return converterDaAPI(await response.json());
}

// ======================================================
// DELETE
// ======================================================

export async function excluirMedicamento(
  id: string
): Promise<boolean> {
  const response = await fetchAutenticado(
    `${API_URL.replace(/\/$/, "")}/medicamentos/${id}/`,
    {
      method: "DELETE",
    }
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
