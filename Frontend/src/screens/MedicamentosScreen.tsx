import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    adicionarMedicamento,
    atualizarMedicamento,
    excluirMedicamento,
    listarMedicamentos,
    Medicamento,
} from "../services/medicamentosService";

export default function MedicamentosScreen() {
  const router = useRouter();

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [horario, setHorario] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [duracao, setDuracao] = useState("");

  async function carregarMedicamentos() {
    try {
      setCarregando(true);

      const dados = await listarMedicamentos();

      setMedicamentos(dados);
    } catch (erro) {
      Alert.alert(
        "Erro",
        "Não foi possível carregar os medicamentos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarMedicamentos();
    }, [])
  );

  function limparFormulario() {
    setNome("");
    setDosagem("");
    setQuantidade("");
    setHorario("");
    setFrequencia("");
    setDuracao("");
    setEditandoId(null);
  }

  async function salvarMedicamento() {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe o nome do medicamento.");
      return;
    }

    if (!dosagem.trim()) {
      Alert.alert("Atenção", "Informe a dosagem.");
      return;
    }

    if (!horario.trim()) {
      Alert.alert("Atenção", "Informe o horário.");
      return;
    }

    try {
      const dados = {
        medicamento: nome.trim(),
        dosagem: dosagem.trim(),
        quantidade: quantidade.trim(),
        horario: horario.trim(),
        frequencia: frequencia.trim(),
        duracao: duracao.trim(),
      };

      if (editandoId) {
        await atualizarMedicamento(editandoId, dados);

        Alert.alert(
          "Sucesso",
          "Medicamento atualizado com sucesso!"
        );
      } else {
        await adicionarMedicamento(dados);

        Alert.alert(
          "Sucesso",
          "Medicamento cadastrado com sucesso!"
        );
      }

      limparFormulario();

      await carregarMedicamentos();
    } catch (erro) {
      Alert.alert(
        "Erro",
        "Não foi possível salvar o medicamento."
      );
    }
  }

  function editarMedicamento(medicamento: Medicamento) {
    setEditandoId(medicamento.id);

    setNome(medicamento.medicamento);
    setDosagem(medicamento.dosagem);
    setQuantidade(medicamento.quantidade);
    setHorario(medicamento.horario);
    setFrequencia(medicamento.frequencia);
    setDuracao(medicamento.duracao);

    setTimeout(() => {
      // apenas para atualizar a tela
    }, 100);
  }

  function confirmarExclusao(id: string) {
    Alert.alert(
      "Excluir medicamento",
      "Tem certeza que deseja excluir este medicamento?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await excluirMedicamento(id);

              await carregarMedicamentos();

              Alert.alert(
                "Excluído",
                "Medicamento removido com sucesso."
              );
            } catch (erro) {
              Alert.alert(
                "Erro",
                "Não foi possível excluir o medicamento."
              );
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.voltar}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>
        💊 Medicamentos
      </Text>

      <Text style={styles.subtitulo}>
        Cadastre e acompanhe os medicamentos da rotina.
      </Text>

      <View style={styles.formulario}>
        <Text style={styles.formTitulo}>
          {editandoId
            ? "✏️ Editar medicamento"
            : "➕ Novo medicamento"}
        </Text>

        <Text style={styles.label}>
          Nome do medicamento
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Dipirona"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>
          Dosagem
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 500 mg"
          value={dosagem}
          onChangeText={setDosagem}
        />

        <Text style={styles.label}>
          Quantidade
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 1 comprimido"
          value={quantidade}
          onChangeText={setQuantidade}
        />

        <Text style={styles.label}>
          Horário
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 08:00"
          value={horario}
          onChangeText={setHorario}
        />

        <Text style={styles.label}>
          Frequência
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 1 vez ao dia"
          value={frequencia}
          onChangeText={setFrequencia}
        />

        <Text style={styles.label}>
          Duração
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 7 dias"
          value={duracao}
          onChangeText={setDuracao}
        />

        <TouchableOpacity
          style={styles.salvarButton}
          onPress={salvarMedicamento}
        >
          <Text style={styles.salvarText}>
            {editandoId
              ? "💾 ATUALIZAR MEDICAMENTO"
              : "➕ CADASTRAR MEDICAMENTO"}
          </Text>
        </TouchableOpacity>

        {editandoId && (
          <TouchableOpacity
            style={styles.cancelarButton}
            onPress={limparFormulario}
          >
            <Text style={styles.cancelarText}>
              Cancelar edição
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listaContainer}>
        <Text style={styles.listaTitulo}>
          📋 Medicamentos cadastrados
        </Text>

        {carregando ? (
          <ActivityIndicator
            size="large"
            style={styles.loading}
          />
        ) : medicamentos.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>💊</Text>

            <Text style={styles.vazioTitulo}>
              Nenhum medicamento cadastrado
            </Text>

            <Text style={styles.vazioTexto}>
              Cadastre um medicamento acima para começar.
            </Text>
          </View>
        ) : (
          medicamentos.map((item) => (
            <View
              key={item.id}
              style={styles.card}
            >
              <Text style={styles.nomeMedicamento}>
                💊 {item.medicamento}
              </Text>

              <Text style={styles.info}>
                Dosagem: {item.dosagem}
              </Text>

              <Text style={styles.info}>
                Quantidade:{" "}
                {item.quantidade || "Não informado"}
              </Text>

              <Text style={styles.info}>
                Horário: {item.horario}
              </Text>

              <Text style={styles.info}>
                Frequência:{" "}
                {item.frequencia || "Não informado"}
              </Text>

              <Text style={styles.info}>
                Duração:{" "}
                {item.duracao || "Não informado"}
              </Text>

              <View style={styles.acoes}>
                <TouchableOpacity
                  style={styles.editarButton}
                  onPress={() =>
                    editarMedicamento(item)
                  }
                >
                  <Text style={styles.editarText}>
                    ✏️ Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.excluirButton}
                  onPress={() =>
                    confirmarExclusao(item.id)
                  }
                >
                  <Text style={styles.excluirText}>
                    🗑️ Excluir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  content: {
    padding: 22,
    paddingBottom: 40,
  },

  voltar: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: 20,
  },

  titulo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#222",
  },

  subtitulo: {
    fontSize: 17,
    color: "#666",
    marginTop: 7,
    marginBottom: 22,
  },

  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    elevation: 3,
  },

  formTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },

  salvarButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    marginTop: 20,
  },

  salvarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  cancelarButton: {
    padding: 15,
    alignItems: "center",
  },

  cancelarText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "700",
  },

  listaContainer: {
    marginTop: 25,
  },

  listaTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
    marginBottom: 15,
  },

  loading: {
    marginTop: 20,
  },

  vazio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  vazioEmoji: {
    fontSize: 45,
    marginBottom: 10,
  },

  vazioTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
  },

  vazioTexto: {
    color: "#777",
    textAlign: "center",
    marginTop: 7,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
  },

  nomeMedicamento: {
    fontSize: 21,
    fontWeight: "900",
    color: "#222",
    marginBottom: 12,
  },

  info: {
    fontSize: 15,
    color: "#555",
    marginBottom: 6,
  },

  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  editarButton: {
    flex: 1,
    backgroundColor: "#E0ECFF",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  editarText: {
    color: "#2563EB",
    fontWeight: "800",
  },

  excluirButton: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  excluirText: {
    color: "#DC2626",
    fontWeight: "800",
  },
});