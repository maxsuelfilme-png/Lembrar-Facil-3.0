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

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { cadastrarEFazerLogin, fazerLogin } from "../services/authService";

export default function Login() {
  const router = useRouter();

  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  function alternarModo() {
    setModoCadastro((atual) => !atual);
    setSenha("");
    setConfirmarSenha("");
  }

  async function entrar() {
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Digite o usuário e a senha.");
      return;
    }

    try {
      setCarregando(true);
      await fazerLogin(usuario.trim(), senha);
      router.replace("/");
    } catch (erro) {
      console.error("Erro no login:", erro);
      Alert.alert(
        "Não foi possível entrar",
        "Verifique seu usuário, senha e a conexão com o servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrar() {
    if (!nome.trim() || !usuario.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha nome, usuário e senha.");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não são iguais.");
      return;
    }

    try {
      setCarregando(true);
      await cadastrarEFazerLogin(usuario.trim(), nome.trim(), senha);
      router.replace("/");
    } catch (erro: any) {
      console.error("Erro no cadastro:", erro);
      // Mostra a mensagem real do servidor (usuário duplicado, senha fraca...)
      Alert.alert(
        "Não foi possível criar a conta",
        erro?.message || "Verifique os dados e a conexão com o servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  const acaoPrincipal = modoCadastro ? cadastrar : entrar;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>LembraFácil</Text>

          <Text style={styles.subtitle}>
            Cuidando da sua rotina com carinho
          </Text>

          <View style={styles.card}>
            <Text style={styles.title}>
              {modoCadastro ? "Criar conta" : "Entrar"}
            </Text>

            <Text style={styles.description}>
              {modoCadastro
                ? "Crie sua conta para começar a usar o aplicativo."
                : "Entre na sua conta para acessar seus medicamentos."}
            </Text>

            {modoCadastro && (
              <>
                <Text style={styles.label}>Nome completo</Text>
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Digite seu nome"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  editable={!carregando}
                />
              </>
            )}

            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              value={usuario}
              onChangeText={setUsuario}
              placeholder="Digite seu usuário"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!carregando}
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Digite sua senha"
              placeholderTextColor="#999"
              secureTextEntry
              editable={!carregando}
              onSubmitEditing={modoCadastro ? undefined : entrar}
            />

            {modoCadastro && (
              <>
                <Text style={styles.label}>Confirmar senha</Text>
                <TextInput
                  style={styles.input}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Repita a senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                  editable={!carregando}
                  onSubmitEditing={cadastrar}
                />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.loginButton,
                carregando && styles.loginButtonDisabled,
              ]}
              onPress={acaoPrincipal}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {modoCadastro ? "CRIAR CONTA" : "ENTRAR"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={alternarModo}
              disabled={carregando}
            >
              <Text style={styles.linkText}>
                {modoCadastro
                  ? "Já tenho conta. Entrar"
                  : "Não tenho conta. Criar agora"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>🔒 Seus dados ficam protegidos</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
  },

  logo: {
    fontSize: 42,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 17,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 35,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#222",
    textAlign: "center",
  },

  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#222",
    backgroundColor: "#F9FAFB",
    marginBottom: 20,
  },

  loginButton: {
    height: 58,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  linkButton: {
    marginTop: 18,
    paddingVertical: 8,
    alignItems: "center",
  },

  linkText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    marginTop: 25,
  },
});