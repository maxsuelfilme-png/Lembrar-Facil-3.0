
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cadastrarFarmacia } from "../services/farmaciasService";

export default function FarmaciaCadastro() {
  const router = useRouter();

  const [dados, setDados] = useState({
    username: "",
    password: "",
    nome: "",
    cnpj: "",
    telefone: "",
    whatsapp: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    horario_funcionamento: "",
    faz_entrega: false,
    taxa_entrega: "",
  });

  const [carregando, setCarregando] = useState(false);

  function atualizar(campo: keyof typeof dados, valor: string | boolean) {
    setDados((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function salvar() {
    if (
      !dados.username.trim() ||
      !dados.password ||
      !dados.nome.trim() ||
      !dados.cnpj.trim() ||
      !dados.telefone.trim() ||
      !dados.endereco.trim() ||
      !dados.cidade.trim() ||
      !dados.estado.trim() ||
      !dados.cep.trim()
    ) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    const cnpj = dados.cnpj.replace(/\D/g, "");
    const cep = dados.cep.replace(/\D/g, "");

    if (cnpj.length !== 14 || cep.length !== 8) {
      Alert.alert("Atenção", "Confira o CNPJ e o CEP informados.");
      return;
    }

    const estado = dados.estado.trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(estado)) {
      Alert.alert("Atenção", "Informe a sigla do estado com duas letras.");
      return;
    }

    const taxa = dados.taxa_entrega.trim().replace(",", ".");

    if (dados.faz_entrega && taxa && (!Number.isFinite(Number(taxa)) || Number(taxa) < 0)) {
      Alert.alert("Atenção", "Informe uma taxa de entrega válida.");
      return;
    }

    setCarregando(true);

    try {
      await cadastrarFarmacia({
        ...dados,
        username: dados.username.trim(),
        nome: dados.nome.trim(),
        cnpj,
        cep,
        estado,
        taxa_entrega: dados.faz_entrega && taxa ? taxa : null,
      });

      Alert.alert(
        "Cadastro enviado!",
        "Sua farmácia foi cadastrada e aguarda aprovação do administrador.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/farmacia-login"),
          },
        ]
      );
    } catch (erro) {
      Alert.alert(
        "Erro no cadastro",
        erro instanceof Error ? erro.message : "Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  function campo(
    titulo: string,
    chave: keyof typeof dados,
    obrigatorio = false,
    senha = false
  ) {
    return (
      <View style={styles.campo}>
        <Text style={styles.label}>
          {titulo}{obrigatorio ? " *" : ""}
        </Text>
        <TextInput
          style={styles.input}
          value={String(dados[chave])}
          onChangeText={(valor) => atualizar(chave, valor)}
          secureTextEntry={senha}
          autoCapitalize={
            chave === "username" || senha ? "none" : "sentences"
          }
          autoCorrect={false}
          editable={!carregando}
        />
      </View>
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
        </TouchableOpacity>

        <Text style={styles.titulo}>Cadastrar Farmácia</Text>
        <Text style={styles.subtitulo}>
          Preencha os dados para solicitar uma parceria
          com o LembraFácil.
        </Text>

        <View style={styles.formulario}>
          <Text style={styles.secao}>Dados de acesso</Text>
          {campo("Usuário", "username", true)}
          {campo("Senha", "password", true, true)}

          <Text style={styles.secao}>Dados da farmácia</Text>
          {campo("Nome da farmácia", "nome", true)}
          {campo("CNPJ", "cnpj", true)}
          {campo("Telefone", "telefone", true)}
          {campo("WhatsApp", "whatsapp")}
          {campo("Endereço completo", "endereco", true)}
          {campo("Cidade", "cidade", true)}
          {campo("Estado (UF)", "estado", true)}
          {campo("CEP", "cep", true)}
          {campo("Horário de funcionamento", "horario_funcionamento")}

          <View style={styles.entrega}>
            <Text style={styles.label}>Realiza entregas?</Text>
            <Switch
              value={dados.faz_entrega}
              onValueChange={(valor) => atualizar("faz_entrega", valor)}
              trackColor={{ false: "#CBD5E1", true: "#C4B5FD" }}
              thumbColor={dados.faz_entrega ? "#7C3AED" : "#FFFFFF"}
            />
          </View>

          {dados.faz_entrega &&
            campo("Taxa de entrega (R$)", "taxa_entrega")}

          <TouchableOpacity
            style={styles.botao}
            onPress={salvar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botaoTexto}>
                Enviar cadastro
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.aviso}>
          O cadastro não garante parceria imediata.
          A farmácia precisará ser verificada e aprovada.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBFF" },
  content: { padding: 20, paddingBottom: 40 },
  voltar: {
    width: 45, height: 45, borderRadius: 15,
    backgroundColor: "#EAF3FF",
    justifyContent: "center", alignItems: "center",
    marginBottom: 22,
  },
  titulo: {
    fontSize: 29, fontWeight: "900", color: "#0F2557",
  },
  subtitulo: {
    fontSize: 14, color: "#64748B",
    lineHeight: 21, marginTop: 8, marginBottom: 24,
  },
  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24, padding: 20, elevation: 3,
  },
  secao: {
    fontSize: 19, fontWeight: "900",
    color: "#7C3AED", marginBottom: 17, marginTop: 12,
  },
  campo: { marginBottom: 16 },
  label: {
    fontSize: 14, fontWeight: "800",
    color: "#0F2557", marginBottom: 7,
  },
  input: {
    borderWidth: 1, borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 14, height: 52,
    paddingHorizontal: 14, fontSize: 15,
    color: "#0F2557",
  },
  entrega: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", marginVertical: 14,
  },
  botao: {
    height: 56, borderRadius: 16,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center", marginTop: 20,
  },
  botaoTexto: {
    fontSize: 16, fontWeight: "900", color: "#FFFFFF",
  },
  aviso: {
    color: "#64748B", fontSize: 12,
    lineHeight: 19, textAlign: "center",
    marginTop: 20,
  },
});
