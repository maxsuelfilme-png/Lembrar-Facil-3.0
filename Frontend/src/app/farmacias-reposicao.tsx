
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function FarmaciasReposicaoScreen() {
  const router = useRouter();

  const [medicamento, setMedicamento] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [diasRestantes, setDiasRestantes] = useState("");

  function continuar() {
    const qtd = Number(quantidade);
    const dias = Number(diasRestantes);

    if (!medicamento.trim()) {
      Alert.alert("Atenção", "Informe o nome do medicamento.");
      return;
    }

    if (
      !quantidade.trim() ||
      !Number.isInteger(qtd) ||
      qtd < 0 ||
      !diasRestantes.trim() ||
      !Number.isInteger(dias) ||
      dias < 0
    ) {
      Alert.alert(
        "Atenção",
        "Informe quantidades e dias restantes válidos."
      );
      return;
    }

    Alert.alert(
      "Dados preenchidos",
      "As informações estão prontas para a próxima etapa. A solicitação ainda não foi enviada ao cuidador.",
      [
        { text: "Continuar editando" },
        {
          text: "Buscar farmácias",
          onPress: () => router.push("/farmacias-busca"),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2563EB" />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons
            name="medical-outline"
            size={40}
            color="#FFFFFF"
          />
          <Text style={styles.titulo}>
            Reposição de medicamentos
          </Text>
          <Text style={styles.subtitulo}>
            Acompanhe os medicamentos que estão acabando.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            Informações do medicamento
          </Text>

          <Text style={styles.label}>Nome do medicamento</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Paracetamol 500mg"
            placeholderTextColor="#94A3B8"
            value={medicamento}
            onChangeText={setMedicamento}
          />

          <Text style={styles.label}>
            Quantidade restante
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 5 comprimidos"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={quantidade}
            onChangeText={setQuantidade}
          />

          <Text style={styles.label}>
            Dias restantes de tratamento
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 3"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={diasRestantes}
            onChangeText={setDiasRestantes}
          />

          <TouchableOpacity
            style={styles.botao}
            onPress={continuar}
          >
            <Ionicons
              name="search-outline"
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.botaoTexto}>
              Continuar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aviso}>
          <Ionicons
            name="shield-checkmark-outline"
            size={27}
            color="#15803D"
          />
          <Text style={styles.avisoTexto}>
            A solicitação de reposição dependerá da
            autorização do cuidador. Nenhuma compra será
            realizada automaticamente.
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
    padding: 20,
    paddingBottom: 40,
  },
  voltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  voltarTexto: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 25,
    marginBottom: 22,
    gap: 10,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  subtitulo: {
    fontSize: 14,
    lineHeight: 21,
    color: "#EAF3FF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    elevation: 3,
  },
  cardTitulo: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F2557",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 13,
    padding: 14,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 20,
  },
  botao: {
    backgroundColor: "#2563EB",
    padding: 17,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  aviso: {
    flexDirection: "row",
    backgroundColor: "#EAF9F0",
    borderRadius: 18,
    padding: 18,
    marginTop: 22,
    gap: 12,
    alignItems: "flex-start",
  },
  avisoTexto: {
    flex: 1,
    color: "#166534",
    fontSize: 13,
    lineHeight: 20,
  },
});
