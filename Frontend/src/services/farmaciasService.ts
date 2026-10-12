
import { API_URL, obterTokenValido } from "./authService";

// TIPOS

export type CadastroFarmacia = {
  username: string;
  password: string;
  nome: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  horario_funcionamento: string;
  faz_entrega: boolean;
  taxa_entrega: string | null;
};

export type PerfilFarmacia = {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  horario_funcionamento: string;
  faz_entrega: boolean;
  taxa_entrega: string | null;
  parceira: boolean;
  ativa: boolean;
};

// TRATAMENTO DE ERROS

async function obterMensagemErro(
  response: Response
): Promise<string> {
  const dados = await response.json().catch(() => null);

  if (!dados) {
    return "Não foi possível concluir a solicitação.";
  }

  if (typeof dados.detail === "string") {
    return dados.detail;
  }

  return Object.entries(dados)
    .map(([campo, mensagens]) => {
      const texto = Array.isArray(mensagens)
        ? mensagens.join(", ")
        : String(mensagens);

      return `${campo}: ${texto}`;
    })
    .join("\n");
}

// CADASTRAR FARMÁCIA

export async function cadastrarFarmacia(
  dados: CadastroFarmacia
): Promise<PerfilFarmacia> {
  const response = await fetch(
    `${API_URL}/farmacias/cadastro/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    }
  );

  if (!response.ok) {
    throw new Error(await obterMensagemErro(response));
  }

  return response.json();
}

// CONSULTAR PERFIL DA FARMÁCIA

export async function buscarMinhaFarmacia(): Promise<PerfilFarmacia> {
  const token = await obterTokenValido();

  if (!token) {
    throw new Error(
      "Sua sessão expirou. Faça login novamente."
    );
  }

  const response = await fetch(
    `${API_URL}/farmacias/meu-perfil/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(await obterMensagemErro(response));
  }

  return response.json();
}
