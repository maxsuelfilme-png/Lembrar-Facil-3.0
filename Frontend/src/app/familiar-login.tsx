
import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  fazerLogin,
  cadastrarEFazerLogin,
} from "../services/authService";

export default function FamiliarLoginScreen() {
  const router = useRouter();

  const [cadastro, setCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o usuário e a senha."
      );
      return;
    }

    if (cadastro && !nome.trim()) {
      Alert.alert(
        "Atenção",
        "Informe seu nome completo."
      );
      return;
    }

    try {
      setCarregando(true);

      if (cadastro) {
        await cadastrarEFazerLogin(
          usuario.trim(),
          nome.trim(),
          senha
        );
      } else {
        await fazerLogin(usuario.trim(), senha);
      }

      router.replace("/familia");
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível realizar a operação.";

      Alert.alert(
        cadastro ? "Erro no cadastro" : "Erro no login",
        mensagem
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => router.replace("/")}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#166534"
            />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons
                name="people"
                size={52}
                color="#16A34A"
              />
            </View>

            <Text style={styles.marca}>
              LembraFácil
            </Text>

            <Text style={styles.slogan}>
              Cuidando de quem você ama
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tituloContainer}>
              <Ionicons
                name="heart"
                size={28}
                color="#16A34A"
              />

              <Text style={styles.titulo}>
                {cadastro
                  ? "Cadastro do Familiar"
                  : "Login do Familiar"}
              </Text>
            </View>

            <Text style={styles.descricao}>
              {cadastro
                ? "Crie sua conta para acompanhar os cuidados."
                : "Entre com sua conta para acessar a área da família."}
            </Text>

            {cadastro && (
              <>
                <Text style={styles.label}>
                  Nome completo
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={21}
                    color="#64748B"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome completo"
                    placeholderTextColor="#94A3B8"
                    value={nome}
                    onChangeText={setNome}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <Text style={styles.label}>
              Usuário
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Digite seu usuário"
                placeholderTextColor="#94A3B8"
                value={usuario}
                onChangeText={setUsuario}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.label}>
              Senha
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#94A3B8"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
              />

              <TouchableOpacity
                onPress={() =>
                  setMostrarSenha(!mostrarSenha)
                }
              >
                <Ionicons
                  name={
                    mostrarSenha
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={22}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.botao,
                carregando && styles.desabilitado,
              ]}
              onPress={entrar}
              disabled={carregando}
              activeOpacity={0.85}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={
                      cadastro
                        ? "person-add-outline"
                        : "log-in-outline"
                    }
                    size={23}
                    color="#FFFFFF"
                  />

                  <Text style={styles.botaoTexto}>
                    {cadastro
                      ? "CRIAR MINHA CONTA"
                      : "ENTRAR COMO FAMILIAR"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alternar}
              onPress={() => {
                setCadastro(!cadastro);
                setSenha("");
              }}
              disabled={carregando}
            >
              <Text style={styles.alternarTexto}>
                {cadastro
                  ? "Já possui uma conta? "
                  : "Ainda não possui uma conta? "}
                <Text style={styles.alternarDestaque}>
                  {cadastro
                    ? "Entrar"
                    : "Cadastre-se"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.seguranca}>
            <Ionicons
              name="shield-checkmark"
              size={22}
              color="#16A34A"
            />

            <Text style={styles.segurancaTexto}>
              Acesso protegido para sua família
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5FBF7",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
  },
  voltar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#E4F7E9",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 25,
  },
  logo: {
    width: 94,
    height: 94,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  marca: {
    fontSize: 33,
    fontWeight: "900",
    color: "#14532D",
  },
  slogan: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 23,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    elevation: 4,
  },
  tituloContainer: {
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#14532D",
    textAlign: "center",
  },
  descricao: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 58,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 18,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingVertical: 12,
  },
  botao: {
    minHeight: 60,
    backgroundColor: "#16A34A",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 7,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  desabilitado: {
    opacity: 0.6,
  },
  alternar: {
    marginTop: 22,
    alignItems: "center",
  },
  alternarTexto: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
  alternarDestaque: {
    color: "#16A34A",
    fontWeight: "900",
  },
  seguranca: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  segurancaTexto: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
  },
});
