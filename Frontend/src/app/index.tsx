
import React from "react";

import {
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

export default function Inicio() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* IDENTIDADE VISUAL */}
        <View style={styles.hero}>
          <View style={styles.decoracaoEsquerda} />
          <View style={styles.decoracaoDireita} />

          <View style={styles.logoIcone}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={56}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.logo}>
            <Text style={styles.logoEscuro}>
              Lembra
            </Text>
            <Text style={styles.logoAzul}>
              Fácil
            </Text>
          </Text>

          <Text style={styles.slogan}>
            Cuidando da sua rotina com carinho
          </Text>
        </View>

        {/* ESCOLHA DE PERFIL */}
        <View style={styles.introducao}>
          <Text style={styles.titulo}>
            Como deseja acessar?
          </Text>

          <Text style={styles.subtitulo}>
            Escolha o seu perfil para continuar
          </Text>
        </View>

        {/* CARTÃO DO IDOSO */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.cartao,
            styles.cartaoIdoso,
          ]}
          onPress={() => router.push("/login")}
          accessibilityRole="button"
          accessibilityLabel="Sou Idoso, acessar login do idoso"
        >
          <View
            style={[
              styles.ilustracao,
              styles.ilustracaoIdoso,
            ]}
          >
            <Text style={styles.emoji}>
              👴🏻
            </Text>
          </View>

          <View style={styles.conteudoCartao}>
            <Text style={styles.tituloCartao}>
              Sou Idoso
            </Text>

            <Text style={styles.descricaoCartao}>
              Meus medicamentos, receitas,
              horários e rotina.
            </Text>
          </View>

          <View
            style={[
              styles.seta,
              styles.setaAzul,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={25}
              color="#2478E6"
            />
          </View>
        </TouchableOpacity>

        {/* CARTÃO DO FAMILIAR */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.cartao,
            styles.cartaoFamiliar,
          ]}
          onPress={() =>
            router.push("/familia")
          }
          accessibilityRole="button"
          accessibilityLabel="Sou Familiar, acessar login do familiar"
        >
          <View
            style={[
              styles.ilustracao,
              styles.ilustracaoFamiliar,
            ]}
          >
            <Text style={styles.emoji}>
              👨‍👩‍👧
            </Text>
          </View>

          <View style={styles.conteudoCartao}>
            <Text style={styles.tituloCartao}>
              Sou Familiar
            </Text>

            <Text style={styles.descricaoCartao}>
              Acompanhar medicamentos, rotina,
              status de doses e outras informações.
            </Text>
          </View>

          <View
            style={[
              styles.seta,
              styles.setaVerde,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={25}
              color="#188349"
            />
          </View>
        </TouchableOpacity>

        {/* CARTÃO DA FARMÁCIA */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.cartao,
            styles.cartaoFarmacia,
          ]}
          onPress={() =>
            router.push("/farmacia-login")
          }
          accessibilityRole="button"
          accessibilityLabel="Sou Farmácia, acessar login da farmácia"
        >
          <View
            style={[
              styles.ilustracao,
              styles.ilustracaoFarmacia,
            ]}
          >
            <MaterialCommunityIcons
              name="storefront-outline"
              size={65}
              color="#7C3AED"
            />

            <View style={styles.cruzFarmacia}>
              <MaterialCommunityIcons
                name="medical-bag"
                size={23}
                color="#0BAFA1"
              />
            </View>
          </View>

          <View style={styles.conteudoCartao}>
            <Text style={styles.tituloCartao}>
              Sou Farmácia
            </Text>

            <Text style={styles.descricaoCartao}>
              Gerenciar produtos, preços,
              estoque e pedidos.
            </Text>
          </View>

          <View
            style={[
              styles.seta,
              styles.setaRoxa,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={25}
              color="#6D28D9"
            />
          </View>
        </TouchableOpacity>

        {/* SEGURANÇA */}
        <View style={styles.seguranca}>
          <View style={styles.escudo}>
            <MaterialCommunityIcons
              name="shield-check"
              size={40}
              color="#13864C"
            />
          </View>

          <View style={styles.segurancaConteudo}>
            <Text style={styles.segurancaTitulo}>
              Seus dados estão seguros
            </Text>

            <Text style={styles.segurancaDescricao}>
              Utilizamos autenticação segura
              para proteger suas informações.
            </Text>
          </View>
        </View>

        {/* RODAPÉ */}
        <Text style={styles.rodape}>
          LembraFácil © 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FBFF",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 26,
  },

  hero: {
    alignItems: "center",
    paddingTop: 38,
    paddingBottom: 33,
    marginHorizontal: -18,
    backgroundColor: "#F1F8FF",
    overflow: "hidden",
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },

  decoracaoEsquerda: {
    position: "absolute",
    width: 230,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#DDEEFF",
    left: -125,
    bottom: -93,
    transform: [
      { rotate: "-15deg" },
    ],
  },

  decoracaoDireita: {
    position: "absolute",
    width: 175,
    height: 175,
    borderRadius: 90,
    borderWidth: 22,
    borderColor: "#E2F0FF",
    right: -100,
    top: 8,
  },

  logoIcone: {
    width: 91,
    height: 91,
    borderRadius: 32,
    backgroundColor: "#2679ED",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    marginBottom: 12,
  },

  logo: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.6,
  },

  logoEscuro: {
    color: "#071C5A",
  },

  logoAzul: {
    color: "#2679ED",
  },

  slogan: {
    fontSize: 15,
    color: "#4C607C",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "500",
  },

  introducao: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 24,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: "#071C5A",
    textAlign: "center",
    letterSpacing: -0.7,
  },

  subtitulo: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },

  cartao: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 145,
    borderRadius: 27,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    elevation: 4,
  },

  cartaoIdoso: {
    backgroundColor: "#F2F8FF",
  },

  cartaoFamiliar: {
    backgroundColor: "#F2FCF5",
  },

  cartaoFarmacia: {
    backgroundColor: "#F8F3FF",
  },

  ilustracao: {
    width: 100,
    height: 111,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  ilustracaoIdoso: {
    backgroundColor: "#DEEDFF",
  },

  ilustracaoFamiliar: {
    backgroundColor: "#DFF5E7",
  },

  ilustracaoFarmacia: {
    backgroundColor: "#EAE1FF",
  },

  emoji: {
    fontSize: 55,
  },

  cruzFarmacia: {
    position: "absolute",
    top: 13,
    right: 12,
  },

  conteudoCartao: {
    flex: 1,
  },

  tituloCartao: {
    fontSize: 21,
    fontWeight: "900",
    color: "#081C59",
    marginBottom: 7,
  },

  descricaoCartao: {
    fontSize: 13,
    color: "#53637E",
    lineHeight: 19,
  },

  seta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  setaAzul: {
    backgroundColor: "#DCEEFF",
  },

  setaVerde: {
    backgroundColor: "#DDF6E5",
  },

  setaRoxa: {
    backgroundColor: "#E8DFFF",
  },

  seguranca: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    width: "94%",
    backgroundColor: "#EAF9F1",
    borderRadius: 25,
    padding: 16,
    marginTop: 14,
  },

  escudo: {
    marginRight: 12,
  },

  segurancaConteudo: {
    flex: 1,
  },

  segurancaTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#17623A",
  },

  segurancaDescricao: {
    fontSize: 12,
    color: "#426654",
    lineHeight: 18,
    marginTop: 3,
  },

  rodape: {
    textAlign: "center",
    color: "#9AA9B9",
    fontSize: 11,
    marginTop: 20,
  },
});
