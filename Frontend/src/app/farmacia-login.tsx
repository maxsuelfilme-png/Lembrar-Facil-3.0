
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  fazerLoginFarmacia,
  logoutFarmacia,
} from "../services/authService";

import { buscarMinhaFarmacia } from "../services/farmaciasService";

export default function FarmaciaLoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // ======================================================
  // LOGIN DA FARMÁCIA
  // ======================================================

  async function entrar() {
    if (carregando) {
      return;
    }

    if (!username.trim() || !password) {
      Alert.alert(
        "Atenção",
        "Informe seu usuário e senha."
      );
      return;
    }

    setCarregando(true);

    try {
      // Login exclusivo da farmácia
      await fazerLoginFarmacia(
        username.trim(),
        password
      );

      // Confere cadastro e aprovação da farmácia
      await buscarMinhaFarmacia();

      // Acessa o painel
      router.replace("/farmacia-painel");
    } catch (erro) {
      await logoutFarmacia();

      Alert.alert(
        "Não foi possível acessar",
        erro instanceof Error
          ? erro.message
          : "Não foi possível entrar."
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
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#176B4D"
            />
          </TouchableOpacity>

          <View style={styles.iconeContainer}>
            <Ionicons
              name="medical"
              size={45}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.titulo}>
            Acesso da Farmácia
          </Text>

          <Text style={styles.subtitulo}>
            Entre com sua conta para gerenciar
            os produtos da sua farmácia.
          </Text>

          <View style={styles.formulario}>
            <Text style={styles.label}>
              Usuário
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={21}
                color="#718096"
              />

              <TextInput
                style={styles.input}
                placeholder="Digite seu usuário"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando}
              />
            </View>

            <Text style={styles.label}>
              Senha
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={21}
                color="#718096"
              />

              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                editable={!carregando}
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
                  color="#718096"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.botaoEntrar,
                carregando && styles.botaoDesabilitado,
              ]}
              onPress={entrar}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="log-in-outline"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text style={styles.textoBotao}>
                    Entrar
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rodape}>
            <Text style={styles.textoRodape}>
              Ainda não possui uma conta?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push("/farmacia-cadastro")
              }
            >
              <Text style={styles.linkCadastro}>
                Cadastre sua farmácia
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.marca}>
            LembraFácil
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#F5FAF7",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 35,
  },

  voltar: {
    width: 45,
    height: 45,
    justifyContent: "center",
  },

  iconeContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#198754",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 25,
    marginBottom: 20,
    elevation: 4,
  },

  titulo: {
    fontSize: 27,
    fontWeight: "800",
    color: "#174B37",
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 35,
    lineHeight: 23,
  },

  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    elevation: 3,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 9,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCE6E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    marginBottom: 22,
    backgroundColor: "#FAFCFB",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    marginLeft: 10,
  },

  botaoEntrar: {
    height: 56,
    borderRadius: 13,
    backgroundColor: "#198754",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },

  botaoDesabilitado: {
    opacity: 0.65,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  rodape: {
    alignItems: "center",
    marginTop: 32,
  },

  textoRodape: {
    fontSize: 14,
    color: "#64748B",
  },

  linkCadastro: {
    fontSize: 16,
    fontWeight: "700",
    color: "#198754",
    marginTop: 10,
  },

  marca: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: "#198754",
    marginTop: 45,
  },
});
