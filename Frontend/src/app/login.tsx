
import React from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

export default function FarmaciasScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#2563EB"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.logo}>
              <Text style={styles.blue}>Lembra</Text>
              <Text style={styles.green}>Fácil</Text>
            </Text>

            <Text style={styles.subtitle}>
              Farmácias Parceiras
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={29}
              color="#7C3AED"
            />
          </View>
        </View>

        {/* BANNER PRINCIPAL */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <MaterialCommunityIcons
              name="medical-bag"
              size={42}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.bannerTitle}>
            Seus medicamentos sempre por perto
          </Text>

          <Text style={styles.bannerDescription}>
            Encontre farmácias parceiras, consulte
            medicamentos e preços, visualize endereços
            e acompanhe a reposição dos medicamentos.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Como podemos ajudar?
        </Text>

        {/* BUSCAR MEDICAMENTOS */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push("/farmacias-busca")}
        >
          <View
            style={[
              styles.cardIcon,
              styles.searchBg,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={34}
              color="#2563EB"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Encontrar farmácias
            </Text>

            <Text style={styles.cardDescription}>
              Pesquise medicamentos, compare preços
              e consulte as farmácias disponíveis.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={23}
            color="#2563EB"
          />
        </TouchableOpacity>

        {/* MAPA DAS FARMÁCIAS */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push("/farmacias-mapa")}
        >
          <View
            style={[
              styles.cardIcon,
              styles.mapBg,
            ]}
          >
            <Ionicons
              name="map-outline"
              size={34}
              color="#7C3AED"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Ver farmácias no mapa
            </Text>

            <Text style={styles.cardDescription}>
              Visualize a localização das farmácias
              parceiras e descubra como chegar.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={23}
            color="#7C3AED"
          />
        </TouchableOpacity>

        {/* REPOSIÇÃO DE MEDICAMENTOS */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() =>
            router.push("/farmacias-reposicao")
          }
        >
          <View
            style={[
              styles.cardIcon,
              styles.alertBg,
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={34}
              color="#D97706"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Reposição de medicamentos
            </Text>

            <Text style={styles.cardDescription}>
              Acompanhe o estoque e as solicitações
              de reposição dos medicamentos.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={23}
            color="#D97706"
          />
        </TouchableOpacity>

        {/* INFORMAÇÕES DE SEGURANÇA */}
        <View style={styles.infoCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={28}
            color="#16A34A"
          />

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Segurança em primeiro lugar
            </Text>

            <Text style={styles.infoDescription}>
              O contato para solicitar medicamentos
              somente será realizado após a autorização
              do cuidador. A venda e a entrega são
              responsabilidade da farmácia.
            </Text>
          </View>
        </View>

        {/* RODAPÉ */}
        <Text style={styles.footer}>
          LembraFácil — Cuidando de quem você ama 💙
        </Text>
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
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 22,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  logo: {
    fontSize: 27,
    fontWeight: "900",
  },

  blue: {
    color: "#2563EB",
  },

  green: {
    color: "#16A34A",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F1E9FF",
    justifyContent: "center",
    alignItems: "center",
  },

  banner: {
    backgroundColor: "#2563EB",
    borderRadius: 26,
    padding: 24,
    marginBottom: 27,
  },

  bannerIcon: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  bannerTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 10,
  },

  bannerDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#EAF3FF",
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0F2557",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  searchBg: {
    backgroundColor: "#E4F1FF",
  },

  mapBg: {
    backgroundColor: "#F1E9FF",
  },

  alertBg: {
    backgroundColor: "#FFF3D9",
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F2557",
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#EAF9F0",
    borderRadius: 20,
    padding: 17,
    marginTop: 12,
    alignItems: "flex-start",
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#166534",
    marginBottom: 5,
  },

  infoDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#166534",
  },

  footer: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 30,
  },
});
