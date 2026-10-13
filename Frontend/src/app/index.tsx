
import React from "react";

import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// =====================================================
// CORES DO LEMBRAFÁCIL
// =====================================================

const CORES = {
  fundo: "#F5F9FF",
  azul: "#087CF5",
  azulEscuro: "#081D55",
  verde: "#08B85C",
  roxo: "#7935E8",
  texto: "#53647D",
  branco: "#FFFFFF",
};

// =====================================================
// IMAGENS 3D
// =====================================================

const IMAGENS = {
  idoso: require("../../assets/images/idoso-3d.png"),
  familiar: require("../../assets/images/familia-3d.png"),
  farmacia: require("../../assets/images/farmacia-3d.png"),
};

// =====================================================
// TIPOS
// =====================================================

type NomeIcone =
  React.ComponentProps<typeof Ionicons>["name"];

type Beneficio = {
  icone: NomeIcone;
  titulo: string;
};

type PerfilProps = {
  titulo: string;
  descricao: string;
  imagem: ImageSourcePropType;
  cor: string;
  fundo: string;
  fundoImagem: string;
  icone: NomeIcone;
  beneficios: Beneficio[];
  onPress: () => void;
};

// =====================================================
// ITEM DE BENEFÍCIO
// =====================================================

function ItemBeneficio({
  icone,
  titulo,
  cor,
}: {
  icone: NomeIcone;
  titulo: string;
  cor: string;
}) {
  return (
    <View style={styles.itemBeneficio}>
      <Ionicons
        name={icone}
        size={17}
        color={cor}
      />

      <Text
        style={styles.textoBeneficio}
        numberOfLines={2}
      >
        {titulo}
      </Text>
    </View>
  );
}

// =====================================================
// CARTÃO DE ACESSO
// =====================================================

