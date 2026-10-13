
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
  type VinculoPaciente,
} from "../services/vinculosService";

export default function FamiliaScreen() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [vinculos, setVinculos] = useState<VinculoPaciente[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [erro, setErro] = useState("");

  // ========================================
  // CARREGAR DADOS
  // ========================================

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [cuidador, lista] = await Promise.all([
        buscarMeuCuidador(),
        listarPacientesVinculados(),
      ]);

      setNome(cuidador.nome || "");
      setTelefone(cuidador.telefone || "");
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

  // ========================================
  // SALVAR FAMILIAR
  // ========================================

  async function salvar() {
    if (!nome.trim() || !telefone.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o nome e o telefone do familiar."
      );
      return;
    }

    try {
      setSalvando(true);

      const atualizado = await atualizarMeuCuidador(
        nome.trim(),
        telefone.trim()
      );

      setNome(atualizado.nome || "");
      setTelefone(atualizado.telefone || "");

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

  // ========================================
  // VINCULAR IDOSO
  // ========================================

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
        "Agora você pode acompanhar os medicamentos do idoso."
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

  // ========================================
  // IDENTIFICAR IDOSO
  // CORRIGIDO PARA O SERIALIZER DJANGO
  // ========================================

  function pacienteId(v: VinculoPaciente): number {
    return v.paciente;
  }

  function pacienteNome(v: VinculoPaciente): string {
    return v.paciente_nome || `Paciente #${v.paciente}`;
  }

  // ========================================
  // ABRIR MEDICAMENTOS
  // ========================================

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

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* VOLTAR */}

          <TouchableOpacity
            style={styles.voltar}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#2563EB"
            />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </TouchableOpacity>

          {/* CABEÇALHO */}

          <Text style={styles.titulo}>Área da família 💚</Text>

          <Text style={styles.subtitulo}>
            Cuide de quem você ama, acompanhe medicamentos
            e mantenha seus dados atualizados.
          </Text>

          {/* DESTAQUE */}

          <View style={styles.hero}>
            <MaterialCommunityIcons
              name="account-heart"
              size={43}
              color="#16A34A"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitulo}>
                Cuidando de quem você ama
              </Text>
              <Text style={styles.texto}>
                Compartilhe a rotina de medicamentos com segurança.
              </Text>
            </View>
          </View>

          {carregando ? (
            <ActivityIndicator
              size="large"
              color="#16A34A"
              style={{ marginVertical: 28 }}
            />
          ) : (
            <>
              {/* ERRO */}

              {!!erro && (
                <View style={styles.aviso}>
                  <Text style={styles.avisoTexto}>{erro}</Text>
                  <TouchableOpacity onPress={() => void carregar()}>
                    <Text style={styles.link}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* FAMILIAR */}

              <Text style={styles.secao}>Familiar responsável</Text>

              <View style={styles.card}>
                <Text style={styles.label}>Nome</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Nome do familiar"
                  placeholderTextColor="#94A3B8"
                  value={nome}
                  onChangeText={setNome}
                />

                <Text style={styles.label}>Telefone / WhatsApp</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex.: 81999999999"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={telefone}
                  onChangeText={setTelefone}
                />

                <Text style={styles.ajuda}>
                  Este número poderá ser utilizado futuramente
                  para receber alertas.
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

              {/* CÓDIGO DE VINCULAÇÃO */}

              <Text style={styles.secao}>Vincular um idoso</Text>

              <View style={styles.card}>
                <Text style={styles.cardTitulo}>
                  🔗 Código de vinculação
                </Text>

                <Text style={styles.texto}>
                  Peça ao idoso o código gerado na conta dele.
                  O código é de uso único e vale por 10 minutos.
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

              {/* IDOSOS VINCULADOS */}

              <Text style={styles.secao}>Idosos vinculados</Text>

              {vinculos.filter((v) => v.ativo !== false).length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.texto}>
                    Nenhum idoso vinculado ainda.
                    Informe o código acima para começar.
                  </Text>
                </View>
              ) : (
                vinculos
                  .filter((v) => v.ativo !== false)
                  .map((v) => (
                    <View
                      key={v.id}
                      style={styles.pacienteCard}
                    >
                      <View style={styles.pacienteLinha}>
                        <Ionicons
                          name="person-circle-outline"
                          size={35}
                          color="#16A34A"
                        />

                        <Text style={styles.pacienteNome}>
                          {pacienteNome(v)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.botaoAzul}
                        onPress={() =>
                          abrirMedicamentos(pacienteId(v))
                        }
                      >
                        <Text style={styles.botaoTexto}>
                          💊 VER MEDICAMENTOS
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
              )}

              {/* ACOMPANHAMENTO */}

              <Text style={styles.secao}>Acompanhamento</Text>

              <TouchableOpacity
                style={styles.opcao}
                onPress={() => router.push("/rotina")}
              >
                <Ionicons
                  name="calendar-outline"
                  size={30}
                  color="#2563EB"
                />

                <View style={styles.opcaoConteudo}>
                  <Text style={styles.cardTitulo}>
                    Rotina de hoje
                  </Text>
                  <Text style={styles.texto}>
                    Veja horários e confirmações dos medicamentos.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color="#2563EB"
                />
              </TouchableOpacity>

              {/* ALERTAS */}

              <View style={styles.opcao}>
                <Ionicons
                  name="notifications-outline"
                  size={30}
                  color="#D97706"
                />

                <View style={styles.opcaoConteudo}>
                  <Text style={styles.cardTitulo}>Alertas</Text>
                  <Text style={styles.texto}>
                    Avisos automáticos ainda dependem da
                    configuração do serviço.
                  </Text>
                </View>
              </View>

              {/* FARMÁCIAS */}

              <Text style={styles.secao}>
                Farmácias e medicamentos
              </Text>

              <Text style={styles.textoSecao}>
                Encontre farmácias parceiras, consulte
                medicamentos e acompanhe a reposição.
              </Text>

              <TouchableOpacity
                style={styles.opcao}
                onPress={() => router.push("/farmacias-busca")}
              >
                <Ionicons
                  name="search-outline"
                  size={31}
                  color="#2563EB"
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
                  color="#2563EB"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.opcao}
                onPress={() => router.push("/farmacias-mapa")}
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
                onPress={() => router.push("/farmacias-reposicao")}
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

              {/* RODAPÉ */}

              <View style={styles.rodape}>
                <Text style={styles.rodapeTexto}>
                  🛡️ Cuidado e segurança   💚 Sempre por perto
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ========================================
// ESTILOS
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
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
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
  },

  titulo: {
    color: "#0F2557",
    fontSize: 31,
    fontWeight: "900",
  },

  subtitulo: {
    color: "#64748B",
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
    color: "#0F2557",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 5,
  },

  secao: {
    color: "#0F2557",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    elevation: 2,
  },

  cardTitulo: {
    color: "#0F2557",
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

  texto: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },

  textoSecao: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },

  ajuda: {
    color: "#64748B",
    fontSize: 12,
    marginVertical: 8,
  },

  botaoVerde: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  botaoAzul: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  botaoTexto: {
    color: "#FFF",
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
    color: "#2563EB",
    fontWeight: "800",
    marginTop: 8,
  },

  pacienteCard: {
    backgroundColor: "#FFF",
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
    color: "#0F2557",
    fontSize: 18,
    fontWeight: "800",
  },

  opcao: {
    backgroundColor: "#FFF",
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
