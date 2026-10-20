
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  CircleAlert,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Package,
  Pencil,
  Phone,
  Pill,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import {
  loginFarmacia,
  sairFarmacia,
  obterTokenFarmacia,
  buscarMinhaFarmacia,
  atualizarMinhaFarmacia,
  listarProdutos,
  cadastrarProduto,
  atualizarProduto,
  excluirProduto,
  type Farmacia,
  type Produto,
  type DadosProduto,
  type AtualizacaoFarmacia,
} from "./services/api";

import "./App.css";

type Tela = "painel" | "produtos" | "estoque" | "perfil";

const produtoVazio: DadosProduto = {
  nome: "",
  descricao: "",
  preco: "",
  quantidade_estoque: 0,
  disponivel: true,
};

function moeda(valor: string | number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dadosDoPerfil(f: Farmacia): AtualizacaoFarmacia {
  return {
    nome: f.nome,
    telefone: f.telefone || "",
    whatsapp: f.whatsapp || "",
    endereco: f.endereco || "",
    cidade: f.cidade || "",
    estado: f.estado || "",
    cep: f.cep || "",
    horario_funcionamento: f.horario_funcionamento || "",
    faz_entrega: f.faz_entrega,
    taxa_entrega: f.taxa_entrega,
  };
}

export default function App() {
  const [autenticado, setAutenticado] = useState(
    Boolean(obterTokenFarmacia())
  );

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState("");
  const [entrando, setEntrando] = useState(false);

  const [tela, setTela] = useState<Tela>("painel");
  const [menuAberto, setMenuAberto] = useState(false);
  const [farmacia, setFarmacia] = useState<Farmacia | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aguardando, setAguardando] = useState(false);
  const [pesquisa, setPesquisa] = useState("");

  const [formularioAberto, setFormularioAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] =
    useState<number | null>(null);
  const [formulario, setFormulario] = useState<DadosProduto>({
    ...produtoVazio,
  });
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  const [perfilForm, setPerfilForm] =
    useState<AtualizacaoFarmacia | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [sucessoPerfil, setSucessoPerfil] = useState("");

  const sair = useCallback(() => {
    sairFarmacia();
    setAutenticado(false);
    setFarmacia(null);
    setProdutos([]);
    setTela("painel");
    setMenuAberto(false);
    setErro("");
    setAguardando(false);
  }, []);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");
    setAguardando(false);

    try {
      const perfil = await buscarMinhaFarmacia();
      setFarmacia(perfil);
      setPerfilForm(dadosDoPerfil(perfil));

      if (!perfil.ativa || !perfil.parceira) {
        setAguardando(true);
        setProdutos([]);
        return;
      }

      const lista = await listarProdutos();
      setProdutos(lista);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados.";

      if (mensagem.toLowerCase().includes("aguardando aprovação")) {
        setAguardando(true);
        setFarmacia(null);
        setProdutos([]);
      } else if (
        mensagem.toLowerCase().includes("sessão expirada")
      ) {
        sair();
        setErroLogin(mensagem);
      } else {
        setErro(mensagem);
      }
    } finally {
      setCarregando(false);
    }
  }, [sair]);

  useEffect(() => {
    if (autenticado) {
      void carregarDados();
    }
  }, [autenticado, carregarDados]);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEntrando(true);
    setErroLogin("");

    try {
      await loginFarmacia(usuario, senha);
      setSenha("");
      setAutenticado(true);
    } catch (error) {
      setErroLogin(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar."
      );
    } finally {
      setEntrando(false);
    }
  }

  function navegar(destino: Tela) {
    setTela(destino);
    setMenuAberto(false);
    setErro("");
    setSucessoPerfil("");

    if (destino === "perfil" && farmacia) {
      setPerfilForm(dadosDoPerfil(farmacia));
    }
  }

  function novoProduto() {
    setProdutoEditando(null);
    setFormulario({ ...produtoVazio });
    setFormularioAberto(true);
    setErro("");
    setTela("produtos");
  }

  function editarProduto(produto: Produto) {
    setProdutoEditando(produto.id);
    setFormulario({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      quantidade_estoque: produto.quantidade_estoque,
      disponivel: produto.disponivel,
    });
    setFormularioAberto(true);
    setTela("produtos");
    setErro("");
  }

  async function salvarProduto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvandoProduto(true);
    setErro("");

    try {
      if (produtoEditando !== null) {
        await atualizarProduto(produtoEditando, formulario);
      } else {
        await cadastrarProduto(formulario);
      }

      setFormularioAberto(false);
      setProdutoEditando(null);
      setFormulario({ ...produtoVazio });
      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao salvar produto."
      );
    } finally {
      setSalvandoProduto(false);
    }
  }

  async function removerProduto(produto: Produto) {
    const confirmou = window.confirm(
      `Deseja realmente excluir "${produto.nome}"?`
    );

    if (!confirmou) return;

    setErro("");

    try {
      await excluirProduto(produto.id);
      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao excluir produto."
      );
    }
  }

  function alterarPerfil(
    campo: keyof AtualizacaoFarmacia,
    valor: string | boolean | null
  ) {
    setPerfilForm((anterior) =>
      anterior ? { ...anterior, [campo]: valor } : anterior
    );
    setSucessoPerfil("");
  }

  async function salvarPerfil(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!perfilForm) return;

    setSalvandoPerfil(true);
    setErro("");
    setSucessoPerfil("");

    try {
      const atualizado = await atualizarMinhaFarmacia({
        ...perfilForm,
        estado: perfilForm.estado.trim().toUpperCase(),
        taxa_entrega: perfilForm.faz_entrega
          ? perfilForm.taxa_entrega || "0.00"
          : null,
      });

      setFarmacia(atualizado);
      setPerfilForm(dadosDoPerfil(atualizado));
      setSucessoPerfil("Dados atualizados com sucesso!");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar perfil."
      );
    } finally {
      setSalvandoPerfil(false);
    }
  }

  const totalEstoque = useMemo(
    () =>
      produtos.reduce(
        (total, p) => total + p.quantidade_estoque,
        0
      ),
    [produtos]
  );

  const disponiveis = produtos.filter(
    (p) => p.disponivel && p.quantidade_estoque > 0
  ).length;

  const estoqueBaixo = produtos.filter(
    (p) =>
      p.disponivel &&
      p.quantidade_estoque > 0 &&
      p.quantidade_estoque <= 5
  );

  const produtosFiltrados = produtos.filter((p) => {
    const combinaBusca = `${p.nome} ${p.descricao}`
      .toLowerCase()
      .includes(pesquisa.toLowerCase());

    if (tela === "estoque") {
      return combinaBusca && p.quantidade_estoque <= 5;
    }

    return combinaBusca;
  });

  const titulos: Record<Tela, string> = {
    painel: "Visão geral",
    produtos: "Medicamentos",
    estoque: "Controle de estoque",
    perfil: "Minha farmácia",
  };

  if (!autenticado) {
    return (
      <main className="login-page">
        <section className="login-hero">
          <div className="login-hero-inner">
            <div className="brand brand-light">
              <div className="brand-symbol">
                <HeartPulse size={29} />
              </div>
              <div>
                <strong>
                  <span>Lembra</span>
                  <em>Fácil</em>
                </strong>
                <small>Portal das Farmácias</small>
              </div>
            </div>

            <span className="hero-tag">
              <ShieldCheck size={17} />
              Tecnologia que cuida de vidas
            </span>

            <h1>
              O cuidado começa
              <br />
              com uma gestão
              <br />
              <span>mais inteligente.</span>
            </h1>

            <p>
              Gerencie seus medicamentos, acompanhe o estoque
              e mantenha sua farmácia conectada ao LembraFácil.
            </p>

            <div className="hero-features">
              <span>
                <CheckCircle2 size={19} />
                Gestão de medicamentos
              </span>
              <span>
                <CheckCircle2 size={19} />
                Controle de estoque
              </span>
              <span>
                <CheckCircle2 size={19} />
                Farmácias parceiras
              </span>
            </div>

            <HeartPulse
              className="hero-decoration"
              size={350}
              strokeWidth={0.5}
            />
          </div>
        </section>

        <section className="login-side">
          <div className="login-card">
            <div className="login-mobile-brand">
              <HeartPulse size={27} />
              Lembra<span>Fácil</span>
            </div>

            <div className="login-icon">
              <LockKeyhole size={29} />
            </div>

            <h2>Bem-vindo de volta!</h2>
            <p>
              Acesse sua conta para gerenciar sua farmácia
              com segurança.
            </p>

            <form onSubmit={entrar}>
              <label htmlFor="usuario">Usuário</label>
              <div className="input-icon">
                <UserRound size={19} />
                <input
                  id="usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  required
                />
              </div>

              <label htmlFor="senha">Senha</label>
              <div className="input-icon">
                <LockKeyhole size={19} />
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {erroLogin && (
                <div className="feedback error">{erroLogin}</div>
              )}

              <button
                className="btn btn-primary login-submit"
                type="submit"
                disabled={entrando}
              >
                <LogIn size={19} />
                {entrando ? "Entrando..." : "Entrar no portal"}
              </button>
            </form>

            <div className="login-footer">
              <ShieldCheck size={16} />
              Ambiente seguro LembraFácil
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {menuAberto && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside className={`sidebar ${menuAberto ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-symbol">
              <HeartPulse size={27} />
            </div>
            <div>
              <strong>
                <span>Lembra</span>
                <em>Fácil</em>
              </strong>
              <small>Portal das Farmácias</small>
            </div>
            <button
              className="mobile-close"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        <span className="sidebar-section-label">MENU PRINCIPAL</span>

        <nav className="sidebar-nav">
          <button
            className={`nav-link ${tela === "painel" ? "active" : ""}`}
            onClick={() => navegar("painel")}
          >
            <LayoutDashboard size={19} />
            Visão geral
          </button>

          <button
            className={`nav-link ${tela === "produtos" ? "active" : ""}`}
            onClick={() => navegar("produtos")}
          >
            <Pill size={19} />
            Medicamentos
          </button>

          <button
            className={`nav-link ${tela === "estoque" ? "active" : ""}`}
            onClick={() => navegar("estoque")}
          >
            <Boxes size={19} />
            Estoque
            {estoqueBaixo.length > 0 && (
              <span className="nav-count">
                {estoqueBaixo.length}
              </span>
            )}
          </button>

          <button
            className={`nav-link ${tela === "perfil" ? "active" : ""}`}
            onClick={() => navegar("perfil")}
          >
            <Store size={19} />
            Minha farmácia
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <HeartPulse size={27} className="support-icon" />
            <strong>Cuidar é nossa missão.</strong>
            <p>
              Tecnologia para aproximar pacientes,
              familiares e farmácias.
            </p>
          </div>

          <button className="logout-link" onClick={sair}>
            <LogOut size={19} />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
            >
              <Menu size={23} />
            </button>

            <div className="breadcrumbs">
              <span>Portal</span>
              <span>/</span>
              <strong>{titulos[tela]}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="online-pill">
              <span />
              Sistema online
            </span>
            <div className="avatar">
              <Store size={20} />
            </div>
          </div>
        </header>

        <main className="page-content">
          {carregando && (
            <div className="loading-bar">
              <RefreshCw className="spin" size={17} />
              Atualizando informações...
            </div>
          )}

          {erro && (
            <div className="feedback error">
              <CircleAlert size={19} />
              {erro}
              <button onClick={() => setErro("")}>
                <X size={17} />
              </button>
            </div>
          )}

          {aguardando ? (
            <section className="empty-panel">
              <Store size={45} />
              <h2>Farmácia aguardando aprovação</h2>
              <p>
                Seu cadastro precisa ser aprovado para
                acessar o gerenciamento de produtos.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => void carregarDados()}
              >
                <RefreshCw size={17} />
                Verificar novamente
              </button>
            </section>
          ) : !farmacia ? (
            !carregando && (
              <section className="empty-panel">
                <CircleAlert size={43} />
                <h2>Não foi possível carregar sua farmácia</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => void carregarDados()}
                >
                  Tentar novamente
                </button>
              </section>
            )
          ) : (
            <>
              {tela === "painel" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">
                        PAINEL ADMINISTRATIVO
                      </p>
                      <h1>Visão geral</h1>
                      <p>
                        Acompanhe os dados da sua farmácia.
                      </p>
                    </div>

                    <button
                      className="btn btn-ghost"
                      onClick={() => void carregarDados()}
                      disabled={carregando}
                    >
                      <RefreshCw size={17} />
                      Atualizar
                    </button>
                  </div>

                  <section className="welcome-banner">
                    <div className="welcome-copy">
                      <span className="welcome-kicker">
                        <CheckCircle2 size={16} />
                        FARMÁCIA PARCEIRA
                      </span>

                      <h2>
                        Olá, {farmacia.nome}!
                        <br />
                        <span>Que bom ter você aqui.</span>
                      </h2>

                      <p>
                        Sua farmácia faz parte de uma rede
                        que conecta tecnologia, saúde e cuidado.
                      </p>

                      <button
                        className="welcome-button"
                        onClick={() => navegar("produtos")}
                      >
                        <Pill size={17} />
                        Gerenciar medicamentos
                      </button>
                    </div>

                    <div className="welcome-art">
                      <div className="welcome-orbit orbit-one" />
                      <div className="welcome-orbit orbit-two" />
                      <div className="welcome-heart">
                        <HeartPulse size={100} />
                      </div>
                    </div>
                  </section>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon blue">
                        <Package size={24} />
                      </div>
                      <span className="stat-label">
                        Produtos cadastrados
                      </span>
                      <strong>{produtos.length}</strong>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon purple">
                        <Boxes size={24} />
                      </div>
                      <span className="stat-label">
                        Unidades em estoque
                      </span>
                      <strong>{totalEstoque}</strong>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon green">
                        <CheckCircle2 size={24} />
                      </div>
                      <span className="stat-label">
                        Produtos disponíveis
                      </span>
                      <strong>{disponiveis}</strong>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon amber">
                        <CircleAlert size={24} />
                      </div>
                      <span className="stat-label">
                        Estoque baixo
                      </span>
                      <strong>{estoqueBaixo.length}</strong>
                    </div>
                  </div>

                  <div className="dashboard-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h3>Minha farmácia</h3>
                          <p>Informações do estabelecimento</p>
                        </div>
                        <Store size={23} />
                      </div>

                      <div className="pharmacy-info">
                        <h3>{farmacia.nome}</h3>
                        <span className="approved">
                          <ShieldCheck size={15} />
                          Parceira aprovada
                        </span>

                        <p>
                          <MapPin size={17} />
                          {farmacia.cidade} - {farmacia.estado}
                        </p>

                        <p>
                          <Phone size={17} />
                          {farmacia.telefone || "Não informado"}
                        </p>

                        <p>
                          <Truck size={17} />
                          {farmacia.faz_entrega
                            ? `Realiza entregas — ${moeda(
                                farmacia.taxa_entrega || "0"
                              )}`
                            : "Não realiza entregas"}
                        </p>

                        <button
                          className="btn btn-ghost"
                          onClick={() => navegar("perfil")}
                        >
                          <Pencil size={16} />
                          Editar minha farmácia
                        </button>
                      </div>
                    </section>

                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h3>Atenção ao estoque</h3>
                          <p>Produtos com até 5 unidades</p>
                        </div>
                        <Activity size={23} />
                      </div>

                      {estoqueBaixo.length === 0 ? (
                        <div className="stock-good">
                          <CheckCircle2 size={32} />
                          <strong>Estoque em dia!</strong>
                          <p>
                            Nenhum produto disponível está
                            com estoque baixo.
                          </p>
                        </div>
                      ) : (
                        <div className="stock-list">
                          {estoqueBaixo.slice(0, 5).map((p) => (
                            <div className="stock-item" key={p.id}>
                              <div>
                                <strong>{p.nome}</strong>
                                <small>
                                  {p.quantidade_estoque} unidades
                                </small>
                              </div>
                              <span className="low-pill">
                                Estoque baixo
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        className="btn btn-ghost"
                        onClick={() => navegar("estoque")}
                      >
                        Ver controle de estoque
                      </button>
                    </section>
                  </div>
                </>
              )}

              {(tela === "produtos" || tela === "estoque") && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">
                        GESTÃO FARMACÊUTICA
                      </p>
                      <h1>
                        {tela === "estoque"
                          ? "Controle de estoque"
                          : "Meus medicamentos"}
                      </h1>
                      <p>
                        {tela === "estoque"
                          ? "Acompanhe os produtos com estoque baixo."
                          : "Cadastre e gerencie os medicamentos."}
                      </p>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={novoProduto}
                    >
                      <Plus size={18} />
                      Novo produto
                    </button>
                  </div>

                  <section className="panel products-panel">
                    {formularioAberto && (
                      <form
                        className="product-form"
                        onSubmit={salvarProduto}
                      >
                        <div className="form-title">
                          <div>
                            <h3>
                              {produtoEditando !== null
                                ? "Editar medicamento"
                                : "Cadastrar medicamento"}
                            </h3>
                            <p>
                              Preencha as informações do produto.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => setFormularioAberto(false)}
                          >
                            <X size={19} />
                          </button>
                        </div>

                        <div className="form-grid">
                          <div className="field full">
                            <label>Nome do medicamento</label>
                            <input
                              value={formulario.nome}
                              onChange={(e) =>
                                setFormulario({
                                  ...formulario,
                                  nome: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="field full">
                            <label>Descrição</label>
                            <textarea
                              rows={3}
                              value={formulario.descricao}
                              onChange={(e) =>
                                setFormulario({
                                  ...formulario,
                                  descricao: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="field">
                            <label>Preço (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formulario.preco}
                              onChange={(e) =>
                                setFormulario({
                                  ...formulario,
                                  preco: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="field">
                            <label>Quantidade em estoque</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={formulario.quantidade_estoque}
                              onChange={(e) =>
                                setFormulario({
                                  ...formulario,
                                  quantidade_estoque: Number(
                                    e.target.value
                                  ),
                                })
                              }
                              required
                            />
                          </div>

                          <label className="toggle-row field full">
                            <input
                              type="checkbox"
                              checked={formulario.disponivel}
                              onChange={(e) =>
                                setFormulario({
                                  ...formulario,
                                  disponivel: e.target.checked,
                                })
                              }
                            />
                            Produto disponível
                          </label>
                        </div>

                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setFormularioAberto(false)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={salvandoProduto}
                          >
                            <Save size={18} />
                            {salvandoProduto
                              ? "Salvando..."
                              : "Salvar medicamento"}
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="panel-heading">
                      <div>
                        <h3>
                          {tela === "estoque"
                            ? "Produtos com estoque baixo"
                            : "Lista de medicamentos"}
                        </h3>
                        <p>
                          {produtosFiltrados.length} produtos encontrados
                        </p>
                      </div>
                    </div>

                    <div className="table-tools">
                      <div className="search-box">
                        <Search size={19} />
                        <input
                          placeholder="Pesquisar medicamento..."
                          value={pesquisa}
                          onChange={(e) =>
                            setPesquisa(e.target.value)
                          }
                        />
                        {pesquisa && (
                          <button onClick={() => setPesquisa("")}>
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Medicamento</th>
                            <th>Preço</th>
                            <th>Estoque</th>
                            <th>Situação</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produtosFiltrados.map((p) => {
                            const ativo =
                              p.disponivel &&
                              p.quantidade_estoque > 0;

                            return (
                              <tr key={p.id}>
                                <td>
                                  <div className="product-name">
                                    <div className="product-icon">
                                      <Pill size={19} />
                                    </div>
                                    <div>
                                      <strong>{p.nome}</strong>
                                      <small>{p.descricao}</small>
                                    </div>
                                  </div>
                                </td>
                                <td className="price-cell">
                                  {moeda(p.preco)}
                                </td>
                                <td>
                                  <span
                                    className={`quantity ${
                                      p.quantidade_estoque <= 5
                                        ? "low"
                                        : ""
                                    }`}
                                  >
                                    {p.quantidade_estoque} un.
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`status ${
                                      ativo
                                        ? "available"
                                        : "unavailable"
                                    }`}
                                  >
                                    <span />
                                    {ativo
                                      ? "Disponível"
                                      : "Indisponível"}
                                  </span>
                                </td>
                                <td>
                                  <div className="row-actions">
                                    <button
                                      title="Editar"
                                      onClick={() => editarProduto(p)}
                                    >
                                      <Pencil size={17} />
                                    </button>
                                    <button
                                      className="danger"
                                      title="Excluir"
                                      onClick={() =>
                                        void removerProduto(p)
                                      }
                                    >
                                      <Trash2 size={17} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {produtosFiltrados.length === 0 && (
                        <div className="table-empty">
                          <Package size={35} />
                          <strong>Nenhum medicamento encontrado</strong>
                          <p>
                            Cadastre um produto ou altere sua pesquisa.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {tela === "perfil" && perfilForm && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">
                        CONFIGURAÇÕES DA FARMÁCIA
                      </p>
                      <h1>Minha farmácia</h1>
                      <p>
                        Atualize os dados do seu estabelecimento.
                      </p>
                    </div>

                    <button
                      className="btn btn-ghost"
                      onClick={() => navegar("painel")}
                    >
                      <ArrowLeft size={17} />
                      Voltar
                    </button>
                  </div>

                  <section className="profile-banner">
                    <div className="profile-icon">
                      <Store size={29} />
                    </div>
                    <div>
                      <h2>{farmacia.nome}</h2>
                      <p>
                        <MapPin size={16} />
                        {farmacia.cidade} - {farmacia.estado}
                      </p>
                    </div>
                    <span className="approved">
                      <ShieldCheck size={16} />
                      Farmácia aprovada
                    </span>
                  </section>

                  <section className="panel profile-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Informações do estabelecimento</h3>
                        <p>
                          Mantenha seus dados sempre atualizados.
                        </p>
                      </div>
                      <Store size={24} />
                    </div>

                    <form onSubmit={salvarPerfil}>
                      <div className="form-grid">
                        <div className="field">
                          <label>Nome da farmácia</label>
                          <input
                            value={perfilForm.nome}
                            onChange={(e) =>
                              alterarPerfil("nome", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="field">
                          <label>CNPJ (não editável)</label>
                          <input value={farmacia.cnpj} disabled />
                        </div>

                        <div className="field">
                          <label>Telefone</label>
                          <input
                            value={perfilForm.telefone}
                            onChange={(e) =>
                              alterarPerfil(
                                "telefone",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="field">
                          <label>WhatsApp</label>
                          <input
                            value={perfilForm.whatsapp}
                            onChange={(e) =>
                              alterarPerfil(
                                "whatsapp",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="field full">
                          <label>Endereço completo</label>
                          <input
                            value={perfilForm.endereco}
                            onChange={(e) =>
                              alterarPerfil(
                                "endereco",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="field">
                          <label>Cidade</label>
                          <input
                            value={perfilForm.cidade}
                            onChange={(e) =>
                              alterarPerfil("cidade", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="field">
                          <label>Estado (UF)</label>
                          <input
                            maxLength={2}
                            value={perfilForm.estado}
                            onChange={(e) =>
                              alterarPerfil(
                                "estado",
                                e.target.value.toUpperCase()
                              )
                            }
                            required
                          />
                        </div>

                        <div className="field">
                          <label>CEP</label>
                          <input
                            value={perfilForm.cep}
                            onChange={(e) =>
                              alterarPerfil("cep", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="field">
                          <label>Horário de funcionamento</label>
                          <input
                            value={perfilForm.horario_funcionamento}
                            onChange={(e) =>
                              alterarPerfil(
                                "horario_funcionamento",
                                e.target.value
                              )
                            }
                            placeholder="Seg a Sex, 08h às 18h"
                          />
                        </div>

                        <label className="toggle-row field full">
                          <input
                            type="checkbox"
                            checked={perfilForm.faz_entrega}
                            onChange={(e) =>
                              alterarPerfil(
                                "faz_entrega",
                                e.target.checked
                              )
                            }
                          />
                          <Truck size={20} />
                          Esta farmácia realiza entregas
                        </label>

                        {perfilForm.faz_entrega && (
                          <div className="field">
                            <label>Taxa de entrega (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={perfilForm.taxa_entrega ?? ""}
                              onChange={(e) =>
                                alterarPerfil(
                                  "taxa_entrega",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        )}
                      </div>

                      {sucessoPerfil && (
                        <div className="feedback success">
                          <CheckCircle2 size={19} />
                          {sucessoPerfil}
                        </div>
                      )}

                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => navegar("painel")}
                        >
                          Cancelar
                        </button>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={salvandoPerfil}
                        >
                          <Save size={18} />
                          {salvandoPerfil
                            ? "Salvando..."
                            : "Salvar alterações"}
                        </button>
                      </div>
                    </form>
                  </section>
                </>
              )}
            </>
          )}

          <footer className="page-footer">
            <span>
              <HeartPulse size={15} />
              LembraFácil — Tecnologia a serviço do cuidado
            </span>
            <span>Portal das Farmácias Parceiras</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
