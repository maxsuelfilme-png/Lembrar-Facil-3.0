import { useCallback, useState } from "react";

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

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import {
  atualizarMeuCuidador,
  buscarMeuCuidador,
} from "../services/cuidadoresService";

export default function FamiliaScreen() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  async function carregarCuidador() {
    try {
      const cuidador =
        await buscarMeuCuidador();

      setNome(cuidador.nome || "");
      setTelefone(cuidador.telefone || "");
    } catch (erro) {
      console.error(
        "Erro ao carregar familiar:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível carregar os dados do familiar."
      );
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarCuidador();
    }, [])
  );

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o nome do familiar."
      );

      return;
    }

    if (!telefone.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o telefone do familiar."
      );

      return;
    }

    try {
      setSalvando(true);

      const atualizado =
        await atualizarMeuCuidador(
          nome,
          telefone
        );

      setNome(atualizado.nome);

      setTelefone(
        atualizado.telefone || ""
      );

      Alert.alert(
        "Salvo com sucesso! 💚",
        "Os dados do familiar foram atualizados."
      );
    } catch (erro) {
      console.error(
        "Erro ao salvar familiar:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível salvar os dados."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={styles.carregandoContainer}
        >
          <View style={styles.loadingIcon}>
            <MaterialCommunityIcons
              name="account-group"
              size={42}
              color="#16A34A"
            />
          </View>

          <ActivityIndicator
            size="large"
            color="#16A34A"
          />

          <Text
            style={styles.carregandoTexto}
          >
            Carregando área da família...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color="#2563EB"
              />
            </TouchableOpacity>

            <View style={styles.topIcon}>
              <MaterialCommunityIcons
                name="account-group"
                size={27}
                color="#16A34A"
              />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>
              Área da família
            </Text>

            <Text style={styles.subtitle}>
              Acompanhe a rotina e mantenha
              os dados do familiar responsável
              atualizados.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="account-heart"
                size={44}
                color="#16A34A"
              />
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>
                FAMÍLIA
              </Text>

              <Text style={styles.heroTitle}>
                Cuidando de quem você ama
              </Text>

              <Text
                style={styles.heroDescription}
              >
                Acompanhe medicamentos,
                confirmações e alertas.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Familiar responsável
          </Text>

          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color="#2563EB"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Dados do familiar
                </Text>

                <Text
                  style={styles.cardSubtitle}
                >
                  Informe quem receberá os
                  alertas
                </Text>
              </View>
            </View>

            <Text style={styles.label}>
              Nome
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome do familiar"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Text style={styles.label}>
              Telefone / WhatsApp
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="logo-whatsapp"
                size={22}
                color="#16A34A"
              />

              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="Ex.: 81999999999"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color="#2563EB"
              />

              <Text style={styles.infoText}>
                Este telefone poderá ser
                utilizado para receber os
                alertas do LembraFácil.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.botaoSalvar,
                salvando &&
                  styles.botaoDesabilitado,
              ]}
              disabled={salvando}
              onPress={salvar}
              activeOpacity={0.85}
            >
              {salvando ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.botaoSalvarTexto
                    }
                  >
                    SALVAR FAMILIAR
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            Acompanhamento
          </Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              styles.rotinaCard,
            ]}
            activeOpacity={0.85}
            onPress={() =>
              router.push("/rotina")
            }
          >
            <View
              style={[
                styles.optionIcon,
                styles.rotinaIcon,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={29}
                color="#2563EB"
              />
            </View>

            <View style={styles.optionContent}>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />

                <Text style={styles.statusLabel}>
                  ACOMPANHAMENTO ATIVO
                </Text>
              </View>

              <Text style={styles.optionTitle}>
                Rotina de hoje
              </Text>

              <Text
                style={styles.optionDescription}
              >
                Veja horários e confirmações
                dos medicamentos.
              </Text>
            </View>

            <View style={styles.blueArrow}>
              <Ionicons
                name="chevron-forward"
                size={22}
                color="#2563EB"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              styles.medicamentoCard,
            ]}
            activeOpacity={0.85}
            onPress={() =>
              router.push("/medicamentos")
            }
          >
            <View
              style={[
                styles.optionIcon,
                styles.medicamentoIcon,
              ]}
            >
              <MaterialCommunityIcons
                name="pill"
                size={31}
                color="#E53935"
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Medicamentos
              </Text>

              <Text
                style={styles.optionDescription}
              >
                Consulte os medicamentos
                cadastrados no LembraFácil.
              </Text>
            </View>

            <View style={styles.redArrow}>
              <Ionicons
                name="chevron-forward"
                size={22}
                color="#E53935"
              />
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.optionCard,
              styles.alertaCard,
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                styles.alertaIcon,
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={29}
                color="#F59E0B"
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Alertas
              </Text>

              <Text
                style={styles.optionDescription}
              >
                O familiar poderá ser avisado
                quando houver um medicamento
                atrasado.
              </Text>
            </View>
          </View>

          <View style={styles.footerCard}>
            <View style={styles.footerItem}>
              <Ionicons
                name="shield-checkmark"
                size={21}
                color="#16A34A"
              />

              <Text style={styles.footerText}>
                Cuidado{"\n"}e segurança
              </Text>
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerItem}>
              <Ionicons
                name="notifications"
                size={21}
                color="#16A34A"
              />

              <Text style={styles.footerText}>
                Alertas{"\n"}importantes
              </Text>
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerItem}>
              <Ionicons
                name="heart"
                size={21}
                color="#16A34A"
              />

              <Text style={styles.footerText}>
                Sempre{"\n"}por perto
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  carregandoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  loadingIcon: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: "#E8F9EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  carregandoTexto: {
    marginTop: 15,
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 35,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  topIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#E8F9EE",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    marginBottom: 20,
  },

  title: {
    color: "#0F2557",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  subtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    marginTop: 6,
  },

  heroCard: {
    minHeight: 130,
    backgroundColor: "#E8F9EE",
    borderRadius: 25,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,

    borderWidth: 1,
    borderColor: "#D7F2E1",

    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#D3F3DF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  heroContent: {
    flex: 1,
  },

  heroLabel: {
    color: "#16A34A",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 3,
  },

  heroTitle: {
    color: "#0F2557",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
  },

  heroDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  sectionTitle: {
    color: "#0F2557",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 17,
    marginBottom: 25,

    borderWidth: 1,
    borderColor: "#E8EEF5",

    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 11,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  cardHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E4F1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  cardTitle: {
    color: "#0F2557",
    fontSize: 18,
    fontWeight: "900",
  },

  cardSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },

  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 6,
  },

  inputContainer: {
    minHeight: 57,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 14,
  },

  infoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },

  infoText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    marginLeft: 8,
  },

  botaoSalvar: {
    minHeight: 59,
    backgroundColor: "#16A34A",
    borderRadius: 18,
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,

    shadowColor: "#16A34A",
    shadowOpacity: 0.17,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoSalvarTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  optionCard: {
    minHeight: 118,
    borderRadius: 22,
    padding: 15,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,

    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  rotinaCard: {
    backgroundColor: "#F0F7FF",
    borderColor: "#DCEBFF",
  },

  medicamentoCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F1E5E5",
  },

  alertaCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE7B0",
  },

  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  rotinaIcon: {
    backgroundColor: "#DDEEFF",
  },

  medicamentoIcon: {
    backgroundColor: "#FFEAEA",
  },

  alertaIcon: {
    backgroundColor: "#FEF3C7",
  },

  optionContent: {
    flex: 1,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },

  statusLabel: {
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "900",
  },

  optionTitle: {
    color: "#0F2557",
    fontSize: 18,
    fontWeight: "900",
  },

  optionDescription: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    paddingRight: 4,
  },

  blueArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  redArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEAEA",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  footerCard: {
    marginTop: 10,
    borderRadius: 22,
    paddingVertical: 17,
    paddingHorizontal: 10,
    backgroundColor: "#EAF9F0",
    flexDirection: "row",
    alignItems: "center",
  },

  footerItem: {
    flex: 1,
    alignItems: "center",
  },

  footerText: {
    color: "#166534",
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 5,
  },

  footerDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#B7E4C7",
  },
});