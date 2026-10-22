
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import {
  atualizarMeuCuidador,
  buscarMeuCuidador,
} from "../services/cuidadoresService";

import {
  listarPacientesVinculados,
  vincularPaciente,
  desvincularPaciente,
  type VinculoPaciente,
} from "../services/vinculosService";

const PREFIXO_BRASIL = "55";

function telefoneLocal(valor: string): string {
  let numeros = String(valor || "").replace(/\D/g, "");

  if (numeros.length > 11 && numeros.startsWith("55")) {
    numeros = numeros.slice(2);
  }

  return numeros.slice(0, 11);
}

function telefoneParaApi(valor: string): string {
  return PREFIXO_BRASIL + telefoneLocal(valor);
}

const CORES = {
  fundo: "#F8FBFF",
  azul: "#2563EB",
  azulEscuro: "#0F2557",
  verde: "#16A34A",
  vermelho: "#DC2626",
  texto: "#64748B",
  branco: "#FFFFFF",
};

export default function FamiliaScreen() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [vinculos, setVinculos] = useState<VinculoPaciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [desvinculandoId, setDesvinculandoId] =
    useState<number | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [cuidador, lista] = await Promise.all([
        buscarMeuCuidador(),
        listarPacientesVinculados(),
      ]);

      setNome(cuidador.nome || "");
      setTelefone(telefoneLocal(cuidador.telefone || ""));
      setVinculos(lista);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar os dados."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  async function salvar() {
    if (!nome.trim() || !telefone.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o nome e o telefone do familiar."
      );
      return;
    }

    const numeroLocal = telefoneLocal(telefone);

    if (!/^[1-9][0-9]9[0-9]{8}$/.test(numeroLocal)) {
      Alert.alert(
        "Telefone inválido",
        "Informe um celular brasileiro válido com DDD e 9 dígitos.\n\nExemplo: 81999999999"
      );
      return;
    }

    try {
      setSalvando(true);

      const atualizado = await atualizarMeuCuidador(
        nome.trim(),
        telefoneParaApi(numeroLocal)
      );

      setNome(atualizado.nome || "");
      setTelefone(
        telefoneLocal(atualizado.telefone || numeroLocal)
      );

      Alert.alert(
        "Sucesso 💚",
        "Dados do familiar atualizados!"
      );
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error
          ? e.message
          : "Não foi possível salvar."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarVinculo() {
    const codigoLimpo = codigo.trim().toUpperCase();

    if (!/^[A-F0-9]{16}$/.test(codigoLimpo)) {
      Alert.alert(
        "Código inválido",
        "Informe o código de 16 caracteres gerado pelo idoso."
      );
      return;
    }

    try {
      setVinculando(true);

      await vincularPaciente(codigoLimpo);

      const lista = await listarPacientesVinculados();
      setVinculos(lista);
      setCodigo("");

      Alert.alert(
        "Vínculo realizado! 💚",
        "O familiar foi vinculado ao idoso com sucesso!\n\n" +
          "O vínculo permanecerá ativo mesmo depois " +
          "que o código expirar."
      );
    } catch (e) {
      Alert.alert(
        "Erro no vínculo",
        e instanceof Error
          ? e.message
          : "Verifique o código e tente novamente."
      );
    } finally {
      setVinculando(false);
    }
  }

  function pacienteNome(v: VinculoPaciente): string {
    const nomePaciente = (v.paciente_nome || "").trim();

    if (
      nomePaciente &&
      nomePaciente.toLowerCase() !== "paciente" &&
      nomePaciente.toLowerCase() !== "paciente não informado"
    ) {
      return nomePaciente;
    }

    return `Idoso #${v.paciente}`;
  }

  function confirmarDesvinculo(v: VinculoPaciente) {
    Alert.alert(
      "Excluir vínculo",
      `Deseja realmente desvincular ${pacienteNome(v)}?\n\n` +
        "O cadastro e os medicamentos do idoso não serão apagados.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Desvincular",
          style: "destructive",
          onPress: () => void executarDesvinculo(v.id),
        },
      ]
    );
  }

  async function executarDesvinculo(vinculoId: number) {
    if (desvinculandoId !== null) {
      return;
    }

    try {
      setDesvinculandoId(vinculoId);

      await desvincularPaciente(vinculoId);

      setVinculos((listaAtual) =>
        listaAtual.filter((v) => v.id !== vinculoId)
      );

      Alert.alert(
        "Vínculo removido 💚",
        "O idoso foi desvinculado com sucesso."
      );
    } catch (e) {
      Alert.alert(
        "Erro ao desvincular",
        e instanceof Error
          ? e.message
          : "Não foi possível remover o vínculo."
      );
    } finally {
      setDesvinculandoId(null);
    }
  }

  function abrirMedicamentos(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar o idoso."
      );
      return;
    }

    router.push({
      pathname: "/medicamentos",
      params: {
        perfil: "familiar",
        pacienteId: String(id),
      },
    });
  }

  const vinculosAtivos = vinculos.filter(
    (v) => v.ativo !== false
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={CORES.azul}
            />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>
            Área da família 💚
          </Text>

          <Text style={styles.subtitulo}>
            Cuide de quem você ama, acompanhe medicamentos
            e mantenha seus dados atualizados.
          </Text>

          <View style={styles.hero}>
            <MaterialCommunityIcons
              name="account-heart"
              size={43}
              color={CORES.verde}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitulo}>
                Cuidando de quem você ama
              </Text>
              <Text style={styles.texto}>
                Compartilhe a rotina de medicamentos
                com segurança.
              </Text>
            </View>
          </View>

          {carregando ? (
            <ActivityIndicator
              size="large"
              color={CORES.verde}
              style={{ marginVertical: 28 }}
            />
          ) : (
            <>
              {!!erro && (
                <View style={styles.aviso}>
                  <Text style={styles.avisoTexto}>
                    {erro}
                  </Text>

                  <TouchableOpacity
                    onPress={() => void carregar()}
                  >
                    <Text style={styles.link}>
                      Tentar novamente
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.secao}>
                Familiar responsável
              </Text>

              <View style={styles.card}>
                <Text style={styles.label}>Nome</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Nome do familiar"
                  placeholderTextColor="#94A3B8"
                  value={nome}
                  onChangeText={setNome}
                />

                <Text style={styles.label}>
                  Telefone / WhatsApp
                </Text>

                <View style={styles.telefoneLinha}>
                  <View style={styles.prefixoContainer}>
                    <Text style={styles.prefixoTexto}>
                      🇧🇷 +55
                    </Text>
                  </View>

                  <TextInput
                    style={styles.telefoneInput}
                    placeholder="(81) 99999-9999"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={telefone}
                    onChangeText={(valor) =>
                      setTelefone(telefoneLocal(valor))
                    }
                    maxLength={11}
                  />
                </View>

                <Text style={styles.ajuda}>
                  O código +55 já está incluído.
                  Digite apenas o DDD e o celular.
                  Este número poderá receber alertas.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.botaoVerde,
                    salvando && styles.desabilitado,
                  ]}
                  disabled={salvando}
                  onPress={salvar}
                >
                  {salvando ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.botaoTexto}>
                      SALVAR FAMILIAR
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.secao}>
                Vincular um idoso
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardTitulo}>
                  🔗 Código de vinculação
                </Text>

                <Text style={styles.texto}>
                  Peça ao idoso o código gerado
                  na conta dele.
                  {"\n\n"}
                  O código é de uso único e vale
                  por 10 minutos.
                  {"\n\n"}
                  Após utilizar o código com sucesso,
                  o vínculo permanecerá ativo,
                  sem precisar gerar outro código.
                </Text>

                <TextInput
                  style={[styles.input, { marginTop: 15 }]}
                  placeholder="Código de 16 caracteres"
                  placeholderTextColor="#94A3B8"
                  value={codigo}
                  onChangeText={(texto) =>
                    setCodigo(
                      texto
                        .toUpperCase()
                        .replace(/[^A-F0-9]/g, "")
                        .slice(0, 16)
                    )
                  }
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={16}
                />

                <TouchableOpacity
                  style={[
                    styles.botaoAzul,
                    vinculando && styles.desabilitado,
                  ]}
                  disabled={vinculando}
                  onPress={confirmarVinculo}
                >
                  {vinculando ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.botaoTexto}>
                      VINCULAR IDOSO
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.secao}>
                Idosos vinculados
              </Text>

              {vinculosAtivos.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.texto}>
                    Nenhum idoso vinculado ainda.
                    Informe o código acima para começar.
                  </Text>
                </View>
              ) : (
                vinculosAtivos.map((v) => (
                  <View
                    key={v.id}
                    style={styles.pacienteCard}
                  >
                    <View style={styles.pacienteLinha}>
                      <Ionicons
                        name="person-circle-outline"
                        size={35}
                        color={CORES.verde}
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={styles.pacienteNome}>
                          {pacienteNome(v)}
                        </Text>

                        <Text style={styles.statusVinculo}>
                          ● Vínculo ativo
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.botaoAzul}
                      onPress={() =>
                        abrirMedicamentos(v.paciente)
                      }
                    >
                      <Text style={styles.botaoTexto}>
                        💊 VER MEDICAMENTOS
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.botaoExcluir,
                        desvinculandoId === v.id &&
                          styles.desabilitado,
                      ]}
                      disabled={desvinculandoId !== null}
                      onPress={() => confirmarDesvinculo(v)}
                    >
                      {desvinculandoId === v.id ? (
                        <ActivityIndicator
                          color={CORES.vermelho}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={CORES.vermelho}
                          />

                          <Text style={styles.botaoExcluirTexto}>
                            EXCLUIR VÍNCULO
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <Text style={styles.secao}>
                Acompanhamento
              </Text>

              <TouchableOpacity
                style={styles.opcao}
                onPress={() => router.push("/rotina")}
              >
                <Ionicons
                  name="calendar-outline"
                  size={30}
                  color={CORES.azul}
                />

                <View style={styles.opcaoConteudo}>
                  <Text style={styles.cardTitulo}>
                    Rotina de hoje
                  </Text>

                  <Text style={styles.texto}>
                    Veja horários e confirmações
                    dos medicamentos.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color={CORES.azul}
                />
              </TouchableOpacity>

              {/* CARTÃO ALERTAS REMOVIDO */}

              <Text style={styles.secao}>
                Farmácias e medicamentos
              </Text>

              <Text style={styles.textoSecao}>
                Encontre farmácias parceiras,
                consulte medicamentos e acompanhe
                a reposição.
              </Text>

              <TouchableOpacity
                style={styles.opcao}
                onPress={() =>
                  router.push("/farmacias-busca")
                }
              >
                <Ionicons
                  name="search-outline"
                  size={31}
                  color={CORES.azul}
                />

                <View style={styles.opcaoConteudo}>
                  <Text style={styles.cardTitulo}>
                    Encontrar farmácias
                  </Text>

                  <Text style={styles.texto}>
                    Pesquise medicamentos e compare preços.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color={CORES.azul}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.opcao}
                onPress={() =>
                  router.push("/farmacias-mapa")
                }
              >
                <Ionicons
                  name="map-outline"
                  size={31}
                  color="#7C3AED"
                />

                <View style={styles.opcaoConteudo}>
                  <Text style={styles.cardTitulo}>
                    Ver farmácias no mapa
                  </Text>

                  <Text style={styles.texto}>
                    Localize farmácias parceiras.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color="#7C3AED"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.opcao}
                onPress={() =>
                  router.push("/farmacias-reposicao")
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={31}
                  color="#D97706"
                />

                <View style={styles.opcaoConteudo}>
                  <Text style={styles.cardTitulo}>
                    Reposição de medicamentos
                  </Text>

                  <Text style={styles.texto}>
                    Acompanhe estoque e solicitações.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color="#D97706"
                />
              </TouchableOpacity>

              <View style={styles.rodape}>
                <Text style={styles.rodapeTexto}>
                  🛡️ Cuidado e segurança 💚
                  {"\n"}
                  Sempre por perto
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },

  voltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  voltarTexto: {
    color: CORES.azul,
    fontSize: 16,
    fontWeight: "800",
  },

  titulo: {
    color: CORES.azulEscuro,
    fontSize: 31,
    fontWeight: "900",
  },

  subtitulo: {
    color: CORES.texto,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 18,
  },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#E8F9EE",
    borderRadius: 24,
    padding: 19,
    marginBottom: 24,
  },

  heroTitulo: {
    color: CORES.azulEscuro,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 5,
  },

  secao: {
    color: CORES.azulEscuro,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 12,
  },

  card: {
    backgroundColor: CORES.branco,
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    elevation: 2,
  },

  cardTitulo: {
    color: CORES.azulEscuro,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },

  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    minHeight: 55,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 15,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
    color: "#0F172A",
  },

  telefoneLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  prefixoContainer: {
    minHeight: 55,
    paddingHorizontal: 12,
    backgroundColor: "#E8F9EE",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  prefixoTexto: {
    fontSize: 16,
    fontWeight: "900",
    color: CORES.azulEscuro,
  },

  telefoneInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 55,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 15,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#0F172A",
  },

  texto: {
    color: CORES.texto,
    fontSize: 14,
    lineHeight: 20,
  },

  textoSecao: {
    color: CORES.texto,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },

  ajuda: {
    color: CORES.texto,
    fontSize: 12,
    marginVertical: 8,
  },

  botaoVerde: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: CORES.verde,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  botaoAzul: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: CORES.azul,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  botaoTexto: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: "900",
  },

  botaoExcluir: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORES.vermelho,
    backgroundColor: "#FFF7F7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },

  botaoExcluirTexto: {
    color: CORES.vermelho,
    fontSize: 15,
    fontWeight: "900",
  },

  desabilitado: {
    opacity: 0.6,
  },

  aviso: {
    backgroundColor: "#FFF1F2",
    padding: 15,
    borderRadius: 14,
    marginBottom: 16,
  },

  avisoTexto: {
    color: "#BE123C",
    fontSize: 14,
  },

  link: {
    color: CORES.azul,
    fontWeight: "800",
    marginTop: 8,
  },

  pacienteCard: {
    backgroundColor: CORES.branco,
    borderRadius: 20,
    padding: 17,
    marginBottom: 13,
    elevation: 2,
  },

  pacienteLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  pacienteNome: {
    color: CORES.azulEscuro,
    fontSize: 18,
    fontWeight: "800",
  },

  statusVinculo: {
    color: CORES.verde,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },

  opcao: {
    backgroundColor: CORES.branco,
    borderRadius: 20,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    elevation: 2,
  },

  opcaoConteudo: {
    flex: 1,
    paddingHorizontal: 12,
  },

  rodape: {
    backgroundColor: "#EAF9F0",
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
  },

  rodapeTexto: {
    textAlign: "center",
    color: "#166534",
    fontSize: 13,
    fontWeight: "800",
  },
});
