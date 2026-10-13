
import React, { useEffect, useState } from "react";

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
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  fazerLogin,
  cadastrarEFazerLogin,
  logout,
} from "../services/authService";

export default function LoginIdosoScreen() {
  const router = useRouter();

  const [cadastro, setCadastro] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [preparandoLogin, setPreparandoLogin] = useState(true);

  // LIMPA A SESSÃO ANTERIOR AO ABRIR O LOGIN
  useEffect(() => {
    let ativo = true;

    async function iniciarLogin() {
      try {
        await logout();
      } catch (erro) {
        console.error(
          "Erro ao limpar sessão anterior:",
          erro
        );
      } finally {
        if (ativo) {
          setPreparandoLogin(false);
        }
      }
    }

    iniciarLogin();

    return () => {
      ativo = false;
    };
  }, []);

  // LOGIN OU CADASTRO
  async function entrar() {
    if (carregando || preparandoLogin) {
      return;
    }

    if (!usuario.trim() || !senha.trim()) {
      Alert.alert(
        "Atenção",
        "Informe seu usuário e sua senha."
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

    setCarregando(true);

    try {
      if (cadastro) {
        await cadastrarEFazerLogin(
          usuario.trim(),
          nome.trim(),
          senha
        );
      } else {
        await fazerLogin(
          usuario.trim(),
          senha
        );
      }

      setSenha("");
      router.replace("/idoso");
    } catch (erro: unknown) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível acessar sua conta.";

      Alert.alert(
        "Erro de autenticação",
        mensagem
      );
    } finally {
      setCarregando(false);
    }
  }

  // ALTERNAR ENTRE LOGIN E CADASTRO
  function alternarCadastro() {
    setCadastro((anterior) => !anterior);
    setSenha("");
    setMostrarSenha(false);
  }

  // AGUARDAR LIMPEZA DA SESSÃO
  if (preparandoLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.carregamentoInicial}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.carregamentoTexto}>
            Preparando seu acesso...
          </Text>
        </View>
      </SafeAreaView>
    );
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
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* VOLTAR À TELA INICIAL */}
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => router.replace("/")}
            accessibilityLabel="Voltar à tela inicial"
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#1E40AF"
            />

            <Text style={styles.voltarTexto}>
              Voltar
            </Text>
          </TouchableOpacity>

          {/* LOGOTIPO */}
          <View style={styles.cabecalho}>
            <View style={styles.logoIcone}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={44}
                color="#2563EB"
              />
            </View>

            <Text style={styles.logoTexto}>
              <Text style={styles.logoAzul}>
                Lembra
              </Text>

              <Text style={styles.logoVerde}>
                Fácil
              </Text>
            </Text>

            <Text style={styles.slogan}>
              Cuidando da sua rotina com carinho
            </Text>
          </View>

          {/* IDENTIFICAÇÃO DO PERFIL */}
          <View style={styles.perfil}>
            <View style={styles.perfilIcone}>
              <Ionicons
                name="person-outline"
                size={34}
                color="#2563EB"
              />
            </View>

            <Text style={styles.perfilTitulo}>
              Área do Idoso
            </Text>

            <Text style={styles.perfilDescricao}>
              Seus medicamentos, receitas e horários
              em um só lugar.
            </Text>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formulario}>
            <Text style={styles.formTitulo}>
              {cadastro
                ? "Criar minha conta"
                : "Entrar na minha conta"}
            </Text>

            <Text style={styles.formSubtitulo}>
              {cadastro
                ? "Preencha seus dados para começar."
                : "Informe seus dados para continuar."}
            </Text>

            {/* NOME NO CADASTRO */}
            {cadastro && (
              <>
                <Text style={styles.label}>
                  Nome completo
                </Text>

                <View style={styles.campo}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color="#64748B"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu nome"
                    placeholderTextColor="#94A3B8"
                    value={nome}
                    onChangeText={setNome}
                    autoCapitalize="words"
                    editable={!carregando}
                  />
                </View>
              </>
            )}

            {/* USUÁRIO */}
            <Text style={styles.label}>
              Usuário
            </Text>

            <View style={styles.campo}>
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
                editable={!carregando}
              />
            </View>

            {/* SENHA */}
            <Text style={styles.label}>
              Senha
            </Text>

            <View style={styles.campo}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
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
                editable={!carregando}
                onSubmitEditing={entrar}
              />

              <TouchableOpacity
                onPress={() =>
                  setMostrarSenha(!mostrarSenha)
                }
                accessibilityLabel={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                <Ionicons
                  name={
                    mostrarSenha
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={23}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* BOTÃO ENTRAR */}
            <TouchableOpacity
              style={[
                styles.botaoEntrar,
                carregando &&
                  styles.botaoDesativado,
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
                  <Text style={styles.botaoTexto}>
                    {cadastro
                      ? "Criar conta"
                      : "Entrar"}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={22}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>

            {/* ALTERNAR CADASTRO */}
            <TouchableOpacity
              onPress={alternarCadastro}
              disabled={carregando}
              style={styles.linkArea}
            >
              <Text style={styles.linkTexto}>
                {cadastro
                  ? "Já tenho uma conta. Entrar"
                  : "Ainda não tenho conta. Cadastrar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SEGURANÇA */}
          <View style={styles.seguranca}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#16A34A"
            />

            <Text style={styles.segurancaTexto}>
              Seus dados são protegidos por autenticação.
            </Text>
          </View>

          {/* RODAPÉ */}
          <Text style={styles.rodape}>
            LembraFácil © 2026
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#F7FAFF",
  },

  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 35,
  },

  carregamentoInicial: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  carregamentoTexto: {
    marginTop: 15,
    fontSize: 15,
    color: "#64748B",
  },

  voltar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 8,
  },

  voltarTexto: {
    color: "#1E40AF",
    fontSize: 15,
    fontWeight: "700",
  },

  cabecalho: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  logoIcone: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: "#E8F1FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  logoTexto: {
    fontSize: 33,
    fontWeight: "900",
  },

  logoAzul: {
    color: "#2563EB",
  },

  logoVerde: {
    color: "#16A34A",
  },

  slogan: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 5,
  },

  perfil: {
    alignItems: "center",
    backgroundColor: "#EAF4FF",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },

  perfilIcone: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#D6E9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  perfilTitulo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#153D76",
  },

  perfilDescricao: {
    fontSize: 14,
    color: "#52677E",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 7,
  },

  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    elevation: 3,
  },

  formTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#153D76",
    marginBottom: 5,
  },

  formSubtitulo: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 15,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 13,
    marginBottom: 8,
  },

  campo: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 13,
    minHeight: 55,
    gap: 10,
  },

  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 16,
    paddingVertical: 12,
  },

  botaoEntrar: {
    backgroundColor: "#2563EB",
    borderRadius: 15,
    minHeight: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 25,
  },

  botaoDesativado: {
    opacity: 0.65,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  linkArea: {
    paddingVertical: 16,
    alignItems: "center",
  },

  linkTexto: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  seguranca: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 25,
  },

  segurancaTexto: {
    fontSize: 12,
    color: "#64748B",
    flexShrink: 1,
  },

  rodape: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 25,
  },
});