function CartaoPerfil({
  titulo,
  descricao,
  imagem,
  cor,
  fundo,
  fundoImagem,
  icone,
  beneficios,
  onPress,
}: PerfilProps) {
  const { width } = useWindowDimensions();
  const compacto = width < 380;

  return (
    <TouchableOpacity
      activeOpacity={0.87}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={[
        styles.cartao,
        { backgroundColor: fundo },
      ]}
    >
      {/* ÁREA PRINCIPAL */}

      <View style={styles.cartaoPrincipal}>
        {/* IMAGEM 3D */}

        <View
          style={[
            styles.areaImagem,
            {
              backgroundColor: fundoImagem,
              width: compacto ? 100 : 115,
            },
          ]}
        >
          <View
            style={[
              styles.decoracaoImagem,
              { backgroundColor: cor },
            ]}
          />

          <Image
            source={imagem}
            style={styles.imagem3D}
            resizeMode="contain"
          />
        </View>

        {/* TEXTO E ÍCONE */}

        <View style={styles.infoPerfil}>
          <View
            style={[
              styles.iconePerfil,
              { backgroundColor: cor },
            ]}
          >
            <Ionicons
              name={icone}
              size={19}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={[
              styles.tituloCartao,
              compacto && styles.tituloCompacto,
            ]}
          >
            {titulo}
          </Text>

          <Text
            style={styles.descricaoCartao}
            numberOfLines={4}
          >
            {descricao}
          </Text>
        </View>

        {/* SETA */}

        <View
          style={[
            styles.seta,
            { backgroundColor: cor },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* FAIXA DE FUNCIONALIDADES */}

      <View
        style={[
          styles.faixaBeneficios,
          { backgroundColor: fundoImagem },
        ]}
      >
        {beneficios.map((beneficio, index) => (
          <ItemBeneficio
            key={`${titulo}-${index}`}
            icone={beneficio.icone}
            titulo={beneficio.titulo}
            cor={cor}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

// =====================================================
// TELA INICIAL
// =====================================================

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
        {/* ============================================
            CABEÇALHO
        ============================================ */}

        <View style={styles.header}>
          <View style={styles.circuloDecorativo1} />
          <View style={styles.circuloDecorativo2} />

          {/* LOGOTIPO */}

          <View style={styles.logoContainer}>
            <Ionicons
              name="heart"
              size={65}
              color={CORES.azul}
            />

            <MaterialCommunityIcons
              name="pill"
              size={36}
              color="#FFFFFF"
              style={styles.logoCapsula}
            />
          </View>

          {/* NOME DO APLICATIVO */}

          <Text style={styles.logoNome}>
            <Text style={styles.logoNomeEscuro}>
              Lembra
            </Text>
            <Text style={styles.logoNomeAzul}>
              Fácil
            </Text>
          </Text>

          <Text style={styles.slogan}>
            Cuidando da sua rotina com carinho
          </Text>

          <View style={styles.tagline}>
            <Text style={styles.taglineTexto}>
              Saúde • Organização • Bem-estar
            </Text>
          </View>
        </View>

        {/* ============================================
            INTRODUÇÃO
        ============================================ */}

        <View style={styles.introducao}>
          <Text style={styles.tituloPrincipal}>
            Como deseja acessar?
          </Text>

          <Text style={styles.subtituloPrincipal}>
            Escolha seu perfil para continuar no LembraFácil.
          </Text>
        </View>

        {/* ============================================
            SOU IDOSO
        ============================================ */}

        <CartaoPerfil
          titulo="Sou Idoso"
          descricao="Medicamentos, receitas, horários e rotina diária."
          imagem={IMAGENS.idoso}
          cor={CORES.azul}
          fundo="#F0F8FF"
          fundoImagem="#DCEEFF"
          icone="person"
          onPress={() => router.push("/idoso")}
          beneficios={[
            {
              icone: "medical-outline",
              titulo: "Lembretes de medicação",
            },
            {
              icone: "document-text-outline",
              titulo: "Leitura de receitas",
            },
            {
              icone: "calendar-outline",
              titulo: "Rotina diária",
            },
          ]}
        />

        {/* ============================================
            SOU FAMILIAR
        ============================================ */}

        <CartaoPerfil
          titulo="Sou Familiar"
          descricao="Acompanhe medicamentos, doses, rotina e alertas."
          imagem={IMAGENS.familiar}
          cor={CORES.verde}
          fundo="#F0FCF4"
          fundoImagem="#DFF8E9"
          icone="people"
          onPress={() => router.push("/familiar-login")}
          beneficios={[
            {
              icone: "stats-chart",
              titulo: "Status das doses",
            },
            {
              icone: "people-outline",
              titulo: "Acompanhamento",
            },
            {
              icone: "notifications-outline",
              titulo: "Alertas",
            },
          ]}
        />

        {/* ============================================
            SOU FARMÁCIA
        ============================================ */}

        <CartaoPerfil
          titulo="Sou Farmácia"
          descricao="Gerencie produtos, preços, estoque e pedidos."
          imagem={IMAGENS.farmacia}
          cor={CORES.roxo}
          fundo="#F8F3FF"
          fundoImagem="#EBE2FF"
          icone="storefront-outline"
          onPress={() => router.push("/farmacia-login")}
          beneficios={[
            {
              icone: "cube-outline",
              titulo: "Cadastro de produtos",
            },
            {
              icone: "pricetag-outline",
              titulo: "Preços e estoque",
            },
            {
              icone: "cart-outline",
              titulo: "Pedidos",
            },
          ]}
        />

        {/* ============================================
            SEGURANÇA
        ============================================ */}

        <View style={styles.seguranca}>
          <View style={styles.escudoContainer}>
            <MaterialCommunityIcons
              name="shield-check"
              size={38}
              color={CORES.verde}
            />
          </View>

          <View style={styles.segurancaInfo}>
            <Text style={styles.segurancaTitulo}>
              Seus dados estão seguros
            </Text>

            <Text style={styles.segurancaDescricao}>
              Utilizamos autenticação segura para proteger suas informações.
            </Text>
          </View>

          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#89B8D5"
          />
        </View>

        {/* RODAPÉ */}

        <Text style={styles.rodape}>
          LembraFácil © 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  // TELA

  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // CABEÇALHO

  header: {
    alignItems: "center",
    backgroundColor: "#E8F5FF",
    marginHorizontal: -16,
    paddingTop: 10,
    paddingBottom: 13,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },

  circuloDecorativo1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#CDEAFF",
    right: -105,
    top: -100,
  },

  circuloDecorativo2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#D2ECFF",
    left: -105,
    bottom: -95,
  },

  logoContainer: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },

  logoCapsula: {
    position: "absolute",
    transform: [{ rotate: "-35deg" }],
  },

  logoNome: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: -3,
  },

  logoNomeEscuro: {
    color: CORES.azulEscuro,
  },

  logoNomeAzul: {
    color: CORES.azul,
  },

  slogan: {
    color: "#48627D",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 1,
  },

  tagline: {
    marginTop: 7,
    backgroundColor: "#FFFFFFCC",
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 25,
  },

  taglineTexto: {
    color: "#2774B8",
    fontSize: 11,
    fontWeight: "700",
  },

  // INTRODUÇÃO

  introducao: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 13,
    paddingHorizontal: 6,
  },

  tituloPrincipal: {
    color: CORES.azulEscuro,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  subtituloPrincipal: {
    color: CORES.texto,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 3,
  },

  // CARTÕES COMPACTOS

  cartao: {
    borderRadius: 22,
    padding: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#18324B",
    shadowOpacity: 0.1,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  cartaoPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 130,
  },

  areaImagem: {
    height: 130,
    borderRadius: 18,
    marginRight: 9,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  decoracaoImagem: {
    position: "absolute",
    width: 115,
    height: 115,
    borderRadius: 58,
    opacity: 0.12,
    bottom: -50,
    left: -25,
  },

  imagem3D: {
    width: "100%",
    height: "100%",
  },

  infoPerfil: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 4,
  },

  iconePerfil: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  tituloCartao: {
    fontSize: 18,
    fontWeight: "900",
    color: CORES.azulEscuro,
    marginBottom: 4,
  },

  tituloCompacto: {
    fontSize: 16,
  },

  descricaoCartao: {
    color: CORES.texto,
    fontSize: 11,
    lineHeight: 16,
  },

  seta: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  // FUNCIONALIDADES

  faixaBeneficios: {
    flexDirection: "row",
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginTop: 7,
  },

  itemBeneficio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    minHeight: 40,
  },

  textoBeneficio: {
    color: "#42536B",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 3,
  },

  // SEGURANÇA

  seguranca: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F9F0",
    borderRadius: 21,
    padding: 12,
    marginTop: 8,
  },

  escudoContainer: {
    marginRight: 9,
  },

  segurancaInfo: {
    flex: 1,
  },

  segurancaTitulo: {
    color: "#17623A",
    fontSize: 15,
    fontWeight: "900",
  },

  segurancaDescricao: {
    color: "#426654",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  // RODAPÉ

  rodape: {
    color: "#9BAABD",
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
  },
});
