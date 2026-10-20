
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  buscarCatalogoFarmacias,
  type ProdutoCatalogo,
} from "../services/farmaciasService";

const AZUL = "#142B5B";
const ROXO = "#673AB7";
const VERDE = "#16A34A";

type ProdutoComContato = ProdutoCatalogo & {
  farmacia_endereco?: string | null;
  farmacia_telefone?: string | null;
  farmacia_whatsapp?: string | null;
  farmacia_horario_funcionamento?: string | null;
  farmacia_taxa_entrega?: string | number | null;
};

export default function FarmaciasBusca() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<ProdutoComContato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarProdutos(
    termo: string = "",
    atualizar: boolean = false
  ) {
    try {
      if (atualizar) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro("");

      const resultado = await buscarCatalogoFarmacias(termo);

      setProdutos(resultado);
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível consultar os medicamentos.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  function formatarPreco(valor: string | number | null | undefined) {
    const numero = Number(valor ?? 0);

    return `R$ ${numero.toFixed(2).replace(".", ",")}`;
  }

  async function ligarFarmacia(produto: ProdutoComContato) {
    const telefone = String(
      produto.farmacia_telefone || ""
    ).replace(/\D/g, "");

    if (!telefone) {
      Alert.alert(
        "Telefone indisponível",
        "Esta farmácia ainda não cadastrou um telefone para contato."
      );
      return;
    }

    const url = `tel:${telefone}`;

    try {
      const podeAbrir = await Linking.canOpenURL(url);

      if (!podeAbrir) {
        Alert.alert(
          "Ligação indisponível",
          "Este dispositivo não consegue abrir o aplicativo de telefone."
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível abrir o telefone."
      );
    }
  }

  function mostrarDetalhes(produto: ProdutoComContato) {
    const endereco = produto.farmacia_endereco
      ? `${produto.farmacia_endereco}, ${produto.farmacia_cidade} - ${produto.farmacia_estado}`
      : `${produto.farmacia_cidade} - ${produto.farmacia_estado}`;

    const telefone =
      produto.farmacia_telefone || "Não informado";

    const horario =
      produto.farmacia_horario_funcionamento ||
      "Não informado";

    const entrega = produto.farmacia_faz_entrega
      ? "Sim"
      : "Não";

    const taxa =
      produto.farmacia_faz_entrega &&
      produto.farmacia_taxa_entrega != null
        ? `\nTaxa de entrega: ${formatarPreco(
            produto.farmacia_taxa_entrega
          )}`
        : "";

    Alert.alert(
      produto.nome,
      `Farmácia: ${produto.farmacia_nome}\n` +
        `Preço: ${formatarPreco(produto.preco)}\n` +
        `Estoque: ${produto.quantidade_estoque} unidades\n` +
        `Endereço: ${endereco}\n` +
        `Telefone: ${telefone}\n` +
        `Funcionamento: ${horario}\n` +
        `Entrega: ${entrega}${taxa}\n\n` +
        "Entre em contato diretamente com a farmácia para confirmar a disponibilidade e combinar a compra.",
      [
        { text: "Fechar", style: "cancel" },
        {
          text: "Ligar",
          onPress: () => ligarFarmacia(produto),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarProdutos(busca, true)}
            colors={[ROXO]}
          />
        }
      >
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={AZUL}
          />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <View style={styles.icone}>
            <Ionicons
              name="search"
              size={31}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.titulo}>
            Buscar medicamentos
          </Text>

          <Text style={styles.subtitulo}>
            Consulte preços, estoques e telefones das
            farmácias parceiras.
          </Text>
        </View>

        <View style={styles.pesquisa}>
          <Ionicons
            name="search-outline"
            size={22}
            color="#8792A4"
          />

          <TextInput
            style={styles.input}
            placeholder="Ex.: Paracetamol"
            placeholderTextColor="#8792A4"
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
            onSubmitEditing={() => carregarProdutos(busca)}
          />

          {busca.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setBusca("");
                carregarProdutos("");
              }}
            >
              <Ionicons
                name="close-circle"
                size={22}
                color="#8792A4"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => carregarProdutos(busca)}
          >
            <Ionicons
              name="arrow-forward-circle"
              size={29}
              color={ROXO}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.tituloSecao}>
          Medicamentos disponíveis
        </Text>

        {carregando ? (
          <View style={styles.centralizado}>
            <ActivityIndicator
              size="large"
              color={ROXO}
            />
            <Text style={styles.secundario}>
              Buscando medicamentos...
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.vazio}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color="#C44B4B"
            />

            <Text style={styles.secundario}>
              {erro}
            </Text>

            <TouchableOpacity
              style={styles.botao}
              onPress={() => carregarProdutos(busca)}
            >
              <Text style={styles.botaoTexto}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : produtos.length === 0 ? (
          <View style={styles.vazio}>
            <Ionicons
              name="medical-outline"
              size={45}
              color="#9AA6B8"
            />

            <Text style={styles.vazioTitulo}>
              Nenhum medicamento encontrado
            </Text>

            <Text style={styles.secundario}>
              Tente pesquisar outro nome.
            </Text>
          </View>
        ) : (
          produtos.map((produto) => (
            <View
              key={produto.id}
              style={styles.card}
            >
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>
                    {produto.nome}
                  </Text>

                  <Text style={styles.farmacia}>
                    {produto.farmacia_nome}
                  </Text>
                </View>

                <Ionicons
                  name="medkit-outline"
                  size={29}
                  color={ROXO}
                />
              </View>

              {!!produto.descricao && (
                <Text style={styles.descricao}>
                  {produto.descricao}
                </Text>
              )}

              <Text style={styles.preco}>
                {formatarPreco(produto.preco)}
              </Text>

              <View style={styles.info}>
                <Ionicons
                  name="location-outline"
                  size={17}
                  color="#65758B"
                />

                <Text style={styles.infoTexto}>
                  {produto.farmacia_endereco
                    ? `${produto.farmacia_endereco}, `
                    : ""}
                  {produto.farmacia_cidade} -{" "}
                  {produto.farmacia_estado}
                </Text>
              </View>

              <View style={styles.info}>
                <Ionicons
                  name="cube-outline"
                  size={17}
                  color="#65758B"
                />

                <Text style={styles.infoTexto}>
                  {produto.quantidade_estoque} unidades
                  disponíveis
                </Text>
              </View>

              <View style={styles.info}>
                <Ionicons
                  name="bicycle-outline"
                  size={17}
                  color="#65758B"
                />

                <Text style={styles.infoTexto}>
                  {produto.farmacia_faz_entrega
                    ? "Farmácia realiza entregas"
                    : "Retirada na farmácia"}
                </Text>
              </View>

              <View style={styles.info}>
                <Ionicons
                  name="call-outline"
                  size={17}
                  color="#65758B"
                />

                <Text style={styles.infoTexto}>
                  {produto.farmacia_telefone ||
                    "Telefone não informado"}
                </Text>
              </View>

              {!!produto.farmacia_horario_funcionamento && (
                <View style={styles.info}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color="#65758B"
                  />

                  <Text style={styles.infoTexto}>
                    {produto.farmacia_horario_funcionamento}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.botaoDetalhes}
                onPress={() => mostrarDetalhes(produto)}
              >
                <Text style={styles.botaoDetalhesTexto}>
                  Ver detalhes
                </Text>

                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={ROXO}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoLigar}
                onPress={() => ligarFarmacia(produto)}
              >
                <Ionicons
                  name="call"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.botaoTexto}>
                  Ligar para a farmácia
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.aviso}>
          Os preços e estoques são informados pelas
          farmácias. Confirme os dados diretamente
          antes da compra.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  conteudo: {
    padding: 22,
    paddingBottom: 55,
  },

  voltar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 25,
  },

  voltarTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: AZUL,
  },

  cabecalho: {
    alignItems: "center",
    marginBottom: 28,
  },

  icone: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: ROXO,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "800",
    color: AZUL,
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 15,
    color: "#65758B",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 23,
  },

  pesquisa: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E7EF",
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 27,
    gap: 10,
  },

  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: AZUL,
  },

  tituloSecao: {
    fontSize: 20,
    fontWeight: "800",
    color: AZUL,
    marginBottom: 16,
  },

  centralizado: {
    padding: 35,
    alignItems: "center",
    gap: 12,
  },

  vazio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 28,
    alignItems: "center",
    gap: 13,
  },

  vazioTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: AZUL,
    textAlign: "center",
  },

  secundario: {
    color: "#65758B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 19,
    marginBottom: 15,
    elevation: 2,
  },

  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  nome: {
    fontSize: 19,
    fontWeight: "800",
    color: AZUL,
  },

  farmacia: {
    fontSize: 15,
    color: "#65758B",
    marginTop: 5,
  },

  descricao: {
    fontSize: 14,
    color: "#65758B",
    marginTop: 13,
  },

  preco: {
    fontSize: 25,
    fontWeight: "800",
    color: ROXO,
    marginTop: 17,
    marginBottom: 14,
  },

  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 9,
  },

  infoTexto: {
    flex: 1,
    color: "#65758B",
    fontSize: 14,
    lineHeight: 21,
  },

  botaoDetalhes: {
    backgroundColor: "#F2EBFC",
    borderRadius: 13,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  botaoDetalhesTexto: {
    color: ROXO,
    fontWeight: "800",
    fontSize: 15,
  },

  botaoLigar: {
    backgroundColor: VERDE,
    borderRadius: 13,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  botao: {
    backgroundColor: ROXO,
    borderRadius: 13,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  aviso: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 15,
  },
});
