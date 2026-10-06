import {
    API_URL,
    pegarAccessToken,
    renovarAccessToken,
} from "./authService";


// ======================================================
// TIPOS
// ======================================================

export type StatusRegistro =
  | "pendente"
  | "tomado"
  | "atrasado";


export type RegistroMedicamento = {
  id: number;

  medicamento: number;

  medicamento_nome: string;

  medicamento_dose: string;

  data: string;

  horario_previsto: string;

  status: StatusRegistro;

  confirmado_em: string | null;

  criado_em: string;

  atualizado_em: string;
};


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


  // ====================================================
  // TOKEN EXPIROU
  // ====================================================

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
// NORMALIZAR HORÁRIO
// ======================================================

function normalizarHorario(
  horario: string
): string {

  const valor = horario.trim();

  // Exemplo: 08:00:00
  if (
    /^\d{2}:\d{2}:\d{2}$/.test(valor)
  ) {
    return valor;
  }

  // Exemplo: 08:00
  if (
    /^\d{2}:\d{2}$/.test(valor)
  ) {
    return `${valor}:00`;
  }

  return valor;
}


// ======================================================
// DATA LOCAL
// ======================================================

function obterDataLocal(): string {

  const agora = new Date();

  const ano = agora.getFullYear();

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


// ======================================================
// LISTAR REGISTROS
// ======================================================

export async function listarRegistros():
Promise<RegistroMedicamento[]> {

  const response =
    await fetchAutenticado(
      `${API_URL}/registros/`
    );

  if (!response.ok) {

    const erro = await response.text();

    console.error(
      "Erro ao listar registros:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível carregar os registros."
    );
  }

  const resultado =
    await response.json();


  // Caso exista paginação no DRF
  if (
    resultado &&
    Array.isArray(resultado.results)
  ) {
    return resultado.results;
  }


  // Lista normal
  if (Array.isArray(resultado)) {
    return resultado;
  }

  return [];
}


// ======================================================
// CRIAR REGISTRO PENDENTE
// ======================================================

export async function criarRegistro(
  medicamentoId: string,
  horario: string
): Promise<RegistroMedicamento> {

  const dados = {

    medicamento:
      Number(medicamentoId),

    data:
      obterDataLocal(),

    horario_previsto:
      normalizarHorario(horario),

    status:
      "pendente" as StatusRegistro,
  };


  const response =
    await fetchAutenticado(
      `${API_URL}/registros/`,
      {
        method: "POST",

        body: JSON.stringify(dados),
      }
    );


  if (!response.ok) {

    const erro =
      await response.text();

    console.error(
      "Erro ao criar registro:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível criar o registro."
    );
  }


  return await response.json();
}


// ======================================================
// CONFIRMAR COMO TOMADO
// ======================================================

export async function confirmarRegistro(
  registroId: number
): Promise<RegistroMedicamento> {

  const response =
    await fetchAutenticado(
      `${API_URL}/registros/${registroId}/`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status: "tomado",
        }),
      }
    );


  if (!response.ok) {

    const erro =
      await response.text();

    console.error(
      "Erro ao confirmar medicamento:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível confirmar o medicamento."
    );
  }


  return await response.json();
}


// ======================================================
// MARCAR COMO ATRASADO
// ======================================================

export async function marcarComoAtrasado(
  registroId: number
): Promise<RegistroMedicamento> {

  const response =
    await fetchAutenticado(
      `${API_URL}/registros/${registroId}/`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status: "atrasado",
        }),
      }
    );


  if (!response.ok) {

    const erro =
      await response.text();

    console.error(
      "Erro ao marcar como atrasado:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível atualizar o registro."
    );
  }


  return await response.json();
}