import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, RefreshControl, Keyboard, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  buscarMinhaFarmacia, listarProdutosFarmacia, adicionarProdutoFarmacia,
  atualizarProdutoFarmacia, excluirProdutoFarmacia,
  type PerfilFarmacia, type ProdutoFarmacia, type DadosProdutoFarmacia,
} from "../services/farmaciasService";

const ROXO = "#673AB7";
const AZUL = "#142B5B";
const FUNDO = "#F5F6FA";
const CINZA = "#64748B";
const VERDE = "#16845B";
const VERMELHO = "#C44852";
type Filtro = "todos" | "disponiveis" | "baixo" | "esgotados";

const moeda = (valor: unknown) => {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "R$ 0,00";
};
const numeroBR = (valor: number) => valor.toLocaleString("pt-BR");
const emVenda = (produto: ProdutoFarmacia) =>
  produto.disponivel && Number(produto.quantidade_estoque) > 0;

export default function FarmaciaPainel() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [farmacia, setFarmacia] = useState<PerfilFarmacia | null>(null);
  const [produtos, setProdutos] = useState<ProdutoFarmacia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [disponivel, setDisponivel] = useState(true);

  const carregarDados = useCallback(async (mostrarIndicador = false) => {
    if (mostrarIndicador) setAtualizando(true);
    try {
      const [perfil, lista] = await Promise.all([
        buscarMinhaFarmacia(), listarProdutosFarmacia(),
      ]);
      setFarmacia(perfil);
      setProdutos(lista);
    } catch (erro: any) {
      Alert.alert("Erro ao carregar", erro?.message || "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => { void carregarDados(); }, [carregarDados]);

  const resumo = useMemo(() => ({
    total: produtos.length,
    unidades: produtos.reduce((total, p) => total + (Number(p.quantidade_estoque) || 0), 0),
    baixo: produtos.filter(p => Number(p.quantidade_estoque) > 0 && Number(p.quantidade_estoque) <= 5).length,
    esgotados: produtos.filter(p => Number(p.quantidade_estoque) <= 0).length,
  }), [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return produtos.filter(p => {
      const corresponde = `${p.nome} ${p.descricao || ""}`.toLocaleLowerCase("pt-BR").includes(termo);
      if (!corresponde) return false;
      if (filtro === "disponiveis") return emVenda(p);
      if (filtro === "baixo") return Number(p.quantidade_estoque) > 0 && Number(p.quantidade_estoque) <= 5;
      if (filtro === "esgotados") return Number(p.quantidade_estoque) <= 0;
      return true;
    });
  }, [produtos, busca, filtro]);

  function limparFormulario() {
    setNome(""); setDescricao(""); setPreco(""); setQuantidade("");
    setDisponivel(true); setEditandoId(null); setMostrarFormulario(false);
    Keyboard.dismiss();
  }

  function novoProduto() {
    limparFormulario();
    setMostrarFormulario(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function editarProduto(produto: ProdutoFarmacia) {
    setEditandoId(produto.id);
    setNome(produto.nome);
    setDescricao(produto.descricao || "");
    setPreco(String(produto.preco).replace(".", ","));
    setQuantidade(String(produto.quantidade_estoque));
    setDisponivel(produto.disponivel);
    setMostrarFormulario(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function salvarProduto() {
    if (salvando) return;
    const valor = Number(preco.trim().replace(",", "."));
    const estoque = Number(quantidade.trim());
    if (!nome.trim()) return Alert.alert("Atenção", "Informe o nome do medicamento.");
    if (!preco.trim() || !Number.isFinite(valor) || valor < 0)
      return Alert.alert("Atenção", "Informe um preço válido. Ex.: 12,90");
    if (!quantidade.trim() || !/^\d+$/.test(quantidade.trim()) || !Number.isSafeInteger(estoque))
      return Alert.alert("Atenção", "Informe uma quantidade inteira válida.");

    const dados: DadosProdutoFarmacia = {
      nome: nome.trim(), descricao: descricao.trim(), preco: valor.toFixed(2),
      quantidade_estoque: estoque, disponivel,
    };
    const estavaEditando = editandoId !== null;
    try {
      setSalvando(true);
      if (editandoId !== null) await atualizarProdutoFarmacia(editandoId, dados);
      else await adicionarProdutoFarmacia(dados);
      limparFormulario();
      await carregarDados();
      Alert.alert("Sucesso", estavaEditando ? "Medicamento atualizado!" : "Medicamento cadastrado!");
    } catch (erro: any) {
      Alert.alert("Erro", erro?.message || "Não foi possível salvar o medicamento.");
    } finally { setSalvando(false); }
  }

  function confirmarExclusao(produto: ProdutoFarmacia) {
    Alert.alert("Excluir medicamento", `Deseja excluir ${produto.nome}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try {
          await excluirProdutoFarmacia(produto.id);
          await carregarDados();
          Alert.alert("Sucesso", "Medicamento excluído.");
        } catch (erro: any) {
          Alert.alert("Erro", erro?.message || "Não foi possível excluir.");
        }
      } },
    ]);
  }

  if (carregando) return (
    <SafeAreaView style={styles.centralizado}>
      <ActivityIndicator size="large" color={ROXO} />
      <Text style={styles.secundario}>Carregando painel da farmácia...</Text>
    </SafeAreaView>
  );

  const filtros: { chave: Filtro; titulo: string }[] = [
    { chave: "todos", titulo: "Todos" },
    { chave: "disponiveis", titulo: "Disponíveis" },
    { chave: "baixo", titulo: "Estoque baixo" },
    { chave: "esgotados", titulo: "Esgotados" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => void carregarDados(true)} tintColor={ROXO} colors={[ROXO]} />}>
        <View style={styles.navegacao}>
          <TouchableOpacity onPress={() => router.replace("/farmacias")} style={styles.voltar} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={22} color={AZUL} />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.navegacaoTitulo}>Painel da farmácia</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTopo}>
            <View style={styles.logo}><Ionicons name="medkit" size={27} color="#FFFFFF" /></View>
            <View style={styles.heroIdentidade}>
              <Text style={styles.heroSobretitulo}>LEMBRAFÁCIL • FARMÁCIA</Text>
              <Text style={styles.heroNome} numberOfLines={2}>{farmacia?.nome || "Farmácia Parceira"}</Text>
            </View>
          </View>
          <View style={styles.selo}>
            <Ionicons name="checkmark-circle" size={17} color="#BDF7D5" />
            <Text style={styles.seloTexto}>Farmácia autorizada</Text>
          </View>
          <Text style={styles.heroDescricao}>Seu catálogo atualizado, tudo em um só lugar.</Text>
        </View>

        <View style={styles.resumo}>
          <View style={styles.cardResumo}>
            <Ionicons name="medical" size={23} color={ROXO} />
            <Text style={styles.numeroResumo} numberOfLines={1} adjustsFontSizeToFit>{numeroBR(resumo.total)}</Text>
            <Text style={styles.rotuloResumo}>Produtos</Text>
          </View>
          <View style={styles.cardResumo}>
            <Ionicons name="cube-outline" size={23} color="#159789" />
            <Text style={styles.numeroResumo} numberOfLines={1} adjustsFontSizeToFit>{numeroBR(resumo.unidades)}</Text>
            <Text style={styles.rotuloResumo}>Unidades</Text>
          </View>
          <View style={styles.cardResumo}>
            <Ionicons name="alert-circle-outline" size={23} color="#D68C25" />
            <Text style={styles.numeroResumo} numberOfLines={1} adjustsFontSizeToFit>{numeroBR(resumo.baixo)}</Text>
            <Text style={styles.rotuloResumo}>Estoque baixo</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.botaoNovo} onPress={novoProduto}>
          <Ionicons name="add-circle-outline" size={23} color="#FFFFFF" />
          <Text style={styles.botaoNovoTexto}>Cadastrar medicamento</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {mostrarFormulario && (
          <View style={styles.formulario}>
            <View style={styles.formularioTopo}>
              <Text style={styles.tituloFormulario}>{editandoId !== null ? "Editar medicamento" : "Novo medicamento"}</Text>
              <TouchableOpacity onPress={limparFormulario} accessibilityLabel="Fechar formulário">
                <Ionicons name="close-circle-outline" size={26} color={CINZA} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Nome do medicamento *</Text>
            <TextInput style={styles.input} placeholder="Ex.: Paracetamol 500 mg" placeholderTextColor="#94A3B8" value={nome} onChangeText={setNome} />
            <Text style={styles.label}>Descrição</Text>
            <TextInput style={[styles.input, styles.inputMaior]} placeholder="Informações sobre o produto" placeholderTextColor="#94A3B8" value={descricao} onChangeText={setDescricao} multiline />
            <Text style={styles.label}>Preço (R$) *</Text>
            <TextInput style={styles.input} placeholder="Ex.: 12,90" placeholderTextColor="#94A3B8" value={preco} onChangeText={setPreco} keyboardType="decimal-pad" />
            <Text style={styles.label}>Quantidade em estoque *</Text>
            <TextInput style={styles.input} placeholder="Ex.: 30" placeholderTextColor="#94A3B8" value={quantidade} onChangeText={setQuantidade} keyboardType="number-pad" />
            <View style={styles.linhaDisponivel}>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelDisponivel}>Disponível para venda</Text>
                <Text style={styles.ajudaDisponivel}>Estoque zerado será exibido como esgotado.</Text>
              </View>
              <Switch value={disponivel} onValueChange={setDisponivel} trackColor={{ false: "#CBD5E1", true: "#D5C1FA" }} thumbColor={disponivel ? ROXO : "#F8FAFC"} />
            </View>
            <TouchableOpacity style={[styles.botaoSalvar, salvando && { opacity: 0.6 }]} onPress={() => void salvarProduto()} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#FFFFFF" /> : <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.botaoSalvarTexto}>{editandoId !== null ? "Salvar alterações" : "Cadastrar medicamento"}</Text>
              </>}
            </TouchableOpacity>
            <TouchableOpacity onPress={limparFormulario} style={styles.botaoCancelar}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
          </View>
        )}

        <View style={styles.secaoTitulo}>
          <View>
            <Text style={styles.tituloSecao}>Meus medicamentos</Text>
            <Text style={styles.secaoSubtitulo}>{numeroBR(produtosFiltrados.length)} de {numeroBR(produtos.length)} produtos</Text>
          </View>
          <TouchableOpacity onPress={() => void carregarDados(true)} accessibilityLabel="Atualizar produtos">
            <Ionicons name="refresh" size={23} color={ROXO} />
          </TouchableOpacity>
        </View>

        <View style={styles.campoBusca}>
          <Ionicons name="search-outline" size={21} color={CINZA} />
          <TextInput style={styles.buscaInput} value={busca} onChangeText={setBusca} placeholder="Buscar medicamento..." placeholderTextColor="#94A3B8" autoCorrect={false} />
          {!!busca && <TouchableOpacity onPress={() => setBusca("")} accessibilityLabel="Limpar busca"><Ionicons name="close-circle" size={19} color={CINZA} /></TouchableOpacity>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {filtros.map(item => (
            <TouchableOpacity key={item.chave} onPress={() => setFiltro(item.chave)}
              style={[styles.filtro, filtro === item.chave && styles.filtroAtivo]}>
              <Text style={[styles.filtroTexto, filtro === item.chave && styles.filtroTextoAtivo]}>{item.titulo}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {produtosFiltrados.length === 0 ? (
          <View style={styles.vazio}>
            <Ionicons name="file-tray-outline" size={40} color="#94A3B8" />
            <Text style={styles.vazioTitulo}>{produtos.length === 0 ? "Nenhum medicamento cadastrado" : "Nenhum resultado encontrado"}</Text>
            <Text style={styles.secundario}>{produtos.length === 0 ? "Cadastre seu primeiro medicamento para começar." : "Tente outra pesquisa ou altere o filtro."}</Text>
          </View>
        ) : produtosFiltrados.map(produto => {
          const estoque = Number(produto.quantidade_estoque);
          const esgotado = estoque <= 0;
          const baixo = !esgotado && estoque <= 5;
          const ativo = emVenda(produto);
          return (
            <View key={produto.id} style={styles.cardProduto}>
              <View style={styles.produtoTopo}>
                <View style={styles.produtoIcone}><Ionicons name="medical-outline" size={25} color={ROXO} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nomeProduto}>{produto.nome}</Text>
                  {!!produto.descricao && <Text style={styles.descricaoProduto} numberOfLines={2}>{produto.descricao}</Text>}
                </View>
              </View>
              <View style={styles.produtoInfo}>
                <Text style={styles.precoProduto}>{moeda(produto.preco)}</Text>
                <View style={[styles.status, { backgroundColor: ativo ? "#E6F7EF" : "#FFF0F0" }]}>
                  <Text style={[styles.statusTexto, { color: ativo ? VERDE : VERMELHO }]}>{esgotado ? "Esgotado" : ativo ? "Disponível" : "Indisponível"}</Text>
                </View>
              </View>
              <View style={styles.estoqueLinha}>
                <Ionicons name="cube-outline" size={16} color={CINZA} />
                <Text style={styles.estoqueProduto}>Estoque: {numeroBR(estoque)} unidades</Text>
                {baixo && <Text style={styles.alertaBaixo}>Baixo</Text>}
              </View>
              <View style={styles.acoes}>
                <TouchableOpacity style={styles.botaoEditar} onPress={() => editarProduto(produto)}>
                  <Ionicons name="create-outline" size={18} color={ROXO} />
                  <Text style={styles.editarTexto}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoExcluir} onPress={() => confirmarExclusao(produto)}>
                  <Ionicons name="trash-outline" size={18} color={VERMELHO} />
                  <Text style={styles.excluirTexto}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FUNDO },
  centralizado: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: FUNDO, gap: 12 },
  conteudo: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 65 },
  secundario: { color: CINZA, textAlign: "center", lineHeight: 21 },
  navegacao: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  voltarTexto: { color: AZUL, fontWeight: "700", fontSize: 16 },
  navegacaoTitulo: { color: CINZA, fontSize: 12, fontWeight: "600" },
  hero: { backgroundColor: ROXO, borderRadius: 23, padding: 20, marginBottom: 15 },
  heroTopo: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#FFFFFF2B", alignItems: "center", justifyContent: "center" },
  heroIdentidade: { flex: 1 },
  heroSobretitulo: { color: "#E5D8FC", fontSize: 10, fontWeight: "700", letterSpacing: 0.7 },
  heroNome: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 3 },
  selo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 17 },
  seloTexto: { color: "#D8FFE7", fontSize: 13, fontWeight: "700" },
  heroDescricao: { color: "#E9DCFF", fontSize: 13, marginTop: 9 },
  resumo: { flexDirection: "row", gap: 9, marginBottom: 16 },
  cardResumo: { flex: 1, minWidth: 0, backgroundColor: "#FFFFFF", borderRadius: 17, paddingVertical: 15, paddingHorizontal: 5, alignItems: "center", elevation: 2 },
  numeroResumo: { fontSize: 23, fontWeight: "800", color: AZUL, marginTop: 8, maxWidth: "100%" },
  rotuloResumo: { color: CINZA, fontSize: 11, textAlign: "center", marginTop: 4 },
  botaoNovo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: ROXO, borderRadius: 15, paddingVertical: 16, marginBottom: 24 },
  botaoNovoTexto: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", flex: 1, textAlign: "center" },
  formulario: { backgroundColor: "#FFFFFF", borderRadius: 19, padding: 18, marginBottom: 24, elevation: 2 },
  formularioTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  tituloFormulario: { color: AZUL, fontSize: 19, fontWeight: "800" },
  label: { color: AZUL, fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: { borderWidth: 1, borderColor: "#DFE5EE", backgroundColor: "#FAFBFD", borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, color: AZUL, fontSize: 15, marginBottom: 15 },
  inputMaior: { minHeight: 76, textAlignVertical: "top" },
  linhaDisponivel: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  labelDisponivel: { color: AZUL, fontWeight: "700", fontSize: 14 },
  ajudaDisponivel: { color: CINZA, fontSize: 11, marginTop: 4 },
  botaoSalvar: { backgroundColor: ROXO, borderRadius: 13, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  botaoSalvarTexto: { color: "#FFFFFF", fontWeight: "800" },
  botaoCancelar: { padding: 14, alignItems: "center" },
  cancelarTexto: { color: CINZA, fontWeight: "700" },
  secaoTitulo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  tituloSecao: { color: AZUL, fontSize: 21, fontWeight: "800" },
  secaoSubtitulo: { color: CINZA, fontSize: 12, marginTop: 4 },
  campoBusca: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "#E3E7EF", backgroundColor: "#FFFFFF", borderRadius: 13, paddingHorizontal: 13, marginBottom: 13 },
  buscaInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: AZUL },
  filtros: { gap: 8, paddingBottom: 16 },
  filtro: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: "#E0E4EC", backgroundColor: "#FFFFFF" },
  filtroAtivo: { backgroundColor: ROXO, borderColor: ROXO },
  filtroTexto: { color: CINZA, fontSize: 12, fontWeight: "700" },
  filtroTextoAtivo: { color: "#FFFFFF" },
  vazio: { backgroundColor: "#FFFFFF", padding: 26, borderRadius: 18, alignItems: "center", gap: 10 },
  vazioTitulo: { color: AZUL, fontSize: 16, fontWeight: "800", textAlign: "center" },
  cardProduto: { backgroundColor: "#FFFFFF", borderRadius: 19, padding: 16, marginBottom: 13, elevation: 2 },
  produtoTopo: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  produtoIcone: { width: 47, height: 47, borderRadius: 14, backgroundColor: "#F0EAFE", alignItems: "center", justifyContent: "center" },
  nomeProduto: { color: AZUL, fontSize: 17, fontWeight: "800" },
  descricaoProduto: { color: CINZA, fontSize: 13, lineHeight: 19, marginTop: 4 },
  produtoInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15, gap: 8 },
  precoProduto: { color: ROXO, fontSize: 23, fontWeight: "800", flexShrink: 1 },
  status: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusTexto: { fontSize: 11, fontWeight: "800" },
  estoqueLinha: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 11 },
  estoqueProduto: { color: CINZA, fontSize: 12, flex: 1 },
  alertaBaixo: { color: "#B7791F", backgroundColor: "#FFF3D6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, fontSize: 11, fontWeight: "800" },
  acoes: { flexDirection: "row", gap: 10, marginTop: 16, paddingTop: 13, borderTopWidth: 1, borderTopColor: "#F1F3F7" },
  botaoEditar: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, padding: 12, borderRadius: 11, backgroundColor: "#F0EAFE" },
  editarTexto: { color: ROXO, fontWeight: "800" },
  botaoExcluir: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, padding: 12, borderRadius: 11, backgroundColor: "#FFF0F0" },
  excluirTexto: { color: VERMELHO, fontWeight: "800" },
});
