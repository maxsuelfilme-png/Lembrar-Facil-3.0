
import {
  API_URL,
  obterTokenValido,
  renovarAccessToken,
} from "./authService";

export type Cuidador = {
  nome: string;
  telefone: string;
};

const URL_FAMILIAR =
  `${API_URL.replace(/\/$/, "")}/pacientes/meu-contato-familiar/`;

async function fetchAutenticado(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await obterTokenValido();

  if (!token) {
    throw new Error(
      "Usuário não autenticado. Faça login novamente."
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
    const novoToken = await renovarAccessToken();

    if (!novoToken) {
      throw new Error(
        "Sessão expirada. Faça login novamente."
      );
    }

    response = await enviar(novoToken);
  }

  return response;
}

async function lerErro(response: Response): Promise<string> {
  const texto = await response.text();

  if (!texto) {
    return "O servidor não retornou detalhes do erro.";
  }

  try {
    const dados = JSON.parse(texto);

    if (typeof dados.detail === "string") {
      return dados.detail;
    }

    if (typeof dados.message === "string") {
      return dados.message;
    }

    return JSON.stringify(dados);
  } catch {
    return texto;
  }
}

export async function buscarMeuCuidador(): Promise<Cuidador> {
  const response = await fetchAutenticado(URL_FAMILIAR, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar familiar (${response.status}): ${await lerErro(response)}`
    );
  }

  const dados: Cuidador = await response.json();

  return {
    nome: dados.nome || "",
    telefone: dados.telefone || "",
  };
}

export async function atualizarMeuCuidador(
  nome: string,
  telefone: string
): Promise<Cuidador> {
  const nomeLimpo = nome.trim();
  const telefoneLimpo = telefone.replace(/\D/g, "");

  if (!nomeLimpo) {
    throw new Error("Informe o nome do familiar.");
  }

  if (!/^(?:55)?[1-9][0-9]{10}$/.test(telefoneLimpo)) {
    throw new Error(
      "Informe um celular válido com DDD. Ex.: 81999999999."
    );
  }

  const response = await fetchAutenticado(URL_FAMILIAR, {
    method: "PATCH",
    body: JSON.stringify({
      nome: nomeLimpo,
      telefone: telefoneLimpo,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao salvar familiar (${response.status}): ${await lerErro(response)}`
    );
  }

  const dados: Cuidador = await response.json();

  return {
    nome: dados.nome || "",
    telefone: dados.telefone || "",
  };
}
