
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  buscarMinhaFarmacia,
  listarProdutosFarmacia,
  adicionarProdutoFarmacia,
  atualizarProdutoFarmacia,
  excluirProdutoFarmacia,
  type PerfilFarmacia,
  type ProdutoFarmacia,
  type DadosProdutoFarmacia,
} from "../services/farmaciasService";

const AZUL = "#142B5B";
const ROXO = "#673AB7";

export default function FarmaciaPainel() {
  const router = useRouter();

  const [farmacia, setFarmacia] = useState<PerfilFarmacia | null>(null);
  const [produtos, setProdutos] = useState<ProdutoFarmacia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [disponivel, setDisponivel] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      const [perfil, lista] = await Promise.all([
        buscarMinhaFarmacia(),
        listarProdutosFarmacia(),
      ]);

      setFarmacia(perfil);
      setProdutos(lista);
    } catch (erro: any) {
      Alert.alert(
        "Erro ao carregar",
        erro.message || "Não foi possível carregar os dados."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setPreco("");
    setQuantidade("");
    setDisponivel(true);
    setEditandoId(null);
    setMostrarFormulario(false);
  }

  function editarProduto(produto: ProdutoFarmacia) {
    setEditandoId(produto.id);
    setNome(produto.nome);
    setDescricao(produto.descricao || "");
    setPreco(String(produto.preco).replace(".", ","));
    setQuantidade(String(produto.quantidade_estoque));
    setDisponivel(produto.disponivel);
    setMostrarFormulario(true);
  }

  async function salvarProduto() {
    const valor = Number(preco.replace(",", "."));
    const estoque = Number(quantidade);

    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe o nome do medicamento.");
      return;
    }

    if (!preco.trim() || !Number.isFinite(valor) || valor < 0) {
      Alert.alert("Atenção", "Informe um preço válido.");
      return;
    }

    if (
      !quantidade.trim() ||
      !Number.isInteger(estoque) ||
      estoque < 0
    ) {
      Alert.alert("Atenção", "Informe uma quantidade válida.");
      return;
    }

    const dados: DadosProdutoFarmacia = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      preco: valor.toFixed(2),
      quantidade_estoque: estoque,
      disponivel,
    };

    try {
      setSalvando(true);

      if (editandoId !== null) {
        await atualizarProdutoFarmacia(editandoId, dados);
      } else {
        await adicionarProdutoFarmacia(dados);
      }

      limparFormulario();
      await carregarDados();

      Alert.alert(
        "Sucesso",
        editandoId !== null
          ? "Medicamento atualizado!"
          : "Medicamento cadastrado!"
      );
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro.message || "Não foi possível salvar."
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(produto: ProdutoFarmacia) {
    Alert.alert(
      "Excluir medicamento",
      `Deseja excluir ${produto.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await excluirProdutoFarmacia(produto.id);
              await carregarDados();
              Alert.alert("Sucesso", "Medicamento excluído.");
            } catch (erro: any) {
              Alert.alert("Erro", erro.message);
            }
          },
        },
      ]
    );
  }

  const totalProdutos = produtos.length;

  const estoqueTotal = produtos.reduce(
    (total, produto) => total + produto.quantidade_estoque,
    0
  );

  const estoqueBaixo = produtos.filter(
    (produto) => produto.quantidade_estoque <= 5
  ).length;

  if (carregando) {
    return (
      <SafeAreaView style={styles.centralizado}>
        <ActivityIndicator size="large" color={ROXO} />
        <Text style={styles.textoSecundario}>
          Carregando painel...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={carregarDados}
          />
        }
      >
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.replace("/farmacias")}
        >
          <Ionicons name="arrow-back" size={22} color={AZUL} />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <View style={styles.iconeCabecalho}>
            <Ionicons name="medkit" size={30} color="#FFFFFF" />
          </View>

          <Text style={styles.titulo}>Painel da Farmácia</Text>

          <Text style={styles.subtitulo}>
            {farmacia?.nome || "Farmácia Parceira"}
          </Text>

          <View style={styles.selo}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#147D50"
            />
            <Text style={styles.seloTexto}>
              Farmácia autorizada
            </Text>
          </View>
        </View>

        <View style={styles.resumo}>
          <View style={styles.cardResumo}>
            <Ionicons name="medical" size={25} color={ROXO} />
            <Text style={styles.numeroResumo}>{totalProdutos}</Text>
            <Text style={styles.rotuloResumo}>Produtos</Text>
          </View>

          <View style={styles.cardResumo}>
            <Ionicons name="cube" size={25} color="#178F81" />
            <Text style={styles.numeroResumo}>{estoqueTotal}</Text>
            <Text style={styles.rotuloResumo}>Em estoque</Text>
          </View>

          <View style={styles.cardResumo}>
            <Ionicons name="alert-circle" size={25} color="#D78920" />
            <Text style={styles.numeroResumo}>{estoqueBaixo}</Text>
            <Text style={styles.rotuloResumo}>Estoque baixo</Text>
          </View>
        </View>

        <View style={styles.secaoTitulo}>
          <Text style={styles.tituloSecao}>Medicamentos</Text>

          <TouchableOpacity
            style={styles.botaoAdicionar}
            onPress={() => {
              limparFormulario();
              setMostrarFormulario(true);
            }}
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text style={styles.botaoAdicionarTexto}>Novo</Text>
          </TouchableOpacity>
        </View>

        {mostrarFormulario && (
          <View style={styles.formulario}>
            <Text style={styles.tituloFormulario}>
              {editandoId !== null
                ? "Editar medicamento"
                : "Cadastrar medicamento"}
            </Text>

            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Paracetamol 500 mg"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.inputMaior]}
              placeholder="Informações sobre o produto"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />

            <Text style={styles.label}>Preço (R$) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: 12,90"
              value={preco}
              onChangeText={setPreco}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Quantidade em estoque *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: 30"
              value={quantidade}
              onChangeText={setQuantidade}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={styles.opcaoDisponivel}
              onPress={() => setDisponivel(!disponivel)}
            >
              <Ionicons
                name={disponivel ? "checkbox" : "square-outline"}
                size={24}
                color={ROXO}
              />
              <Text>Produto disponível para venda</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSalvar}
              onPress={salvarProduto}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botaoSalvarTexto}>
                  {editandoId !== null
                    ? "Salvar alterações"
                    : "Cadastrar medicamento"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={limparFormulario}
            >
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {produtos.length === 0 ? (
          <View style={styles.vazio}>
            <Ionicons
              name="file-tray-outline"
              size={42}
              color="#9AA6B8"
            />
            <Text style={styles.vazioTitulo}>
              Nenhum medicamento cadastrado
            </Text>
            <Text style={styles.textoSecundario}>
              Toque em Novo para cadastrar seu primeiro produto.
            </Text>
          </View>
        ) : (
          produtos.map((produto) => (
            <View key={produto.id} style={styles.cardProduto}>
              <View style={styles.produtoTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nomeProduto}>
                    {produto.nome}
                  </Text>

                  {!!produto.descricao && (
                    <Text style={styles.descricaoProduto}>
                      {produto.descricao}
                    </Text>
                  )}
                </View>

                <Ionicons
                  name="medkit-outline"
                  size={26}
                  color={ROXO}
                />
              </View>

              <Text style={styles.precoProduto}>
                R$ {Number(produto.preco).toFixed(2).replace(".", ",")}
              </Text>

              <Text style={styles.estoqueProduto}>
                Estoque: {produto.quantidade_estoque} unidades
              </Text>

              <Text
                style={{
                  color: produto.disponivel ? "#147D50" : "#C44B4B",
                  marginTop: 5,
                }}
              >
                {produto.disponivel ? "Disponível" : "Indisponível"}
              </Text>

              <View style={styles.acoes}>
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => editarProduto(produto)}
                >
                  <Ionicons name="create-outline" size={18} color={ROXO} />
                  <Text style={styles.editarTexto}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => confirmarExclusao(produto)}
                >
                  <Ionicons name="trash-outline" size={18} color="#C44B4B" />
                  <Text style={styles.excluirTexto}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },
  centralizado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8FC",
    gap: 12,
  },
  conteudo: {
    padding: 22,
    paddingBottom: 55,
  },
  voltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  voltarTexto: {
    color: AZUL,
    fontWeight: "600",
    fontSize: 16,
  },
  cabecalho: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconeCabecalho: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: ROXO,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  titulo: {
    fontSize: 27,
    fontWeight: "800",
    color: AZUL,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 17,
    color: "#65758B",
    marginTop: 7,
  },
  selo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F7EE",
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 13,
    gap: 6,
  },
  seloTexto: {
    color: "#147D50",
    fontWeight: "700",
  },
  resumo: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 28,
  },
  cardResumo: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 5,
    borderRadius: 17,
    alignItems: "center",
    elevation: 2,
  },
  numeroResumo: {
    fontSize: 24,
    fontWeight: "800",
    color: AZUL,
    marginTop: 7,
  },
  rotuloResumo: {
    fontSize: 11,
    color: "#65758B",
    marginTop: 4,
    textAlign: "center",
  },
  secaoTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  tituloSecao: {
    fontSize: 21,
    fontWeight: "800",
    color: AZUL,
  },
  botaoAdicionar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ROXO,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 5,
  },
  botaoAdicionarTexto: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  formulario: {
    backgroundColor: "#FFFFFF",
    padding: 19,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 2,
  },
  tituloFormulario: {
    fontSize: 20,
    fontWeight: "800",
    color: AZUL,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: AZUL,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE3ED",
    backgroundColor: "#FAFBFE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: AZUL,
  },
  inputMaior: {
    minHeight: 75,
    textAlignVertical: "top",
  },
  opcaoDisponivel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 20,
  },
  botaoSalvar: {
    backgroundColor: ROXO,
    padding: 16,
    borderRadius: 13,
    alignItems: "center",
  },
  botaoSalvarTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  botaoCancelar: {
    alignItems: "center",
    padding: 15,
  },
  cancelarTexto: {
    color: "#65758B",
    fontWeight: "700",
  },
  vazio: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    gap: 9,
  },
  vazioTitulo: {
    color: AZUL,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  textoSecundario: {
    color: "#65758B",
    textAlign: "center",
    lineHeight: 22,
  },
  cardProduto: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 13,
    elevation: 2,
  },
  produtoTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  nomeProduto: {
    fontSize: 17,
    fontWeight: "800",
    color: AZUL,
  },
  descricaoProduto: {
    color: "#65758B",
    marginTop: 5,
  },
  precoProduto: {
    fontSize: 22,
    fontWeight: "800",
    color: ROXO,
    marginTop: 12,
  },
  estoqueProduto: {
    color: "#65758B",
    marginTop: 5,
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  botaoEditar: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    padding: 12,
    borderRadius: 11,
    backgroundColor: "#F0EAFE",
  },
  editarTexto: {
    color: ROXO,
    fontWeight: "700",
  },
  botaoExcluir: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    padding: 12,
    borderRadius: 11,
    backgroundColor: "#FFF0F0",
  },
  excluirTexto: {
    color: "#C44B4B",
    fontWeight: "700",
  },
});
