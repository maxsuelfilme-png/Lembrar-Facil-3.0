import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  FarmaciaMapa,
  listarFarmaciasMapa,
} from "../services/farmaciasService";

export default function FarmaciasMapaScreen() {
  const router = useRouter();

  const [farmacias, setFarmacias] = useState<FarmaciaMapa[]>([]);
  const [selecionada, setSelecionada] = useState<FarmaciaMapa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarFarmaciasMapa();
        setFarmacias(dados);
      } catch {
        setErro("Não foi possível carregar o mapa das farmácias.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  function abrirRota(farmacia: FarmaciaMapa) {
    const latitude = Number(farmacia.latitude);
    const longitude = Number(farmacia.longitude);

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${latitude},${longitude}`;

    Linking.openURL(url);
  }

  const pontos = farmacias.filter(
    (f) =>
      Number.isFinite(Number(f.latitude)) &&
      Number.isFinite(Number(f.longitude))
  );

  const primeira = pontos[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.titulo}>Mapa de Farmácias</Text>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#1674C5" />
          <Text>Carregando farmácias...</Text>
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Text>{erro}</Text>
        </View>
      ) : !primeira ? (
        <View style={styles.centro}>
          <Ionicons name="location-outline" size={48} color="#1674C5" />
          <Text style={styles.vazio}>
            Nenhuma farmácia com localização cadastrada.
          </Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.mapa}
            initialRegion={{
              latitude: Number(primeira.latitude),
              longitude: Number(primeira.longitude),
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
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
                onPress={() => setSelecionada(farmacia)}
                pinColor="#1674C5"
              />
            ))}
          </MapView>

          {selecionada && (
            <View style={styles.card}>
              <Text style={styles.nome}>{selecionada.nome}</Text>

              <Text style={styles.detalhe}>
                📍 {selecionada.endereco}
              </Text>

              <Text style={styles.detalhe}>
                {selecionada.cidade} - {selecionada.estado}
              </Text>

              <Text style={styles.detalhe}>
                🚚 Entrega:{" "}
                {selecionada.faz_entrega ? "Disponível" : "Não disponível"}
              </Text>

              <TouchableOpacity
                style={styles.botao}
                onPress={() => abrirRota(selecionada)}
              >
                <Ionicons name="navigate" size={20} color="#ffffff" />
                <Text style={styles.textoBotao}>Como chegar</Text>
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
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "bold",
  },
  mapa: {
    flex: 1,
  },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    gap: 12,
  },
  vazio: {
    textAlign: "center",
    fontSize: 16,
    color: "#555555",
  },
  card: {
    position: "absolute",
    bottom: 25,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 18,
    elevation: 5,
    gap: 8,
  },
  nome: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#123B62",
  },
  detalhe: {
    fontSize: 14,
    color: "#555555",
  },
  botao: {
    backgroundColor: "#1674C5",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  textoBotao: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});