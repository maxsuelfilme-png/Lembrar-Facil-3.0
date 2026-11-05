import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {

  ActivityIndicator, Alert, Linking, RefreshControl, ScrollView,

  StyleSheet, Text, TextInput, TouchableOpacity, View,

} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { buscarCatalogoFarmacias, type ProdutoCatalogo } from "../services/farmaciasService";

type Produto = ProdutoCatalogo & {

  farmacia_endereco?: string | null;

  farmacia_telefone?: string | null;

  farmacia_whatsapp?: string | null;

  farmacia_horario_funcionamento?: string | null;

  farmacia_taxa_entrega?: string | number | null;

};

type Ordem = "menor" | "maior" | "nome";

const C = {

  fundo: "#F6F8FD", branco: "#FFFFFF", azul: "#142B5B",

  roxo: "#673AB7", verde: "#16834A", cinza: "#64748B",

  borda: "#E5EAF2", claro: "#F2EBFC",

};

const dinheiro = (valor: string | number | null | undefined) => {

  const numero = valor == null || String(valor).trim() === "" ? NaN : Number(valor);

  return Number.isFinite(numero) ? `R$ ${numero.toFixed(2).replace(".", ",")}` : "Preço indisponível";

};

const precoNumero = (valor: string | number | null | undefined) => {

  const n = valor == null || String(valor).trim() === "" ? NaN : Number(valor);

  return valor == null || !Number.isFinite(n) ? Infinity : n;

};

const normalizar = (texto: unknown) =>

  String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const numeros = (valor: unknown) => String(valor ?? "").replace(/\D/g, "");

