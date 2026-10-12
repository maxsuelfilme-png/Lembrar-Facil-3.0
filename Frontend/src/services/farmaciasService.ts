
import { API_URL, obterTokenValido } from "./authService";

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

export type ProdutoFarmacia = {
  id: number;
  farmacia: number;
  nome: string;
  descricao: string;
  preco: string;
  quantidade_estoque: number;
  disponivel: boolean;
};

export type DadosProdutoFarmacia = {
  nome: string;
  descricao: string;
  preco: string;
  quantidade_estoque: number;
  disponivel: boolean;
};

export type ProdutoCatalogo = {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  quantidade_estoque: number;
  farmacia_nome: string;
  farmacia_cidade: string;
  farmacia_estado: string;
  farmacia_faz_entrega: boolean;
};

type RespostaLista<T> = T[] | { results: T[] };

function extrairLista<T>(resultado: RespostaLista<T>): T[] {
  return Array.isArray(resultado)
    ? resultado
    : resultado.results ?? [];
}

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

  if (Array.isArray(dados)) {
    return dados.map(String).join("\n");
  }

  if (typeof dados === "object") {
    return Object.entries(dados)
      .map(([campo, mensagens]) => {
        const texto = Array.isArray(mensagens)
          ? mensagens.join(", ")
          : String(mensagens);

        return `${campo}: ${texto}`;
      })
      .join("\n");
  }

  return String(dados);
}

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

async function requisicaoProdutos<T>(
  caminho: string,
  metodo: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  dados?: DadosProdutoFarmacia
): Promise<T> {
  const token = await obterTokenValido();

  if (!token) {
    throw new Error(
      "Faça login na farmácia novamente."
    );
  }

  const response = await fetch(
    `${API_URL}/farmacias/produtos/${caminho}`,
    {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(dados !== undefined
        ? { body: JSON.stringify(dados) }
        : {}),
    }
  );

  if (!response.ok) {
    throw new Error(await obterMensagemErro(response));
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export async function listarProdutosFarmacia(): Promise<ProdutoFarmacia[]> {
  const resultado = await requisicaoProdutos<
    RespostaLista<ProdutoFarmacia>
  >("");

  return extrairLista(resultado);
}

export async function adicionarProdutoFarmacia(
  dados: DadosProdutoFarmacia
): Promise<ProdutoFarmacia> {
  return requisicaoProdutos<ProdutoFarmacia>(
    "",
    "POST",
    dados
  );
}

export async function atualizarProdutoFarmacia(
  id: number,
  dados: DadosProdutoFarmacia
): Promise<ProdutoFarmacia> {
  return requisicaoProdutos<ProdutoFarmacia>(
    `${id}/`,
    "PATCH",
    dados
  );
}

export async function excluirProdutoFarmacia(
  id: number
): Promise<void> {
  await requisicaoProdutos<void>(
    `${id}/`,
    "DELETE"
  );
}

export async function buscarCatalogoFarmacias(
  busca: string = ""
): Promise<ProdutoCatalogo[]> {
  const parametro = busca.trim()
    ? `?busca=${encodeURIComponent(busca.trim())}`
    : "";

  const response = await fetch(
    `${API_URL}/farmacias/catalogo/${parametro}`
  );

  if (!response.ok) {
    throw new Error(await obterMensagemErro(response));
  }

  const resultado: RespostaLista<ProdutoCatalogo> =
    await response.json();

  return extrairLista(resultado);
}
