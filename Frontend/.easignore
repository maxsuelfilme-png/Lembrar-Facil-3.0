
import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import {
  API_URL,
  iniciarSessaoIdoso,
  obterTokenValidoIdoso,
  diagnosticarSessaoIdoso,
  limparSessaoAntigaIdoso,
} from "../services/authService";

import { gerarCodigoVinculoIdoso } from "../services/vinculosService";

const API_BASE = API_URL.replace(/\/+$/, "");

export default function IdosoScreen() {
  const router = useRouter();

  const [preparando, setPreparando] = useState(true);
  const [erroSessao, setErroSessao] = useState<string | null>(null);

  const [nomeIdoso, setNomeIdoso] = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);

  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [codigoVinculo, setCodigoVinculo] = useState("");
  const [expiracaoCodigo, setExpiracaoCodigo] = useState("");

  const [enviandoSOS, setEnviandoSOS] = useState(false);
  const enviandoSOSRef = useRef(false);

  // PERFIL DO IDOSO

  async function carregarNomeIdoso() {
    const token = await obterTokenValidoIdoso();

    if (!token) {
      throw new Error("Sessão do idoso indisponível.");
    }

    const resposta = await fetch(
      `${API_BASE}/pacientes/meu-perfil/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      throw new Error(
        dados?.detail || "Não foi possível carregar o perfil."
      );
    }

    setNomeIdoso(dados?.nome || "");
  }

  async function salvarNomeIdoso() {
    const nomeLimpo = nomeIdoso.trim().replace(/\s+/g, " ");

    if (
      !nomeLimpo ||
      nomeLimpo.toLowerCase() === "paciente"
    ) {
      Alert.alert(
        "Nome inválido",
        "Informe o nome verdadeiro do idoso."
      );
      return;
    }

    try {
      setSalvandoNome(true);

      const token = await obterTokenValidoIdoso();

      if (!token) {
        throw new Error("Sessão do idoso indisponível.");
      }

      const resposta = await fetch(
        `${API_BASE}/pacientes/meu-perfil/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: nomeLimpo,
          }),
        }
      );

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        const detalhe =
          dados?.nome?.[0] ||
          dados?.detail ||
          "Não foi possível salvar o nome.";

        throw new Error(String(detalhe));
      }

      setNomeIdoso(dados?.nome || nomeLimpo);

      Alert.alert(
        "Perfil atualizado 💚",
        "O nome do idoso foi salvo com sucesso."
      );
    } catch (erro) {
      Alert.alert(
        "Erro",
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar o nome."
      );
    } finally {
      setSalvandoNome(false);
    }
  }

  // SESSÃO DO IDOSO

  async function prepararSessao() {
    try {
      setPreparando(true);
      setErroSessao(null);

      await diagnosticarSessaoIdoso();
      await iniciarSessaoIdoso();
      await carregarNomeIdoso();

      console.log("Sessão do idoso iniciada.");
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível conectar ao servidor.";

      console.error("Erro na sessão:", mensagem);
      setErroSessao(mensagem);
    } finally {
      setPreparando(false);
    }
  }

  useEffect(() => {
    void prepararSessao();
  }, []);

  // REINICIAR CADASTRO DE TESTE

  function confirmarReinicioTeste() {
    Alert.alert(
      "Reiniciar cadastro de teste",
      "Use somente se o paciente antigo foi excluído do Railway. Isso remove a sessão local e cria um novo paciente.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Reiniciar teste",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                setPreparando(true);
                setCodigoVinculo("");
                setExpiracaoCodigo("");
                setNomeIdoso("");

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

  // GERAR CÓDIGO DE VÍNCULO

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
      setExpiracaoCodigo(resposta.expira_em || "");

      Alert.alert(
        "Código gerado! 💚",
        "Informe esse código na tela Família. Ele é válido por 10 minutos. O vínculo criado será permanente."
      );
    } catch (erro) {
      Alert.alert(
        "Erro ao gerar código",
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o código."
      );
    } finally {
      setGerandoCodigo(false);
    }
  }

  // NAVEGAÇÃO

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
        params: {
          perfil: "idoso",
        },
      });
      return;
    }

    router.push(destino);
  }

  // SOS VIA WHATSAPP

  async function enviarSOSWhatsApp() {
    if (enviandoSOSRef.current) {
      return;
    }

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

      const resposta = await fetch(
        `${API_BASE}/pacientes/sos/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const resultado = await resposta
        .json()
        .catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          resultado?.detail ||
            `Erro HTTP ${resposta.status} ao solicitar SOS.`
        );
      }

      Alert.alert(
        "SOS solicitado",
        resultado?.detail ||
          "O pedido foi aceito pelo servidor. A entrega da mensagem ainda não foi confirmada."
      );
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível solicitar o SOS.";

      Alert.alert(
        "Não foi possível enviar o SOS",
        `${mensagem}\n\nEm uma emergência, ligue para 192.`
      );
    } finally {
      enviandoSOSRef.current = false;
      setEnviandoSOS(false);
    }
  }

  // SAMU

  async function ligarSAMU() {
    try {
      await Linking.openURL("tel:192");
    } catch {
      Alert.alert(
        "SAMU - 192",
        "Não foi possível abrir o discador. Ligue para 192 manualmente."
      );
    }
  }

  function confirmarSOS() {
    Alert.alert(
      "🚨 SOS - Emergência",
      "Deseja avisar seu familiar pelo WhatsApp e abrir a ligação para o SAMU (192)?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
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

  const bloqueado = preparando || !!erroSessao;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* CABEÇALHO */}

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

          <Ionicons
            name="settings-outline"
            size={26}
            color="#64748B"
          />
        </View>

        <View style={styles.welcome}>
          <Text style={styles.title}>Olá! 👋</Text>
          <Text style={styles.subtitle}>
            Vamos cuidar da sua rotina.
          </Text>
        </View>

        {/* CARREGAMENTO */}

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

        {/* ERRO */}

        {!!erroSessao && (
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
              <Text style={styles.botaoTexto}>
                Reiniciar cadastro de teste
              </Text>
            </TouchableOpacity>

            <Text style={styles.avisoTeste}>
              Use apenas se o cadastro antigo já foi
              excluído do Railway.
            </Text>
          </View>
        )}

        {/* MEU PERFIL */}

        <View style={styles.perfilCard}>
          <View style={styles.perfilCabecalho}>
            <Ionicons
              name="person-circle-outline"
              size={36}
              color="#16A34A"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.perfilTitulo}>
                Meu perfil
              </Text>
              <Text style={styles.perfilDescricao}>
                Informe seu nome para que o familiar
                possa identificar você.
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            Nome completo do idoso
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ex.: Maria da Silva"
            placeholderTextColor="#94A3B8"
            value={nomeIdoso}
            onChangeText={setNomeIdoso}
            editable={!bloqueado && !salvandoNome}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={150}
          />

          <TouchableOpacity
            style={[
              styles.salvarButton,
              (bloqueado || salvandoNome) &&
                styles.botaoDesabilitado,
            ]}
            disabled={bloqueado || salvandoNome}
            onPress={() => void salvarNomeIdoso()}
          >
            {salvandoNome ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={21}
                  color="#FFFFFF"
                />
                <Text style={styles.botaoTexto}>
                  SALVAR MEU NOME
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* LER RECEITA */}

        <TouchableOpacity
          style={[styles.card, styles.receitaCard]}
          activeOpacity={0.85}
          disabled={bloqueado}
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
              Tire uma foto da sua receita para
              cadastrar os medicamentos.
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

        {/* MEDICAMENTOS */}

        <TouchableOpacity
          style={[styles.card, styles.medicamentoCard]}
          activeOpacity={0.85}
          disabled={bloqueado}
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
              Veja seus medicamentos e horários.
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

        {/* ROTINA */}

        <TouchableOpacity
          style={[styles.card, styles.rotinaCard]}
          activeOpacity={0.85}
          disabled={bloqueado}
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
              Confira o que precisa fazer hoje.
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

            <View style={{ flex: 1 }}>
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
              (bloqueado || gerandoCodigo) &&
                styles.botaoDesabilitado,
            ]}
            disabled={bloqueado || gerandoCodigo}
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
                <Text style={styles.botaoTexto}>
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
          disabled={enviandoSOS}
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
              <Text style={styles.sosIcon}>
                SOS
              </Text>
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

          <Ionicons
            name="chevron-forward"
            size={28}
            color="#FFFFFF"
          />
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

  welcome: {
    marginBottom: 22,
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
  },

  avisoTeste: {
    fontSize: 12,
    color: "#9F1239",
    textAlign: "center",
    marginTop: 10,
  },

  perfilCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 19,
    marginBottom: 22,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },

  perfilCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  perfilTitulo: {
    color: "#0F2557",
    fontSize: 21,
    fontWeight: "900",
  },

  perfilDescricao: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  label: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 15,
    paddingHorizontal: 14,
    fontSize: 17,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },

  salvarButton: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  botaoDesabilitado: {
    opacity: 0.5,
  },

  card: {
    minHeight: 128,
    borderRadius: 25,
    padding: 17,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
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
    gap: 13,
  },

  vinculoIconBox: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
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
    gap: 9,
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
    gap: 6,
  },

  validadeTexto: {
    color: "#B45309",
    fontWeight: "800",
    fontSize: 13,
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