export default function FarmaciasBusca() {

  const router = useRouter();

  const [busca, setBusca] = useState("");

  const [termoAplicado, setTermoAplicado] = useState("");

  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [atualizando, setAtualizando] = useState(false);

  const [erro, setErro] = useState("");

  const [ordem, setOrdem] = useState<Ordem>("menor");

  const [somenteEntrega, setSomenteEntrega] = useState(false);

  const [somenteEstoque, setSomenteEstoque] = useState(false);

  const [favoritos, setFavoritos] = useState<string[]>([]);

  const requisicao = useRef(0);

  const carregar = useCallback(async (termo = "", refresh = false) => {

    const atual = ++requisicao.current;

    if (refresh) setAtualizando(true);

    else setCarregando(true);

    setErro("");

    try {

      const lista = await buscarCatalogoFarmacias(termo);

      if (atual === requisicao.current) {

        setProdutos(Array.isArray(lista) ? lista : []);

        setTermoAplicado(termo);

      }

    } catch (e) {

      if (atual === requisicao.current) {

        setErro(e instanceof Error ? e.message : "Não foi possível consultar os medicamentos.");

      }

    } finally {

      if (atual === requisicao.current) {

        setCarregando(false);

        setAtualizando(false);

      }

    }

  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const exibidos = useMemo(() => {

    const filtrados = produtos.filter(p =>

      (!somenteEntrega || p.farmacia_faz_entrega === true) &&

      (!somenteEstoque || Number(p.quantidade_estoque) > 0)

    );

    return [...filtrados].sort((a, b) => {

      if (ordem === "nome") return a.nome.localeCompare(b.nome, "pt-BR");

      const precoA = precoNumero(a.preco);

      const precoB = precoNumero(b.preco);

      // Preços não informados ficam sempre no final.

      if (precoA === Infinity) return precoB === Infinity ? 0 : 1;

      if (precoB === Infinity) return -1;

      return ordem === "menor" ? precoA - precoB : precoB - precoA;

    });

  }, [produtos, ordem, somenteEntrega, somenteEstoque]);

  const menores = useMemo(() => {

    const mapa = new Map<string, number>();

    produtos.forEach(p => {

      const chave = normalizar(`${p.nome} ${p.descricao ?? ""}`);

      const preco = precoNumero(p.preco);

      if (chave && Number(p.quantidade_estoque) > 0 && preco < Infinity) {

        mapa.set(chave, Math.min(mapa.get(chave) ?? Infinity, preco));

      }

    });

    return mapa;

  }, [produtos]);

  async function abrirUrl(url: string, mensagemErro: string) {
    try {
      await Linking.openURL(url);
    } catch (erro) {
      console.error("Erro ao abrir contato:", erro);
      Alert.alert("Não foi possível abrir", mensagemErro);
    }
  }

  function ligar(p: Produto) {
    const telefone = numeros(p.farmacia_telefone);
    if (!/^(?:\d{10,11}|55\d{10,11})$/.test(telefone)) {
      Alert.alert("Telefone indisponível", "A farmácia não informou um telefone brasileiro válido.");
      return;
    }
    const internacional = telefone.length >= 12 ? `+${telefone}` : telefone;
    void abrirUrl(`tel:${internacional}`, "Não foi possível abrir o discador.");
  }

  function whatsapp(p: Produto) {
    let numero = numeros(p.farmacia_whatsapp || p.farmacia_telefone);
    if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
    if (!/^55\d{10,11}$/.test(numero)) {
      Alert.alert("WhatsApp indisponível", "A farmácia não informou um WhatsApp brasileiro válido.");
      return;
    }
    const mensagem = `Olá! Encontrei ${p.nome} no LembraFácil 3.0, anunciado pela ${p.farmacia_nome} por ${dinheiro(p.preco)}. Gostaria de confirmar o preço e a disponibilidade.`;
    void abrirUrl(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "Não foi possível abrir o WhatsApp ou o navegador.");
  }

  function detalhes(p: Produto) {

    const endereco = [p.farmacia_endereco, p.farmacia_cidade, p.farmacia_estado].filter(Boolean).join(", ");

    const taxa = p.farmacia_faz_entrega && p.farmacia_taxa_entrega != null

      ? `\nTaxa de entrega: ${dinheiro(p.farmacia_taxa_entrega)}` : "";

    Alert.alert(p.nome,

      `Farmácia: ${p.farmacia_nome}\nPreço: ${dinheiro(p.preco)}\nEstoque informado: ${p.quantidade_estoque} unidades\n` +

      `Endereço: ${endereco || "Não informado"}\nFuncionamento: ${p.farmacia_horario_funcionamento || "Não informado"}\n` +

      `Entrega: ${p.farmacia_faz_entrega ? "Sim" : "Não"}${taxa}\n\nConfirme as informações com a farmácia antes de comprar.`,

      [{ text: "Fechar", style: "cancel" }, { text: "Ligar", onPress: () => ligar(p) }]

    );

  }

  function alternarFavorito(p: Produto) {

    const chave = String(p.id);

    setFavoritos(lista => lista.includes(chave) ? lista.filter(x => x !== chave) : [...lista, chave]);

  }

  return (

    <SafeAreaView style={s.tela}>

      <ScrollView

        keyboardShouldPersistTaps="handled"

        contentContainerStyle={s.conteudo}

        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => void carregar(termoAplicado, true)} colors={[C.roxo]} />}

      >

        <TouchableOpacity style={s.voltar} onPress={() => router.back()}>

          <Ionicons name="arrow-back" size={21} color={C.azul} />

          <Text style={s.voltarTexto}>Voltar</Text>

        </TouchableOpacity>

        <View style={s.cabecalho}>

          <View style={s.icone}><Ionicons name="medical-outline" size={27} color="white" /></View>

          <View style={{ width: "100%" }}>

            <Text style={s.marca}>LEMBRAFÁCIL 3.0</Text>

            <Text style={s.titulo}>Encontre seu medicamento</Text>

            <Text style={s.subtitulo}>Compare preços nas farmácias parceiras.</Text>

          </View>

        </View>

        <View style={s.pesquisa}>

          <Ionicons name="search-outline" size={22} color={C.cinza} />

          <TextInput

            style={s.input} placeholder="Nome do medicamento"

            placeholderTextColor="#94A3B8" value={busca} onChangeText={setBusca}

            returnKeyType="search" onSubmitEditing={() => void carregar(busca.trim())}

            accessibilityLabel="Pesquisar medicamento"

          />

          {busca.length > 0 && (

            <TouchableOpacity accessibilityLabel="Limpar pesquisa" onPress={() => { setBusca(""); void carregar(""); }}>

              <Ionicons name="close-circle" size={22} color={C.cinza} />

            </TouchableOpacity>

          )}

          <TouchableOpacity style={s.pesquisarBotao} accessibilityLabel="Buscar" onPress={() => void carregar(busca.trim())}>

            <Ionicons name="arrow-forward" size={20} color="white" />

          </TouchableOpacity>

        </View>

        <Text style={s.rotulo}>Filtros rápidos</Text>

        <View style={s.filtros}>

          <TouchableOpacity style={[s.chip, somenteEntrega && s.chipAtivo]} onPress={() => setSomenteEntrega(v => !v)}>

            <Ionicons name="bicycle-outline" size={16} color={somenteEntrega ? C.roxo : C.cinza} />

            <Text style={[s.chipTexto, somenteEntrega && s.chipTextoAtivo]}>Com entrega</Text>

          </TouchableOpacity>

          <TouchableOpacity style={[s.chip, somenteEstoque && s.chipAtivo]} onPress={() => setSomenteEstoque(v => !v)}>

            <Ionicons name="cube-outline" size={16} color={somenteEstoque ? C.roxo : C.cinza} />

            <Text style={[s.chipTexto, somenteEstoque && s.chipTextoAtivo]}>Em estoque</Text>

          </TouchableOpacity>

        </View>

        <Text style={s.rotulo}>Ordenar resultados</Text>

        <View style={s.ordenacao}>

          {([["menor", "Menor preço"], ["maior", "Maior preço"], ["nome", "Nome A–Z"]] as const).map(([valor, titulo]) => (

            <TouchableOpacity key={valor} style={[s.ordemBotao, ordem === valor && s.ordemAtiva]} onPress={() => setOrdem(valor)}>

              <Text style={[s.ordemTexto, ordem === valor && s.ordemTextoAtivo]}>{titulo}</Text>

            </TouchableOpacity>

          ))}

        </View>

        <View style={s.resultadosCabecalho}>

          <Text style={s.secao}>Medicamentos disponíveis</Text>

          {!carregando && !erro && <Text style={s.contagem}>{exibidos.length} resultado(s)</Text>}

        </View>

        {carregando ? (

          <View style={s.estado}><ActivityIndicator size="large" color={C.roxo} /><Text style={s.secundario}>Buscando medicamentos...</Text></View>

        ) : erro ? (

          <View style={s.estado}>

            <Ionicons name="alert-circle-outline" size={36} color="#C24141" />

            <Text style={s.secundario}>{erro}</Text>

            <TouchableOpacity style={s.acao} onPress={() => void carregar(busca.trim())}><Text style={s.acaoTexto}>Tentar novamente</Text></TouchableOpacity>

          </View>

        ) : exibidos.length === 0 ? (

          <View style={s.estado}>

            <Ionicons name="search-outline" size={38} color={C.cinza} />

            <Text style={s.estadoTitulo}>Nenhum medicamento encontrado</Text>

            <Text style={s.secundario}>Tente outro nome ou desative algum filtro.</Text>

          </View>

        ) : exibidos.map(p => {

          const emEstoque = Number(p.quantidade_estoque) > 0;

          const menor = emEstoque && precoNumero(p.preco) < Infinity &&

            precoNumero(p.preco) === menores.get(normalizar(`${p.nome} ${p.descricao ?? ""}`));

          const favorito = favoritos.includes(String(p.id));

          return (

            <View key={String(p.id)} style={s.card}>

              <View style={s.cardTopo}>

                <View style={{ flex: 1 }}>

                  <Text style={s.nome}>{p.nome}</Text>

                  <Text style={s.farmacia}>{p.farmacia_nome}</Text>

                </View>

                <TouchableOpacity onPress={() => alternarFavorito(p)} accessibilityLabel={favorito ? "Remover favorito" : "Marcar favorito"}>

                  <Ionicons name={favorito ? "heart" : "heart-outline"} size={25} color={C.roxo} />

                </TouchableOpacity>

              </View>

              {!!p.descricao && <Text style={s.descricao} numberOfLines={2}>{p.descricao}</Text>}

              <View style={s.precoLinha}>

                <View><Text style={s.precoLabel}>Preço informado</Text><Text style={s.preco}>{dinheiro(p.preco)}</Text></View>

                {menor && <View style={s.selo}><Ionicons name="pricetag-outline" size={13} color={C.verde} /><Text style={s.seloTexto}>Menor preço*</Text></View>}

              </View>

              <View style={s.infoLinha}><Ionicons name="location-outline" size={17} color={C.cinza} />

                <Text style={s.infoTexto} numberOfLines={2}>{[p.farmacia_cidade, p.farmacia_estado].filter(Boolean).join(" - ") || "Local não informado"}</Text>

              </View>

              <View style={s.infoLinha}><Ionicons name="cube-outline" size={17} color={C.cinza} />

                <Text style={s.infoTexto}>{emEstoque ? `${p.quantidade_estoque} unidades informadas` : "Sem unidades disponíveis no estoque informado"}</Text>

              </View>

              <View style={s.infoLinha}><Ionicons name="bicycle-outline" size={17} color={C.cinza} />

                <Text style={s.infoTexto}>{p.farmacia_faz_entrega ? "Entrega disponível" : "Retirada na farmácia"}</Text>

              </View>

              <View style={s.botoes}>

                <TouchableOpacity style={s.botaoDetalhes} onPress={() => detalhes(p)}>

                  <Ionicons name="information-circle-outline" size={18} color={C.roxo} />

                  <Text style={s.detalhesTexto}>Detalhes</Text>

                </TouchableOpacity>

                <TouchableOpacity style={s.botaoLigar} onPress={() => ligar(p)}>

                  <Ionicons name="call-outline" size={18} color={C.azul} />

                  <Text style={s.ligarTexto}>Ligar</Text>

                </TouchableOpacity>

              </View>

              <TouchableOpacity style={s.botaoWhats} onPress={() => whatsapp(p)}>

                <Ionicons name="logo-whatsapp" size={19} color="white" />

                <Text style={s.whatsTexto}>Consultar pelo WhatsApp</Text>

              </TouchableOpacity>

            </View>

          );

        })}

        <Text style={s.aviso}>*Menor preço entre os itens com o mesmo nome e descrição retornados nesta consulta. Confirme dosagem, apresentação e quantidade antes de comparar. Preços e estoques são informados pelas farmácias; confirme antes da compra.</Text>

        <Text style={s.aviso}>Favoritos desta tela são temporários e não ficam salvos após fechar o aplicativo.</Text>

      </ScrollView>

    </SafeAreaView>

  );

}

