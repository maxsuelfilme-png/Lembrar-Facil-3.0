
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { fazerLogin, logout } from "../services/authService";
import { buscarMinhaFarmacia } from "../services/farmaciasService";

export default function FarmaciaLogin() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrar() {
    if (!username.trim() || !password) {
      Alert.alert("Atenção", "Informe seu usuário e senha.");
      return;
    }

    setCarregando(true);

    try {
      // Usa o login JWT já existente no LembraFácil.
      await fazerLogin(username, password);

      // Confirma se o usuário é uma farmácia aprovada.
      await buscarMinhaFarmacia();

      router.replace("/farmacia-painel");
    } catch (erro) {
      // Evita manter a sessão de um usuário que
      // não conseguiu acessar o painel da farmácia.
      await logout();

      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível entrar.";

      Alert.alert("Não foi possível acessar", mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.logoIcon}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={48}
              color="#7C3AED"
            />
          </View>

          <Text style={styles.titulo}>Área da Farmácia</Text>
          <Text style={styles.subtitulo}>
            Entre para gerenciar seus produtos e solicitações
            no LembraFácil.
          </Text>

          <View style={styles.formulario}>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu usuário"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              editable={!carregando}
            />

            <Text style={styles.label}>Senha</Text>
            <View style={styles.senhaContainer}>
              <TextInput
                style={styles.senhaInput}
                placeholder="Digite sua senha"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!mostrarSenha}
                value={password}
                onChangeText={setPassword}
                editable={!carregando}
              />

              <TouchableOpacity
                onPress={() => setMostrarSenha(!mostrarSenha)}
              >
                <Ionicons
                  name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                  size={23}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.botaoEntrar, carregando && styles.desabilitado]}
              onPress={entrar}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.textoEntrar}>Entrar</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={21}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cadastroCard}>
            <Text style={styles.cadastroTitulo}>
              Sua farmácia ainda não é parceira?
            </Text>
            <Text style={styles.cadastroDescricao}>
              Solicite o cadastro e aguarde a aprovação
              para acessar os serviços.
            </Text>

            <TouchableOpacity
              style={styles.botaoCadastro}
              onPress={() => router.push("/farmacia-cadastro")}
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#7C3AED"
              />
              <Text style={styles.textoCadastro}>
                Cadastrar minha farmácia
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.rodape}>
            LembraFácil — Farmácias Parceiras 💙
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBFF" },
  content: { padding: 22, paddingBottom: 40, flexGrow: 1 },
  voltar: {
    width: 45, height: 45, borderRadius: 15,
    backgroundColor: "#EAF3FF",
    justifyContent: "center", alignItems: "center",
    marginBottom: 28,
  },
  logoIcon: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: "#F1E9FF",
    justifyContent: "center", alignItems: "center",
    alignSelf: "center", marginBottom: 18,
  },
  titulo: {
    fontSize: 29, fontWeight: "900",
    color: "#0F2557", textAlign: "center",
  },
  subtitulo: {
    fontSize: 14, lineHeight: 21,
    color: "#64748B", textAlign: "center",
    marginTop: 10, marginBottom: 30,
  },
  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24, padding: 20, elevation: 3,
  },
  label: {
    color: "#0F2557", fontWeight: "800",
    fontSize: 14, marginBottom: 8,
  },
  input: {
    height: 54, borderWidth: 1,
    borderColor: "#E2E8F0", borderRadius: 15,
    paddingHorizontal: 15, fontSize: 15,
    color: "#0F2557", marginBottom: 20,
    backgroundColor: "#F8FAFC",
  },
  senhaContainer: {
    height: 54, borderWidth: 1,
    borderColor: "#E2E8F0", borderRadius: 15,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 15, backgroundColor: "#F8FAFC",
  },
  senhaInput: {
    flex: 1, fontSize: 15, color: "#0F2557",
  },
  botaoEntrar: {
    backgroundColor: "#7C3AED",
    borderRadius: 16, height: 55,
    flexDirection: "row",
    justifyContent: "center", alignItems: "center",
    gap: 10, marginTop: 25,
  },
  desabilitado: { opacity: 0.6 },
  textoEntrar: {
    color: "#FFFFFF", fontSize: 17, fontWeight: "900",
  },
  cadastroCard: {
    backgroundColor: "#F1E9FF",
    borderRadius: 23, padding: 20, marginTop: 25,
  },
  cadastroTitulo: {
    color: "#0F2557", fontSize: 17, fontWeight: "900",
  },
  cadastroDescricao: {
    color: "#64748B", fontSize: 13,
    lineHeight: 19, marginTop: 7,
  },
  botaoCadastro: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15, padding: 15,
    flexDirection: "row", justifyContent: "center",
    alignItems: "center", gap: 8, marginTop: 17,
  },
  textoCadastro: {
    color: "#7C3AED", fontWeight: "900", fontSize: 14,
  },
  rodape: {
    textAlign: "center", color: "#64748B",
    fontSize: 12, marginTop: 30,
  },
});
