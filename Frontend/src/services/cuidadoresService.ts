import {
    API_URL,
    pegarAccessToken,
    renovarAccessToken,
} from "./authService";

export type Cuidador = {
  id: number;
  nome: string;
  telefone: string;
  criado_em: string;
};

async function fetchAutenticado(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await pegarAccessToken();

  if (!token) {
    throw new Error("Usuário não autenticado.");
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

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

export async function buscarMeuCuidador(): Promise<Cuidador> {
  const response = await fetchAutenticado(
    `${API_URL}/cuidadores/meu-perfil/`
  );

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao buscar cuidador:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível carregar o familiar."
    );
  }

  return await response.json();
}

export async function atualizarMeuCuidador(
  nome: string,
  telefone: string
): Promise<Cuidador> {
  const response = await fetchAutenticado(
    `${API_URL}/cuidadores/meu-perfil/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        nome: nome.trim(),
        telefone: telefone.trim(),
      }),
    }
  );

  if (!response.ok) {
    const erro = await response.text();

    console.error(
      "Erro ao atualizar cuidador:",
      response.status,
      erro
    );

    throw new Error(
      "Não foi possível salvar o familiar."
    );
  }

  return await response.json();
}