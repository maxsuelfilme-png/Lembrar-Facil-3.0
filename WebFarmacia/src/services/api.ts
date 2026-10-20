
export const API_URL =
  "https://lembrar-facil-30-production.up.railway.app/api";

const ACCESS_KEY = "farmacia_access";
const REFRESH_KEY = "farmacia_refresh";

export type Farmacia = {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: string | number | null;
  longitude: string | number | null;
  horario_funcionamento: string;
  faz_entrega: boolean;
  taxa_entrega: string | null;
  parceira: boolean;
  ativa: boolean;
};

export type AtualizacaoFarmacia = {
  nome: string;
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

export type Produto = {
  id: number;
  farmacia: number;
  nome: string;
  descricao: string;
  preco: string;
  quantidade_estoque: number;
  disponivel: boolean;
};

export type DadosProduto = Omit<Produto, "id" | "farmacia">;

function mensagemErro(dados: unknown): string {
  if (
    dados &&
    typeof dados === "object" &&
    "detail" in dados &&
    typeof dados.detail === "string"
  ) {
    return dados.detail;
  }

  if (dados && typeof dados === "object") {
    return Object.entries(dados)
      .map(([campo, valor]) => {
        const texto = Array.isArray(valor)
          ? valor.join(", ")
          : String(valor);

        return `${campo}: ${texto}`;
      })
      .join(" | ");
  }

  return "Erro ao comunicar com o servidor.";
}

async function requisicao<T>(
  caminho: string,
  opcoes: RequestInit = {},
  autenticada = true
): Promise<T> {
  const token = sessionStorage.getItem(ACCESS_KEY);

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(autenticada && token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...opcoes.headers,
    },
  });

  if (resposta.status === 204) {
    return null as T;
  }

  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    if (resposta.status === 401 && autenticada) {
      sairFarmacia();
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    throw new Error(mensagemErro(dados));
  }

  return dados as T;
}

export async function loginFarmacia(
  username: string,
  password: string
) {
  const dados = await requisicao<{
    access: string;
    refresh: string;
  }>(
    "/farmacias/token/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    false
  );

  sessionStorage.setItem(ACCESS_KEY, dados.access);
  sessionStorage.setItem(REFRESH_KEY, dados.refresh);

  return dados;
}

export function obterTokenFarmacia(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function sairFarmacia() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export async function buscarMinhaFarmacia() {
  return requisicao<Farmacia>("/farmacias/meu-perfil/");
}

export async function atualizarMinhaFarmacia(
  dados: AtualizacaoFarmacia
) {
  return requisicao<Farmacia>("/farmacias/meu-perfil/", {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export async function listarProdutos(): Promise<Produto[]> {
  const dados = await requisicao<
    Produto[] | { results: Produto[] }
  >("/farmacias/produtos/");

  return Array.isArray(dados) ? dados : dados.results;
}

export async function cadastrarProduto(dados: DadosProduto) {
  return requisicao<Produto>("/farmacias/produtos/", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function atualizarProduto(
  id: number,
  dados: DadosProduto
) {
  return requisicao<Produto>(`/farmacias/produtos/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export async function excluirProduto(id: number) {
  return requisicao<null>(`/farmacias/produtos/${id}/`, {
    method: "DELETE",
  });
}
