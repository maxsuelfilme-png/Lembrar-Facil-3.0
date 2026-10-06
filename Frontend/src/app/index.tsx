import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { estaLogado } from "../services/authService";

export default function Inicio() {
  const router = useRouter();

  const [verificandoLogin, setVerificandoLogin] =
    useState(true);

  useEffect(() => {
    verificarLogin();
  }, []);

  async function verificarLogin() {
    try {
      const logado = await estaLogado();

      console.log("Usuário logado:", logado);

      if (!logado) {
        router.replace("/login");
        return;
      }

      setVerificandoLogin(false);
    } catch (erro) {
      console.error(
        "Erro ao verificar login:",
        erro
      );

      router.replace("/login");
    }
  }

  if (verificandoLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Carregando LembraFácil...
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoIcon}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={34}
                color="#2563EB"
              />
            </View>

            <View style={styles.brandText}>
              <Text style={styles.logo}>
                <Text style={styles.logoBlue}>
                  Lembra
                </Text>

                <Text style={styles.logoGreen}>
                  Fácil
                </Text>
              </Text>

              <Text style={styles.subtitle}>
                Cuidando da sua rotina com carinho
              </Text>
            </View>

            <TouchableOpacity
              style={styles.settingsButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name="settings-outline"
                size={25}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.hello}>
            Olá! 👋
          </Text>

          <Text style={styles.title}>
            Como podemos ajudar hoje?
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.profileCard,
            styles.idosoCard,
          ]}
          activeOpacity={0.85}
          onPress={() => router.push("/idoso")}
        >
          <View
            style={[
              styles.profileIcon,
              styles.idosoIcon,
            ]}
          >
            <Text style={styles.profileEmoji}>
              👴
            </Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.idosoLabel}>
              SOU IDOSO
            </Text>

            <Text style={styles.profileTitle}>
              Minha rotina e horários
            </Text>

            <Text style={styles.profileDescription}>
              Ver meus medicamentos, lembretes e
              confirmações
            </Text>
          </View>

          <View
            style={[
              styles.arrowButton,
              styles.blueArrow,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={25}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.profileCard,
            styles.familiaCard,
          ]}
          activeOpacity={0.85}
          onPress={() => router.push("/familia")}
        >
          <View
            style={[
              styles.profileIcon,
              styles.familiaIcon,
            ]}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={48}
              color="#16A34A"
            />
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.familiaLabel}>
              SOU FAMILIAR
            </Text>

            <Text style={styles.profileTitle}>
              Acompanhar meu familiar
            </Text>

            <Text style={styles.profileDescription}>
              Ver rotina e confirmações
            </Text>
          </View>

          <View
            style={[
              styles.arrowButton,
              styles.greenArrow,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={25}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Acesso rápido
        </Text>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push("/receita")
            }
          >
            <View
              style={[
                styles.quickIcon,
                styles.cameraBg,
              ]}
            >
              <Ionicons
                name="camera"
                size={31}
                color="#2563EB"
              />
            </View>

            <Text style={styles.quickTitle}>
              Ler Receita
            </Text>

            <Text style={styles.quickDescription}>
              Tire uma foto para cadastrar
            </Text>

            <View
              style={[
                styles.smallArrow,
                styles.smallBlue,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#2563EB"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push("/medicamentos")
            }
          >
            <View
              style={[
                styles.quickIcon,
                styles.medicineBg,
              ]}
            >
              <MaterialCommunityIcons
                name="pill"
                size={32}
                color="#E53935"
              />
            </View>

            <Text style={styles.quickTitle}>
              Meus Medicamentos
            </Text>

            <Text style={styles.quickDescription}>
              Visualizar cadastrados
            </Text>

            <View
              style={[
                styles.smallArrow,
                styles.smallRed,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#E53935"
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footerCard}>
          <View style={styles.footerItem}>
            <Ionicons
              name="checkmark-circle"
              size={21}
              color="#16A34A"
            />

            <Text style={styles.footerText}>
              Simples{"\n"}de usar
            </Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerItem}>
            <Ionicons
              name="shield-checkmark"
              size={21}
              color="#16A34A"
            />

            <Text style={styles.footerText}>
              Seguro{"\n"}para sua família
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
              Feito com{"\n"}carinho
            </Text>
          </View>
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

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },

  header: {
    paddingTop: 10,
    paddingBottom: 18,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  brandText: {
    flex: 1,
  },

  logo: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },

  logoBlue: {
    color: "#2563EB",
  },

  logoGreen: {
    color: "#16A34A",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 1,
    fontWeight: "500",
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  welcome: {
    marginTop: 5,
    marginBottom: 20,
  },

  hello: {
    fontSize: 22,
    color: "#0F2557",
    fontWeight: "800",
  },

  title: {
    fontSize: 29,
    lineHeight: 35,
    color: "#0F2557",
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.5,
  },

  profileCard: {
    minHeight: 145,
    borderRadius: 25,
    padding: 16,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",

    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  idosoCard: {
    backgroundColor: "#E4F3FF",
  },

  familiaCard: {
    backgroundColor: "#E8F9EE",
  },

  profileIcon: {
    width: 83,
    height: 83,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  idosoIcon: {
    backgroundColor: "#D2EAFF",
  },

  familiaIcon: {
    backgroundColor: "#D3F3DF",
  },

  profileEmoji: {
    fontSize: 52,
  },

  profileContent: {
    flex: 1,
  },

  idosoLabel: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 4,
  },

  familiaLabel: {
    color: "#16A34A",
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 4,
  },

  profileTitle: {
    color: "#0F2557",
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
  },

  profileDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
    fontWeight: "500",
  },

  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
  },

  blueArrow: {
    backgroundColor: "#3182F6",
  },

  greenArrow: {
    backgroundColor: "#20B26B",
  },

  sectionTitle: {
    color: "#0F2557",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 13,
  },

  quickGrid: {
    flexDirection: "row",
    gap: 10,
  },

  quickCard: {
    flex: 1,
    minHeight: 185,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 13,

    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  cameraBg: {
    backgroundColor: "#E4F1FF",
  },

  medicineBg: {
    backgroundColor: "#FFE9E9",
  },

  quickTitle: {
    color: "#0F2557",
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "900",
  },

  quickDescription: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    paddingRight: 3,
  },

  smallArrow: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 31,
    height: 31,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  smallBlue: {
    backgroundColor: "#E5F2FF",
  },

  smallRed: {
    backgroundColor: "#FFEAEA",
  },

  footerCard: {
    marginTop: 22,
    borderRadius: 22,
    paddingVertical: 17,
    paddingHorizontal: 12,
    backgroundColor: "#EAF9F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerItem: {
    flex: 1,
    alignItems: "center",
  },

  footerText: {
    marginTop: 5,
    color: "#166534",
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    fontWeight: "700",
  },

  footerDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#B7E4C7",
  },
});