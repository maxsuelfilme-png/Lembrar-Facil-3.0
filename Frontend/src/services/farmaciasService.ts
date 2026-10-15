
import {
  API_URL,
  obterTokenValidoFarmacia,
} from "./authService";

// ======================================================
// 1. TIPOS - CADASTRO DA FARMÁCIA
// ======================================================

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

// ======================================================
// 2. TIPOS - PERFIL DA FARMÁCIA
// ======================================================

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

// ======================================================
// 3. TIPOS - PRODUTOS
// ======================================================

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

// ======================================================
// 4. TIPOS - CATÁLOGO PÚBLICO
// ======================================================

export type ProdutoCatalogoFarmacia = {
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

// Nome utilizado pela tela farmacias-busca.tsx
export type ProdutoCatalogo = ProdutoCatalogoFarmacia;

// ======================================================
// 5. TIPOS - MAPA DE FARMÁCIAS
// ======================================================

export type FarmaciaMapa = {
  id: number;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: number | string | null;
  longitude: number | string | null;
  faz_entrega: boolean;
  telefone: string;
  whatsapp: string;
};

// ======================================================
// 6. TRATAMENTO DE RESPOSTAS DA API
// ======================================================

async function tratarResposta<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const erro = await response.json().catch(() => null);

    let mensagem = "Não foi possível concluir a operação.";

    if (typeof erro?.detail === "string") {
      mensagem = erro.detail;
    } else if (erro && typeof erro === "object") {
      mensagem = Object.values(erro)
        .flat()
        .map(String)
        .join("\n");
    }

    throw new Error(mensagem);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// ======================================================
// 7. AUTENTICAÇÃO EXCLUSIVA DA FARMÁCIA
// ======================================================

async function cabecalhoFarmacia(): Promise<{
  "Content-Type": string;
  Authorization: string;
}> {
  const token = await obterTokenValidoFarmacia();

  if (!token) {
    throw new Error(
      "Sessão da farmácia expirada. Faça login novamente."
    );
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ======================================================
// 8. CADASTRAR FARMÁCIA
// ======================================================

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

  return tratarResposta<PerfilFarmacia>(response);
}

// ======================================================
// 9. BUSCAR PERFIL DA FARMÁCIA
// ======================================================

export async function buscarMinhaFarmacia():
  Promise<PerfilFarmacia> {
  const response = await fetch(
    `${API_URL}/farmacias/meu-perfil/`,
    {
      method: "GET",
      headers: await cabecalhoFarmacia(),
    }
  );

  return tratarResposta<PerfilFarmacia>(response);
}

// ======================================================
// 10. ATUALIZAR PERFIL DA FARMÁCIA
// ======================================================

export async function atualizarMinhaFarmacia(
  dados: Partial<PerfilFarmacia>
): Promise<PerfilFarmacia> {
  const response = await fetch(
    `${API_URL}/farmacias/meu-perfil/`,
    {
      method: "PATCH",
      headers: await cabecalhoFarmacia(),
      body: JSON.stringify(dados),
    }
  );

  return tratarResposta<PerfilFarmacia>(response);
}

// ======================================================
// 11. LISTAR PRODUTOS DA FARMÁCIA
// ======================================================

export async function listarProdutosFarmacia():
  Promise<ProdutoFarmacia[]> {
  const response = await fetch(
    `${API_URL}/farmacias/produtos/`,
    {
      method: "GET",
      headers: await cabecalhoFarmacia(),
    }
  );

  return tratarResposta<ProdutoFarmacia[]>(response);
}

// ======================================================
// 12. CADASTRAR PRODUTO
// ======================================================

export async function cadastrarProdutoFarmacia(
  dados: DadosProdutoFarmacia
): Promise<ProdutoFarmacia> {
  const response = await fetch(
    `${API_URL}/farmacias/produtos/`,
    {
      method: "POST",
      headers: await cabecalhoFarmacia(),
      body: JSON.stringify(dados),
    }
  );

  return tratarResposta<ProdutoFarmacia>(response);
}

// Nome utilizado pela tela farmacia-painel.tsx
export async function adicionarProdutoFarmacia(
  dados: DadosProdutoFarmacia
): Promise<ProdutoFarmacia> {
  return cadastrarProdutoFarmacia(dados);
}

// ======================================================
// 13. ATUALIZAR PRODUTO
// ======================================================

export async function atualizarProdutoFarmacia(
  id: number,
  dados: Partial<DadosProdutoFarmacia>
): Promise<ProdutoFarmacia> {
  const response = await fetch(
    `${API_URL}/farmacias/produtos/${id}/`,
    {
      method: "PATCH",
      headers: await cabecalhoFarmacia(),
      body: JSON.stringify(dados),
    }
  );

  return tratarResposta<ProdutoFarmacia>(response);
}

// ======================================================
// 14. EXCLUIR PRODUTO
// ======================================================

export async function excluirProdutoFarmacia(
  id: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/farmacias/produtos/${id}/`,
    {
      method: "DELETE",
      headers: await cabecalhoFarmacia(),
    }
  );

  await tratarResposta<void>(response);
}

// ======================================================
// 15. CATÁLOGO PÚBLICO DE PRODUTOS
// ======================================================

export async function buscarCatalogoFarmacias(
  busca: string = ""
): Promise<ProdutoCatalogo[]> {
  const parametros = busca.trim()
    ? `?busca=${encodeURIComponent(busca.trim())}`
    : "";

  const response = await fetch(
    `${API_URL}/farmacias/catalogo/${parametros}`,
    {
      method: "GET",
    }
  );

  return tratarResposta<ProdutoCatalogo[]>(response);
}

// ======================================================
// 16. MAPA DE FARMÁCIAS PARCEIRAS
// ======================================================

export async function buscarFarmaciasMapa():
  Promise<FarmaciaMapa[]> {
  const response = await fetch(
    `${API_URL}/farmacias/mapa/`,
    {
      method: "GET",
    }
  );

  return tratarResposta<FarmaciaMapa[]>(response);
}

// Nome utilizado pela tela farmacias-mapa.tsx
export async function listarFarmaciasMapa():
  Promise<FarmaciaMapa[]> {
  return buscarFarmaciasMapa();
}
