import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

export default function IdosoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.voltarButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={23} color="#2563EB" />
            <Text style={styles.voltar}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons
              name="settings-outline"
              size={26}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.title}>Olá! 👋</Text>
          <Text style={styles.subtitle}>
            Vamos cuidar da sua rotina.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.card, styles.receitaCard]}
          activeOpacity={0.85}
          onPress={() => router.push("/receita")}
        >
          <View style={[styles.iconBox, styles.receitaIcon]}>
            <Ionicons name="camera" size={39} color="#2563EB" />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Ler receita</Text>
            <Text style={styles.cardText}>
              Tire uma foto da sua receita para cadastrar os medicamentos
            </Text>
          </View>

          <View style={[styles.arrow, styles.arrowBlue]}>
            <Ionicons
              name="chevron-forward"
              size={27}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.medicamentoCard]}
          activeOpacity={0.85}
          onPress={() => router.push("/medicamentos")}
        >
          <View style={[styles.iconBox, styles.medicamentoIcon]}>
            <MaterialCommunityIcons
              name="pill"
              size={42}
              color="#EF4444"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Meus medicamentos
            </Text>
            <Text style={styles.cardText}>
              Veja seus medicamentos e horários
            </Text>
          </View>

          <View style={[styles.arrow, styles.arrowRed]}>
            <Ionicons
              name="chevron-forward"
              size={27}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.rotinaCard]}
          activeOpacity={0.85}
          onPress={() => router.push("/rotina")}
        >
          <View style={[styles.iconBox, styles.rotinaIcon]}>
            <Ionicons
              name="notifications"
              size={39}
              color="#16A34A"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Minha rotina</Text>
            <Text style={styles.cardText}>
              Confira o que precisa fazer hoje
            </Text>
          </View>

          <View style={[styles.arrow, styles.arrowGreen]}>
            <Ionicons
              name="chevron-forward"
              size={27}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sos}
          activeOpacity={0.85}
        >
          <View style={styles.sosIconBox}>
            <Text style={styles.sosIcon}>SOS</Text>
          </View>

          <View style={styles.sosContent}>
            <Text style={styles.sosTitle}>
              PRECISO DE AJUDA
            </Text>
            <Text style={styles.sosText}>
              Avise meu familiar
            </Text>
          </View>

          <View style={styles.sosArrow}>
            <Ionicons
              name="chevron-forward"
              size={28}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
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
              size={24}
              color="#16A34A"
            />
            <Text style={styles.footerText}>
              Cuidando{"\n"}de você
            </Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerItem}>
            <Ionicons
              name="heart"
              size={24}
              color="#16A34A"
            />
            <Text style={styles.footerText}>
              Sempre{"\n"}com você
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 35,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  voltarButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  voltar: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "800",
    marginLeft: 6,
  },

  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  welcome: {
    marginBottom: 28,
  },

  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#0F2557",
  },

  subtitle: {
    fontSize: 21,
    lineHeight: 28,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 6,
  },

  card: {
    minHeight: 128,
    borderRadius: 25,
    padding: 17,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },

  receitaCard: {
    backgroundColor: "#EAF4FF",
  },

  medicamentoCard: {
    backgroundColor: "#FFF0F0",
  },

  rotinaCard: {
    backgroundColor: "#ECFDF3",
  },

  iconBox: {
    width: 74,
    height: 74,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  receitaIcon: {
    backgroundColor: "#D9EBFF",
  },

  medicamentoIcon: {
    backgroundColor: "#FFE0E0",
  },

  rotinaIcon: {
    backgroundColor: "#D9F7E4",
  },

  cardContent: {
    flex: 1,
    paddingRight: 8,
  },

  cardTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    color: "#0F2557",
  },

  cardText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "500",
  },

  arrow: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  arrowBlue: {
    backgroundColor: "#2563EB",
  },

  arrowRed: {
    backgroundColor: "#EF4444",
  },

  arrowGreen: {
    backgroundColor: "#16A34A",
  },

  sos: {
    minHeight: 130,
    backgroundColor: "#EF2929",
    borderRadius: 25,
    padding: 18,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#DC2626",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  sosIconBox: {
    width: 74,
    height: 74,
    borderRadius: 21,
    backgroundColor: "#FF4040",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  sosIcon: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  sosContent: {
    flex: 1,
  },

  sosTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  sosText: {
    color: "#FFE4E4",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
  },

  sosArrow: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },

  footer: {
    marginTop: 22,
    backgroundColor: "#EAF9F0",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  footerItem: {
    flex: 1,
    alignItems: "center",
  },

  footerText: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },

  footerDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#B7E4C7",
  },
});