
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { useCallback, useMemo, useState } from "react";

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
  type Medicamento,
  type DadosMedicamento,
  type OpcoesMedicamentos,
} from "../services/medicamentosService";

import {
  sincronizarLembretes,
} from "../services/lembretesService";

export default function MedicamentosScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    perfil?: string;
    pacienteId?: string;
  }>();

  const opcoes = useMemo<OpcoesMedicamentos | null>(() => {
    if (params.perfil === "idoso") {
      return { perfil: "idoso" };
    }

    if (params.perfil === "familiar") {
      const pacienteId = Number(params.pacienteId);

      if (
        !Number.isInteger(pacienteId) ||
        pacienteId <= 0
      ) {
        return null;
      }

      return {
        perfil: "familiar",
        pacienteId,
      };
    }

    return null;
  }, [params.perfil, params.pacienteId]);

  const [medicamentos, setMedicamentos] =
    useState<Medicamento[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] =
    useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [horario, setHorario] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [duracao, setDuracao] = useState("");

  const perfilTexto =
    opcoes?.perfil === "idoso"
      ? "Minha rotina de medicamentos"
      : "Medicamentos do paciente vinculado";

  const carregarMedicamentos = useCallback(async () => {
    if (!opcoes) {
      setMedicamentos([]);
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);

      const dados = await listarMedicamentos(opcoes);
      setMedicamentos(dados);

      if (opcoes.perfil === "idoso") {
        try {
          await sincronizarLembretes(dados);
        } catch (erro) {
          console.warn(
            "Não foi possível sincronizar os lembretes:",
            erro
          );
        }
      }
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar os medicamentos.";

      Alert.alert("Erro", mensagem);
    } finally {
      setCarregando(false);
    }
  }, [opcoes]);

  useFocusEffect(
    useCallback(() => {
      void carregarMedicamentos();
    }, [carregarMedicamentos])
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
    if (!opcoes || salvando) {
      return;
    }

    if (!nome.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o nome do medicamento."
      );
      return;
    }

    if (!dosagem.trim()) {
      Alert.alert(
        "Atenção",
        "Informe a dosagem."
      );
      return;
    }

    if (!horario.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o horário."
      );
      return;
    }

    const dados: DadosMedicamento = {
      medicamento: nome.trim(),
      dosagem: dosagem.trim(),
      quantidade: quantidade.trim(),
      horario: horario.trim(),
      frequencia: frequencia.trim(),
      duracao: duracao.trim(),
    };

    try {
      setSalvando(true);

      if (editandoId) {
        const atualizado = await atualizarMedicamento(
          editandoId,
          dados,
          opcoes
        );

        if (!atualizado) {
          throw new Error(
            "Medicamento não encontrado."
          );
        }

        Alert.alert(
          "Sucesso",
          "Medicamento atualizado com sucesso!"
        );
      } else {
        await adicionarMedicamento(dados, opcoes);

        Alert.alert(
          "Sucesso",
          "Medicamento cadastrado com sucesso!"
        );
      }

      limparFormulario();
      await carregarMedicamentos();
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar o medicamento.";

      Alert.alert("Erro", mensagem);
    } finally {
      setSalvando(false);
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
  }

  function confirmarExclusao(id: string) {
    if (!opcoes) {
      return;
    }

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
              const excluido = await excluirMedicamento(
                id,
                opcoes
              );

              if (!excluido) {
                throw new Error(
                  "Medicamento não encontrado."
                );
              }

              if (editandoId === id) {
                limparFormulario();
              }

              await carregarMedicamentos();

              Alert.alert(
                "Excluído",
                "Medicamento removido com sucesso."
              );
            } catch (erro) {
              const mensagem =
                erro instanceof Error
                  ? erro.message
                  : "Não foi possível excluir o medicamento.";

              Alert.alert("Erro", mensagem);
            }
          },
        },
      ]
    );
  }

  if (!opcoes) {
    return (
      <View style={styles.erroContainer}>
        <Text style={styles.erroEmoji}>🔒</Text>

        <Text style={styles.erroTitulo}>
          Acesso não identificado
        </Text>

        <Text style={styles.erroTexto}>
          Abra os medicamentos pela tela do idoso
          ou selecione um paciente vinculado na
          área do familiar.
        </Text>

        <TouchableOpacity
          style={styles.salvarButton}
          onPress={() => router.back()}
        >
          <Text style={styles.salvarText}>
            VOLTAR
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.voltar}>
          ← Voltar
        </Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>
        💊 Medicamentos
      </Text>

      <Text style={styles.subtitulo}>
        {perfilTexto}
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
          editable={!salvando}
        />

        <Text style={styles.label}>
          Dosagem
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 500 mg"
          value={dosagem}
          onChangeText={setDosagem}
          editable={!salvando}
        />

        <Text style={styles.label}>
          Quantidade
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 1 comprimido"
          value={quantidade}
          onChangeText={setQuantidade}
          editable={!salvando}
        />

        <Text style={styles.label}>
          Horário
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 08:00"
          value={horario}
          onChangeText={setHorario}
          editable={!salvando}
        />

        <Text style={styles.label}>
          Frequência
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 1 vez ao dia"
          value={frequencia}
          onChangeText={setFrequencia}
          editable={!salvando}
        />

        <Text style={styles.label}>
          Duração
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: 7 dias"
          value={duracao}
          onChangeText={setDuracao}
          editable={!salvando}
        />

        <TouchableOpacity
          style={[
            styles.salvarButton,
            salvando && styles.botaoDesabilitado,
          ]}
          onPress={salvarMedicamento}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.salvarText}>
              {editandoId
                ? "💾 ATUALIZAR MEDICAMENTO"
                : "➕ CADASTRAR MEDICAMENTO"}
            </Text>
          )}
        </TouchableOpacity>

        {editandoId && (
          <TouchableOpacity
            style={styles.cancelarButton}
            onPress={limparFormulario}
            disabled={salvando}
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

        <TouchableOpacity
          style={styles.atualizarButton}
          onPress={() => {
            void carregarMedicamentos();
          }}
          disabled={carregando}
        >
          <Text style={styles.atualizarText}>
            🔄 Atualizar lista
          </Text>
        </TouchableOpacity>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={styles.loading}
          />
        ) : medicamentos.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>
              💊
            </Text>

            <Text style={styles.vazioTitulo}>
              Nenhum medicamento cadastrado
            </Text>

            <Text style={styles.vazioTexto}>
              Cadastre um medicamento acima
              para começar.
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

  botaoDesabilitado: {
    opacity: 0.6,
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

  atualizarButton: {
    alignSelf: "flex-start",
    backgroundColor: "#E0ECFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  atualizarText: {
    color: "#2563EB",
    fontWeight: "800",
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

  erroContainer: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    padding: 25,
  },

  erroEmoji: {
    fontSize: 48,
    textAlign: "center",
  },

  erroTitulo: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 15,
  },

  erroTexto: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
  },
});
