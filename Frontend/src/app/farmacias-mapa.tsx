
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";

import MapView, {
  Marker,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  FarmaciaMapa,
  listarFarmaciasMapa,
} from "../services/farmaciasService";

export default function FarmaciasMapaScreen() {
  const router = useRouter();
  const mapaRef = useRef<MapView>(null);

  const [farmacias, setFarmacias] = useState<FarmaciaMapa[]>([]);
  const [selecionada, setSelecionada] =
    useState<FarmaciaMapa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarFarmacias();
  }, []);

  async function carregarFarmacias() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await listarFarmaciasMapa();
      setFarmacias(dados);
    } catch (error) {
      setErro("Não foi possível carregar as farmácias.");
    } finally {
      setCarregando(false);
    }
  }

  const pontos = farmacias.filter((farmacia) => {
    const latitude = Number(farmacia.latitude);
    const longitude = Number(farmacia.longitude);

    return (
      farmacia.latitude != null &&
      farmacia.longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  });

  const primeira = pontos[0];

  function selecionarFarmacia(farmacia: FarmaciaMapa) {
    setSelecionada(farmacia);

    mapaRef.current?.animateToRegion(
      {
        latitude: Number(farmacia.latitude),
        longitude: Number(farmacia.longitude),
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      700
    );
  }

  async function abrirRota(farmacia: FarmaciaMapa) {
    const latitude = Number(farmacia.latitude);
    const longitude = Number(farmacia.longitude);

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${latitude},${longitude}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível abrir a rota no Google Maps."
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.titulo}>
            Mapa de Farmácias
          </Text>

          <Text style={styles.subtitulo}>
            Encontre farmácias parceiras
          </Text>
        </View>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#1674C5"
          />
          <Text>Carregando farmácias...</Text>
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#1674C5"
          />

          <Text style={styles.mensagem}>{erro}</Text>

          <TouchableOpacity
            style={styles.botao}
            onPress={carregarFarmacias}
          >
            <Text style={styles.textoBotao}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      ) : !primeira ? (
        <View style={styles.centro}>
          <Ionicons
            name="location-outline"
            size={48}
            color="#1674C5"
          />

          <Text style={styles.mensagem}>
            Nenhuma farmácia com localização cadastrada.
          </Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapaRef}
            style={styles.mapa}
            provider={PROVIDER_GOOGLE}
            mapType="standard"
            userInterfaceStyle="light"
            initialRegion={{
              latitude: Number(primeira.latitude),
              longitude: Number(primeira.longitude),
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            }}
            showsCompass
            showsBuildings
            loadingEnabled
            loadingIndicatorColor="#1674C5"
          >
            {pontos.map((farmacia) => (
              <Marker
                key={farmacia.id}
                coordinate={{
                  latitude: Number(farmacia.latitude),
                  longitude: Number(farmacia.longitude),
                }}
                title={farmacia.nome}
                description={`${farmacia.endereco}, ${farmacia.cidade}`}
                pinColor="#1674C5"
                onPress={() => selecionarFarmacia(farmacia)}
              />
            ))}
          </MapView>

          <View style={styles.contador}>
            <Ionicons
              name="medical"
              size={17}
              color="#1674C5"
            />

            <Text style={styles.textoContador}>
              {pontos.length} farmácia(s) no mapa
            </Text>
          </View>

          {selecionada && (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <View style={styles.iconeFarmacia}>
                  <Ionicons
                    name="medkit"
                    size={24}
                    color="#1674C5"
                  />
                </View>

                <View style={styles.cardTitulo}>
                  <Text style={styles.nome}>
                    {selecionada.nome}
                  </Text>

                  <Text style={styles.parceira}>
                    Farmácia parceira
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSelecionada(null)}
                >
                  <Ionicons
                    name="close"
                    size={23}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.detalhe}>
                📍 {selecionada.endereco}
              </Text>

              <Text style={styles.detalhe}>
                {selecionada.cidade} - {selecionada.estado}
              </Text>

              <Text style={styles.detalhe}>
                🚚 Entrega:{" "}
                {selecionada.faz_entrega
                  ? "Disponível"
                  : "Não disponível"}
              </Text>

              <TouchableOpacity
                style={styles.botao}
                onPress={() => abrirRota(selecionada)}
              >
                <Ionicons
                  name="navigate"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBotao}>
                  Como chegar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FC",
  },
  header: {
    backgroundColor: "#1674C5",
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
  },
  subtitulo: {
    color: "#DBEEFF",
    fontSize: 12,
    marginTop: 3,
  },
  mapa: {
    flex: 1,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    gap: 14,
  },
  mensagem: {
    textAlign: "center",
    fontSize: 16,
    color: "#475569",
  },
  contador: {
    position: "absolute",
    top: 160,
    left: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 4,
  },
  textoContador: {
    fontSize: 13,
    fontWeight: "600",
    color: "#123B62",
  },
  card: {
    position: "absolute",
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    elevation: 7,
    gap: 8,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  iconeFarmacia: {
    backgroundColor: "#E8F3FF",
    padding: 12,
    borderRadius: 14,
  },
  cardTitulo: {
    flex: 1,
  },
  nome: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#123B62",
  },
  parceira: {
    fontSize: 12,
    color: "#168A55",
    marginTop: 3,
  },
  detalhe: {
    fontSize: 14,
    color: "#475569",
  },
  botao: {
    backgroundColor: "#1674C5",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 8,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
