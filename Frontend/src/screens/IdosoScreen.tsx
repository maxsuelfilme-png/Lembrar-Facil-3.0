
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  API_URL,
  iniciarSessaoIdoso,
  obterTokenValidoIdoso,
  diagnosticarSessaoIdoso,
  limparSessaoAntigaIdoso,
} from "../services/authService";

import {
  gerarCodigoVinculoIdoso,
} from "../services/vinculosService";

export default function IdosoScreen() {
  const router = useRouter();

  const [preparando, setPreparando] = useState(true);
  const [erroSessao, setErroSessao] = useState<string | null>(null);

  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [codigoVinculo, setCodigoVinculo] = useState("");
  const [expiracaoCodigo, setExpiracaoCodigo] = useState("");

  const [enviandoSOS, setEnviandoSOS] = useState(false);
  const enviandoSOSRef = useRef(false);

  // ======================================================
  // PREPARAR SESSÃO DO IDOSO
  // ======================================================

  async function prepararSessao() {
    try {
      setPreparando(true);
      setErroSessao(null);

      await diagnosticarSessaoIdoso();
      await iniciarSessaoIdoso();

      console.log("Sessão do idoso iniciada com sucesso.");
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível conectar ao servidor.";

      console.error("Erro na sessão do idoso:", mensagem);
      setErroSessao(mensagem);
    } finally {
      setPreparando(false);
    }
  }

  useEffect(() => {
    void prepararSessao();
  }, []);

  // ======================================================
  // REINICIAR CADASTRO ANTIGO DE TESTE
  // ======================================================

  function confirmarReinicioTeste() {
    Alert.alert(
      "Reiniciar cadastro de teste",
      "Use somente se o paciente antigo foi excluído do Railway. Isso remove a sessão local e cria um novo paciente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar teste",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                setPreparando(true);
                setCodigoVinculo("");
                setExpiracaoCodigo("");

                await limparSessaoAntigaIdoso();
                await prepararSessao();
              } catch (erro) {
                setErroSessao(
                  erro instanceof Error
                    ? erro.message
                    : "Não foi possível reiniciar o teste."
                );
              } finally {
                setPreparando(false);
              }
            })();
          },
        },
      ]
    );
  }

  // ======================================================
  // GERAR CÓDIGO DE VÍNCULO
  // ======================================================

  async function gerarCodigo() {
    if (preparando || gerandoCodigo || erroSessao) {
      return;
    }

    try {
      setGerandoCodigo(true);
      setCodigoVinculo("");
      setExpiracaoCodigo("");

      const resposta = await gerarCodigoVinculoIdoso();

      setCodigoVinculo(resposta.codigo);

      if (resposta.expira_em) {
        setExpiracaoCodigo(resposta.expira_em);
      }

      Alert.alert(
        "Código gerado! 💚",
        "Informe esse código na tela Família, na opção VINCULAR IDOSO. O código é válido por 10 minutos."
      );
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o código.";

      console.error("Erro ao gerar vínculo:", mensagem);
      Alert.alert("Erro ao gerar código", mensagem);
    } finally {
      setGerandoCodigo(false);
    }
  }

  // ======================================================
  // NAVEGAÇÃO
  // ======================================================

  function abrirArea(
    destino: "/receita" | "/medicamentos" | "/rotina"
  ) {
    if (preparando || erroSessao) {
      Alert.alert(
        "Acesso indisponível",
        erroSessao || "Aguarde a conexão com o servidor."
      );
      return;
    }

    if (destino === "/medicamentos") {
      router.push({
        pathname: "/medicamentos",
        params: { perfil: "idoso" },
      });
      return;
    }

    router.push(destino);
  }

  // ======================================================
  // ENVIAR SOS PELO BACKEND
  // ======================================================

  async function enviarSOSWhatsApp() {
    if (enviandoSOSRef.current) return;

    enviandoSOSRef.current = true;
    setEnviandoSOS(true);

    try {
      let token = await obterTokenValidoIdoso();

      if (!token) {
        token = await iniciarSessaoIdoso();
      }

      if (!token) {
        throw new Error(
          "Não foi possível autenticar a sessão do idoso."
        );
      }

      const url =
        `${API_URL.replace(/\/+$/, "")}/pacientes/sos/`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const resultado = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          resultado?.detail ||
            `Não foi possível solicitar o SOS. Erro HTTP ${response.status}.`
        );
      }

      console.log(
        "SOS: solicitação aceita pelo backend.",
        resultado?.detail || ""
      );

      Alert.alert(
        "SOS solicitado",
        resultado?.detail ||
          "O pedido de ajuda foi enviado ao servidor. A entrega da mensagem ainda não foi confirmada."
      );
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível solicitar o SOS.";

      console.error("Erro ao solicitar SOS:", mensagem);

      Alert.alert(
        "Não foi possível enviar o SOS",
        `${mensagem}\n\nEm uma emergência, ligue para 192.`
      );
    } finally {
      enviandoSOSRef.current = false;
      setEnviandoSOS(false);
    }
  }

  // ======================================================
  // ABRIR DISCADOR DO SAMU
  // ======================================================

  async function ligarSAMU() {
    try {
      await Linking.openURL("tel:192");
    } catch (erro) {
      console.error("Erro ao abrir o telefone:", erro);

      Alert.alert(
        "SAMU - 192",
        "Não foi possível abrir o discador. Ligue para 192 manualmente."
      );
    }
  }

  // ======================================================
  // CONFIRMAR SOS
  // ======================================================

  function confirmarSOS() {
    Alert.alert(
      "🚨 SOS - Emergência",
      "Deseja avisar seu familiar pelo WhatsApp e abrir a ligação para o SAMU (192)?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "SIM, PRECISO DE AJUDA",
          onPress: () => {
            void enviarSOSWhatsApp();
            void ligarSAMU();
          },
        },
      ]
    );
  }

  // ======================================================
  // INTERFACE
  // ======================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BARRA SUPERIOR */}

        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.voltarButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#2563EB"
            />
            <Text style={styles.voltar}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.settingsButton}>
            <Ionicons
              name="settings-outline"
              size={26}
              color="#64748B"
            />
          </View>
        </View>

        {/* BOAS-VINDAS */}

        <View style={styles.welcome}>
          <Text style={styles.title}>Olá! 👋</Text>
          <Text style={styles.subtitle}>
            Vamos cuidar da sua rotina.
          </Text>
        </View>

        {/* CARREGANDO */}

        {preparando && (
          <View style={styles.statusBox}>
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />
            <Text style={styles.statusText}>
              Preparando seu acesso...
            </Text>
          </View>
        )}

        {/* ERRO DA SESSÃO */}

        {erroSessao && (
          <View style={styles.erroBox}>
            <Ionicons
              name="alert-circle-outline"
              size={30}
              color="#DC2626"
            />

            <Text style={styles.erroTexto}>
              {erroSessao}
            </Text>

            <TouchableOpacity
              style={styles.tentarButton}
              onPress={() => void prepararSessao()}
            >
              <Text style={styles.tentarTexto}>
                Tentar novamente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reiniciarButton}
              onPress={confirmarReinicioTeste}
              disabled={preparando}
            >
              <Ionicons
                name="refresh-circle-outline"
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.reiniciarTexto}>
                Reiniciar cadastro de teste
              </Text>
            </TouchableOpacity>

            <Text style={styles.avisoTeste}>
              Use apenas se o cadastro antigo já foi
              excluído do Railway.
            </Text>
          </View>
        )}

        {/* LER RECEITA */}

        <TouchableOpacity
          style={[styles.card, styles.receitaCard]}
          activeOpacity={0.85}
          disabled={preparando || !!erroSessao}
          onPress={() => abrirArea("/receita")}
        >
          <View style={[styles.iconBox, styles.receitaIcon]}>
            <Ionicons
              name="camera"
              size={39}
              color="#2563EB"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Ler receita
            </Text>
            <Text style={styles.cardText}>
              Tire uma foto da sua receita para cadastrar
              os medicamentos
            </Text>
          </View>

          <View style={[styles.arrow, styles.arrowBlue]}>
            <Ionicons
              name="chevron-forward"
              size={27}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* MEUS MEDICAMENTOS */}

        <TouchableOpacity
          style={[styles.card, styles.medicamentoCard]}
          activeOpacity={0.85}
          disabled={preparando || !!erroSessao}
          onPress={() => abrirArea("/medicamentos")}
        >
          <View
            style={[styles.iconBox, styles.medicamentoIcon]}
          >
            <MaterialCommunityIcons
              name="pill"
              size={42}
              color="#EF4444"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Meus medicamentos
            </Text>
            <Text style={styles.cardText}>
              Veja seus medicamentos e horários
            </Text>
          </View>

          <View style={[styles.arrow, styles.arrowRed]}>
            <Ionicons
              name="chevron-forward"
              size={27}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* MINHA ROTINA */}

        <TouchableOpacity
          style={[styles.card, styles.rotinaCard]}
          activeOpacity={0.85}
          disabled={preparando || !!erroSessao}
          onPress={() => abrirArea("/rotina")}
        >
          <View style={[styles.iconBox, styles.rotinaIcon]}>
            <Ionicons
              name="notifications"
              size={39}
              color="#16A34A"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Minha rotina
            </Text>
            <Text style={styles.cardText}>
              Confira o que precisa fazer hoje
            </Text>
          </View>

          <View style={[styles.arrow, styles.arrowGreen]}>
            <Ionicons
              name="chevron-forward"
              size={27}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* VINCULAR FAMILIAR */}

        <View style={styles.vinculoCard}>
          <View style={styles.vinculoCabecalho}>
            <View style={styles.vinculoIconBox}>
              <Ionicons
                name="people"
                size={32}
                color="#2563EB"
              />
            </View>

            <View style={styles.vinculoConteudo}>
              <Text style={styles.vinculoTitulo}>
                Vincular meu familiar
              </Text>

              <Text style={styles.vinculoDescricao}>
                Conecte seu familiar para que ele receba
                alertas e acompanhe seus medicamentos.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.gerarCodigoButton,
              (preparando || gerandoCodigo || !!erroSessao) &&
                styles.botaoDesabilitado,
            ]}
            disabled={
              preparando || gerandoCodigo || !!erroSessao
            }
            onPress={() => void gerarCodigo()}
          >
            {gerandoCodigo ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={styles.gerarCodigoTexto}>
                  GERAR CÓDIGO DO FAMILIAR
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!!codigoVinculo && (
            <View style={styles.codigoBox}>
              <Text style={styles.codigoLabel}>
                Seu código de vinculação
              </Text>

              <Text
                style={styles.codigoTexto}
                selectable
              >
                {codigoVinculo}
              </Text>

              <Text style={styles.codigoAjuda}>
                Copie este código e informe na tela
                Família, na opção VINCULAR IDOSO.
              </Text>

              <View style={styles.validadeBox}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color="#B45309"
                />
                <Text style={styles.validadeTexto}>
                  Válido por 10 minutos
                </Text>
              </View>

              {!!expiracaoCodigo && (
                <Text style={styles.expiracaoTexto}>
                  Expiração informada pelo servidor:{" "}
                  {expiracaoCodigo}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* SOS */}

        <TouchableOpacity
          style={styles.sos}
          activeOpacity={0.85}
          onPress={confirmarSOS}
          accessibilityRole="button"
          accessibilityLabel="SOS, preciso de ajuda"
          accessibilityHint="Solicita alerta ao familiar e abre o discador do SAMU 192"
        >
          <View style={styles.sosIconBox}>
            {enviandoSOS ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="large"
              />
            ) : (
              <Text style={styles.sosIcon}>SOS</Text>
            )}
          </View>

          <View style={styles.sosContent}>
            <Text style={styles.sosTitle}>
              PRECISO DE AJUDA
            </Text>
            <Text style={styles.sosText}>
              Avisar familiar e ligar SAMU 192
            </Text>
          </View>

          <View style={styles.sosArrow}>
            <Ionicons
              name="chevron-forward"
              size={28}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* RODAPÉ */}

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#16A34A"
            />
            <Text style={styles.footerText}>
              Simples{"\n"}de usar
            </Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerItem}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color="#16A34A"
            />
            <Text style={styles.footerText}>
              Cuidando{"\n"}de você
            </Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerItem}>
            <Ionicons
              name="heart"
              size={24}
              color="#16A34A"
            />
            <Text style={styles.footerText}>
              Sempre{"\n"}com você
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 35,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  voltarButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  voltar: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "800",
    marginLeft: 6,
  },

  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  welcome: {
    marginBottom: 28,
  },

  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#0F2557",
  },

  subtitle: {
    fontSize: 21,
    lineHeight: 28,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 6,
  },

  statusBox: {
    backgroundColor: "#EAF4FF",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 18,
  },

  statusText: {
    marginTop: 12,
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "700",
  },

  erroBox: {
    backgroundColor: "#FFF1F2",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 18,
  },

  erroTexto: {
    color: "#BE123C",
    fontSize: 15,
    textAlign: "center",
    marginVertical: 12,
  },

  tentarButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },

  tentarTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  reiniciarButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  reiniciarTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 8,
  },

  avisoTeste: {
    fontSize: 12,
    color: "#9F1239",
    textAlign: "center",
    marginTop: 10,
  },

  card: {
    minHeight: 128,
    borderRadius: 25,
    padding: 17,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },

  receitaCard: {
    backgroundColor: "#EAF4FF",
  },

  medicamentoCard: {
    backgroundColor: "#FFF0F0",
  },

  rotinaCard: {
    backgroundColor: "#ECFDF3",
  },

  iconBox: {
    width: 74,
    height: 74,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  receitaIcon: {
    backgroundColor: "#D9EBFF",
  },

  medicamentoIcon: {
    backgroundColor: "#FFE0E0",
  },

  rotinaIcon: {
    backgroundColor: "#D9F7E4",
  },

  cardContent: {
    flex: 1,
    paddingRight: 8,
  },

  cardTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    color: "#0F2557",
  },

  cardText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "500",
  },

  arrow: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  arrowBlue: {
    backgroundColor: "#2563EB",
  },

  arrowRed: {
    backgroundColor: "#EF4444",
  },

  arrowGreen: {
    backgroundColor: "#16A34A",
  },

  vinculoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 19,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    elevation: 3,
  },

  vinculoCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  vinculoIconBox: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  vinculoConteudo: {
    flex: 1,
  },

  vinculoTitulo: {
    color: "#0F2557",
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 5,
  },

  vinculoDescricao: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },

  gerarCodigoButton: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  gerarCodigoTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 9,
  },

  botaoDesabilitado: {
    opacity: 0.5,
  },

  codigoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },

  codigoLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E40AF",
  },

  codigoTexto: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F2557",
    letterSpacing: 1,
    textAlign: "center",
    marginVertical: 14,
  },

  codigoAjuda: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  validadeBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  validadeTexto: {
    color: "#B45309",
    fontWeight: "800",
    fontSize: 13,
    marginLeft: 6,
  },

  expiracaoTexto: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },

  sos: {
    minHeight: 130,
    backgroundColor: "#EF2929",
    borderRadius: 25,
    padding: 18,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#DC2626",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  sosIconBox: {
    width: 74,
    height: 74,
    borderRadius: 21,
    backgroundColor: "#FF4040",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  sosIcon: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  sosContent: {
    flex: 1,
  },

  sosTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  sosText: {
    color: "#FFE4E4",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
  },

  sosArrow: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },

  footer: {
    marginTop: 22,
    backgroundColor: "#EAF9F0",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  footerItem: {
    flex: 1,
    alignItems: "center",
  },

  footerText: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },

  footerDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#B7E4C7",
  },
});
