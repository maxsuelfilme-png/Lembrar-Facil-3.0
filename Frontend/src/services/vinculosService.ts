
import {
  API_URL,
  obterTokenValido,
} from "./authService";

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

async function requisicao(
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
    `${API_URL}/cuidadores/${caminho}`,
    {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...opcoes.headers,
      },
    }
  );

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(
      dados.detail ||
        `Erro na comunicação (${resposta.status}).`
    );
  }

  return dados;
}

export async function vincularPaciente(
  codigo: string
): Promise<RespostaVinculo> {
  return requisicao("vincular-paciente/", {
    method: "POST",
    body: JSON.stringify({
      codigo: codigo.trim().toUpperCase(),
    }),
  });
}

export async function listarPacientesVinculados():
  Promise<VinculoPaciente[]> {
  const dados = await requisicao("vinculos/");

  return Array.isArray(dados)
    ? dados
    : dados.results ?? [];
}