const s = StyleSheet.create({

  tela: { flex: 1, backgroundColor: C.fundo },

  conteudo: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 48 },

  voltar: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 20 },

  voltarTexto: { fontSize: 15, fontWeight: "700", color: C.azul },

  cabecalho: { alignItems: "center", gap: 10, marginBottom: 24, paddingVertical: 14 },

  icone: { width: 58, height: 58, backgroundColor: C.roxo, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  marca: { color: C.roxo, fontWeight: "800", fontSize: 11, letterSpacing: 1, textAlign: "center" },

  titulo: { fontSize: 23, fontWeight: "900", color: C.azul, marginTop: 3, textAlign: "center" },

  subtitulo: { color: C.cinza, fontSize: 14, marginTop: 6, textAlign: "center", lineHeight: 21 },

  pesquisa: { backgroundColor: C.branco, borderWidth: 1, borderColor: C.borda, borderRadius: 17, flexDirection: "row", alignItems: "center", paddingLeft: 13, paddingRight: 7, gap: 9, marginBottom: 20 },

  input: { flex: 1, height: 56, fontSize: 15, color: C.azul, minWidth: 0 },

  pesquisarBotao: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.roxo, justifyContent: "center", alignItems: "center" },

  rotulo: { fontSize: 13, fontWeight: "800", color: C.azul, marginBottom: 9 },

  filtros: { flexDirection: "column", gap: 10, marginBottom: 22 },

  chip: { borderWidth: 1, borderColor: C.borda, backgroundColor: C.branco, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, flexDirection: "row", alignItems: "center", gap: 10 },

  chipAtivo: { borderColor: C.roxo, backgroundColor: C.claro },

  chipTexto: { fontSize: 13, fontWeight: "700", color: C.cinza },

  chipTextoAtivo: { color: C.roxo },

  ordenacao: { flexDirection: "column", gap: 9, marginBottom: 26 },

  ordemBotao: { paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", borderRadius: 13, backgroundColor: C.branco, borderWidth: 1, borderColor: C.borda },

  ordemAtiva: { backgroundColor: C.roxo, borderColor: C.roxo },

  ordemTexto: { fontSize: 14, fontWeight: "700", color: C.cinza },

  ordemTextoAtivo: { color: C.branco },

  resultadosCabecalho: { alignItems: "flex-start", marginBottom: 14, gap: 5 },

  secao: { flex: 1, fontSize: 19, fontWeight: "900", color: C.azul },

  contagem: { fontSize: 12, color: C.cinza },

  estado: { backgroundColor: C.branco, borderRadius: 18, padding: 28, alignItems: "center", gap: 12 },

  estadoTitulo: { fontSize: 17, fontWeight: "800", color: C.azul, textAlign: "center" },

  secundario: { color: C.cinza, fontSize: 14, textAlign: "center", lineHeight: 21 },

  acao: { padding: 13, borderRadius: 12, backgroundColor: C.roxo },

  acaoTexto: { color: C.branco, fontWeight: "800" },

  card: { backgroundColor: C.branco, borderRadius: 20, padding: 17, marginBottom: 13, borderWidth: 1, borderColor: C.borda, elevation: 2 },

  cardTopo: { flexDirection: "row", gap: 10, alignItems: "flex-start" },

  nome: { fontSize: 19, fontWeight: "900", color: C.azul },

  farmacia: { fontSize: 14, color: C.cinza, marginTop: 4 },

  descricao: { fontSize: 13, color: C.cinza, lineHeight: 19, marginTop: 9 },

  precoLinha: { flexDirection: "column", alignItems: "flex-start", marginVertical: 16, gap: 9, backgroundColor: "#F8F5FE", borderRadius: 14, padding: 14 },

  precoLabel: { fontSize: 11, color: C.cinza },

  preco: { fontSize: 26, fontWeight: "900", color: C.roxo, marginTop: 2 },

  selo: { backgroundColor: "#EAF8EF", padding: 7, borderRadius: 9, flexDirection: "row", gap: 4, alignItems: "center" },

  seloTexto: { fontSize: 10, color: C.verde, fontWeight: "800" },

  infoLinha: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },

  infoTexto: { flex: 1, fontSize: 13, color: C.cinza },

  botoes: { flexDirection: "column", gap: 10, marginTop: 16 },

  botaoDetalhes: { minHeight: 48, backgroundColor: C.claro, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },

  detalhesTexto: { fontWeight: "800", color: C.roxo, fontSize: 13 },

  botaoLigar: { minHeight: 48, backgroundColor: "#EDF2FA", borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },

  ligarTexto: { fontWeight: "800", color: C.azul, fontSize: 13 },

  botaoWhats: { minHeight: 50, marginTop: 9, backgroundColor: C.verde, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },

  whatsTexto: { fontSize: 14, fontWeight: "800", color: C.branco },

  aviso: { textAlign: "center", fontSize: 12, lineHeight: 18, color: C.cinza, marginTop: 12 },

});
