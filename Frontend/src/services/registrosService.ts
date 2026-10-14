
import {
  API_URL,
  pegarAccessToken,
  renovarAccessToken,
  obterTokenValidoIdoso,
} from "./authService";

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

export type OpcoesRegistros = {
  perfil: "idoso" | "familiar";
};

function enderecoAPI(caminho: string): string {
  return `${API_URL.replace(/\/+$/, "")}/${caminho.replace(/^\/+/, "")}`;
}

async function obterToken(
  perfil: "idoso" | "familiar"
): Promise<string> {
  if (perfil === "idoso") {
    const token = await obterTokenValidoIdoso();

    if (!token) {
      throw new Error(
        "Sessão do idoso não encontrada. Volte à tela inicial do idoso."
      );
    }

    return token;
  }

  let token = await pegarAccessToken();

  if (!token) {
    token = await renovarAccessToken();
  }

  if (!token) {
    throw new Error(
      "Familiar não autenticado. Faça login novamente."
    );
  }

  return token;
}

async function fetchAutenticado(
  url: string,
  options: RequestInit = {},
  opcoes: OpcoesRegistros = { perfil: "idoso" }
): Promise<Response> {
  let token = await obterToken(opcoes.perfil);

  const executar = (accessToken: string) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await executar(token);

  if (response.status === 401) {
    if (opcoes.perfil === "idoso") {
      const tokenAtualizado =
        await obterTokenValidoIdoso();

      if (
        tokenAtualizado &&
        tokenAtualizado !== token
      ) {
        response = await executar(tokenAtualizado);
      }
    } else {
      const tokenAtualizado =
        await renovarAccessToken();

      if (tokenAtualizado) {
        response = await executar(tokenAtualizado);
      }
    }
  }

  if (response.status === 401) {
    throw new Error(
      "Sessão expirada ou acesso não autorizado."
    );
  }

  return response;
}

function normalizarHorario(horario: string): string {
  const valor = horario.trim();

  const resultado =
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(valor);

  if (!resultado) {
    throw new Error(
      "Horário inválido. Use o formato 08:00."
    );
  }

  const hora = Number(resultado[1]);
  const minuto = Number(resultado[2]);
  const segundo = Number(resultado[3] || "0");

  if (
    hora > 23 ||
    minuto > 59 ||
    segundo > 59
  ) {
    throw new Error("Horário inválido.");
  }

  return [
    String(hora).padStart(2, "0"),
    String(minuto).padStart(2, "0"),
    String(segundo).padStart(2, "0"),
  ].join(":");
}

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

export async function listarRegistros(
  opcoes: OpcoesRegistros = { perfil: "idoso" }
): Promise<RegistroMedicamento[]> {
  const response = await fetchAutenticado(
    enderecoAPI("registros/"),
    {},
    opcoes
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

  const resultado = await response.json();

  if (Array.isArray(resultado)) {
    return resultado;
  }

  if (
    resultado &&
    Array.isArray(resultado.results)
  ) {
    return resultado.results;
  }

  return [];
}

export async function criarRegistro(
  medicamentoId: string | number,
  horario: string,
  opcoes: OpcoesRegistros = { perfil: "idoso" }
): Promise<RegistroMedicamento> {
  const id = Number(medicamentoId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      "ID do medicamento inválido."
    );
  }

  const dados = {
    medicamento: id,
    data: obterDataLocal(),
    horario_previsto: normalizarHorario(horario),
    status: "pendente" as StatusRegistro,
  };

  const response = await fetchAutenticado(
    enderecoAPI("registros/"),
    {
      method: "POST",
      body: JSON.stringify(dados),
    },
    opcoes
  );

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao criar registro:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível criar o registro."
    );
  }

  return response.json();
}

export async function confirmarRegistro(
  registroId: number,
  opcoes: OpcoesRegistros = { perfil: "idoso" }
): Promise<RegistroMedicamento> {
  const response = await fetchAutenticado(
    enderecoAPI(`registros/${registroId}/`),
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "tomado",
      }),
    },
    opcoes
  );

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao confirmar medicamento:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível confirmar o medicamento."
    );
  }

  return response.json();
}

export async function marcarComoAtrasado(
  registroId: number,
  opcoes: OpcoesRegistros = { perfil: "idoso" }
): Promise<RegistroMedicamento> {
  const response = await fetchAutenticado(
    enderecoAPI(`registros/${registroId}/`),
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "atrasado",
      }),
    },
    opcoes
  );

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao marcar como atrasado:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível atualizar o registro."
    );
  }

  return response.json();
}
