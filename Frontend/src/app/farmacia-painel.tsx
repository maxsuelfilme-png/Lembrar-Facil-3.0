
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FarmaciaPainel() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Painel da Farmácia</Text>
        <Text style={styles.descricao}>
          Login autorizado! Em breve, você poderá
          gerenciar medicamentos, estoque e pedidos aqui.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 24,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0F2557",
    marginBottom: 12,
  },
  descricao: {
    fontSize: 15,
    lineHeight: 23,
    color: "#64748B",
  },
});
