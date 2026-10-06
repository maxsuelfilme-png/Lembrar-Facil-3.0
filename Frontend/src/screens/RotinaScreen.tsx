import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import {
  listarMedicamentos,
  Medicamento,
} from "../services/medicamentosService";

import {
  listarRegistros,
  criarRegistro,
  confirmarRegistro,
  RegistroMedicamento,
} from "../services/registrosService";

type StatusRotina = "tomado" | "atrasado" | "pendente";

type ItemRotina = {
  medicamento: Medicamento;
  registro?: RegistroMedicamento;
  status: StatusRotina;
};

export default function RotinaScreen() {
  const router = useRouter();

  const [itens, setItens] = useState<ItemRotina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const carregarRotina = useCallback(async () => {
    try {
      const [medicamentos, registros] = await Promise.all([
        listarMedicamentos(),
        listarRegistros(),
      ]);

      const agora = new Date();

      const dataHoje = agora.toISOString().split("T")[0];

      const rotina: ItemRotina[] = medicamentos
        .filter((medicamento) => medicamento.ativo !== false)
        .map((medicamento) => {
          const registro = registros.find((item) => {
            if (String(item.medicamento) !== String(medicamento.id)) {
              return false;
            }

            const dataRegistro =
              item.data ||
              item.criado_em?.split("T")[0];

            return dataRegistro === dataHoje;
          });

          let status: StatusRotina = "pendente";

          if (registro?.tomado) {
            status = "tomado";
          } else {
            const horario = medicamento.horario;

            if (horario) {
              const [hora, minuto] = horario
                .substring(0, 5)
                .split(":")
                .map(Number);

              const horarioMedicamento = new Date();

              horarioMedicamento.setHours(
                hora,
                minuto,
                0,
                0
              );

              if (agora > horarioMedicamento) {
                status = "atrasado";
              }
            }
          }

          return {
            medicamento,
            registro,
            status,
          };
        })
        .sort((a, b) =>
          (a.medicamento.horario || "").localeCompare(
            b.medicamento.horario || ""
          )
        );

      setItens(rotina);
    } catch (erro) {
      console.error("Erro ao carregar rotina:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível carregar sua rotina."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarRotina();
    }, [carregarRotina])
  );

  async function atualizar() {
    setAtualizando(true);
    await carregarRotina();
  }

  async function confirmarTomado(item: ItemRotina) {
    const id = String(item.medicamento.id);

    try {
      setConfirmandoId(id);

      let registro = item.registro;

      if (!registro) {
        registro = await criarRegistro(
          Number(item.medicamento.id)
        );
      }

      if (!registro.tomado) {
        await confirmarRegistro(registro.id);
      }

      await carregarRotina();

      Alert.alert(
        "Tudo certo! 💚",
        `${item.medicamento.medicamento} foi confirmado como tomado.`
      );
    } catch (erro) {
      console.error(
        "Erro ao confirmar medicamento:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível confirmar o medicamento."
      );
    } finally {
      setConfirmandoId(null);
    }
  }

  function getStatus(item: ItemRotina) {
    if (item.status === "tomado") {
      return {
        texto: "Tomado",
        cor: "#16A34A",
        fundo: "#DCFCE7",
        icone: "checkmark-circle" as const,
      };
    }

    if (item.status === "atrasado") {
      return {
        texto: "Atrasado",
        cor: "#DC2626",
        fundo: "#FEE2E2",
        icone: "alert-circle" as const,
      };
    }

    return {
      texto: "A tomar",
      cor: "#D97706",
      fundo: "#FEF3C7",
      icone: "time" as const,
    };
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
          />
        }
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.voltarButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#2563EB"
            />

            <Text style={styles.voltar}>
              Voltar
            </Text>
          </TouchableOpacity>

          <View style={styles.calendarIcon}>
            <Ionicons
              name="calendar-outline"
              size={25}
              color="#2563EB"
            />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            Minha rotina
          </Text>

          <Text style={styles.subtitle}>
            {hoje}
          </Text>

          <Text style={styles.description}>
            Acompanhe seus medicamentos de hoje
          </Text>
        </View>

        {carregando ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />

            <Text style={styles.loadingText}>
              Carregando sua rotina...
            </Text>
          </View>
        ) : itens.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="pill"
                size={46}
                color="#2563EB"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nenhum medicamento
            </Text>

            <Text style={styles.emptyText}>
              Você ainda não possui medicamentos
              cadastrados.
            </Text>

            <TouchableOpacity
              style={styles.cadastrarButton}
              onPress={() =>
                router.push("/receita")
              }
            >
              <Ionicons
                name="camera"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.cadastrarText}>
                Cadastrar medicamento
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          itens.map((item) => {
            const status = getStatus(item);

            const medicamento =
              item.medicamento;

            const confirmando =
              confirmandoId ===
              String(medicamento.id);

            return (
              <View
                key={String(medicamento.id)}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View style={styles.medicineIcon}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={34}
                      color="#2563EB"
                    />
                  </View>

                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>
                      {medicamento.medicamento}
                    </Text>

                    {!!medicamento.dosagem && (
                      <Text style={styles.dosagem}>
                        {medicamento.dosagem}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.status,
                      {
                        backgroundColor:
                          status.fundo,
                      },
                    ]}
                  >
                    <Ionicons
                      name={status.icone}
                      size={17}
                      color={status.cor}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: status.cor,
                        },
                      ]}
                    >
                      {status.texto}
                    </Text>
                  </View>
                </View>

                <View style={styles.horarioArea}>
                  <Ionicons
                    name="time-outline"
                    size={25}
                    color="#64748B"
                  />

                  <View>
                    <Text style={styles.horarioLabel}>
                      Horário
                    </Text>

                    <Text style={styles.horario}>
                      {medicamento.horario
                        ? medicamento.horario.substring(
                            0,
                            5
                          )
                        : "--:--"}
                    </Text>
                  </View>
                </View>

                {item.status !== "tomado" ? (
                  <TouchableOpacity
                    style={styles.tomeiButton}
                    activeOpacity={0.85}
                    disabled={confirmando}
                    onPress={() =>
                      confirmarTomado(item)
                    }
                  >
                    {confirmando ? (
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

                        <Text style={styles.tomeiText}>
                          TOMEI O MEDICAMENTO
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.confirmado}>
                    <Ionicons
                      name="checkmark-circle"
                      size={25}
                      color="#16A34A"
                    />

                    <Text style={styles.confirmadoText}>
                      Medicamento confirmado
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Ionicons
            name="heart"
            size={20}
            color="#16A34A"
          />

          <Text style={styles.footerText}>
            LembraFácil • Cuidando da sua rotina
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  voltarButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  voltar: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
    marginLeft: 6,
  },

  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    marginBottom: 25,
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0F2557",
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 5,
    textTransform: "capitalize",
  },

  description: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 6,
  },

  loading: {
    paddingVertical: 80,
    alignItems: "center",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 16,
    marginTop: 15,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 30,
    alignItems: "center",
    elevation: 3,
  },

  emptyIcon: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0F2557",
    marginTop: 18,
  },

  emptyText: {
    fontSize: 16,
    lineHeight: 23,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },

  cadastrarButton: {
    marginTop: 22,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cadastrarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 18,
    marginBottom: 17,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  medicineIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  medicineInfo: {
    flex: 1,
  },

  medicineName: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F2557",
  },

  dosagem: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 3,
  },

  status: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },

  horarioArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  horarioLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  horario: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0F2557",
  },

  tomeiButton: {
    backgroundColor: "#16A34A",
    borderRadius: 17,
    minHeight: 57,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  tomeiText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  confirmado: {
    backgroundColor: "#DCFCE7",
    borderRadius: 17,
    minHeight: 57,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  confirmadoText: {
    color: "#15803D",
    fontSize: 16,
    fontWeight: "800",
  },

  footer: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  footerText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
});