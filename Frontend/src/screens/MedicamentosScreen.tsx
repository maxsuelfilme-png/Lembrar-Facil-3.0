
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
  reporEstoqueMedicamento,
  type Medicamento,
  type DadosMedicamento,
  type OpcoesMedicamentos,
} from "../services/medicamentosService";

import { sincronizarLembretes } from "../services/lembretesService";

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function numeroParaTexto(valor: number | null): string {
  if (valor === null) return "";
  return String(valor).replace(".", ",");
}

function textoParaNumero(valor: string): number | null {
  if (!valor.trim()) return null;

  const numero = Number(valor.trim().replace(",", "."));

  if (!Number.isFinite(numero)) {
    throw new Error("Informe um número válido para o estoque.");
  }

  return numero;
}

function formatarNumero(valor: number | null): string {
  if (valor === null) return "Não calculado";

  return valor.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });
}

// ======================================================
// TELA DE MEDICAMENTOS
// ======================================================

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

      if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
        return null;
      }

      return {
        perfil: "familiar",
        pacienteId,
      };
    }

    return null;
  }, [params.perfil, params.pacienteId]);

  // ====================================================
  // ESTADOS
  // ====================================================

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

  // Controle de estoque
  const [estoqueInicial, setEstoqueInicial] = useState("");
  const [consumoPorDose, setConsumoPorDose] = useState("");
  const [unidadeEstoque, setUnidadeEstoque] =
    useState("comprimido");

  const [estoqueJaIniciado, setEstoqueJaIniciado] =
    useState(false);

  // Reposição de estoque
  const [repondoId, setRepondoId] =
    useState<string | null>(null);

  const [quantidadeReposicao, setQuantidadeReposicao] =
    useState("");

  const [processandoReposicao, setProcessandoReposicao] =
    useState(false);

  const perfilTexto =
    opcoes?.perfil === "idoso"
      ? "Minha rotina de medicamentos"
      : "Medicamentos do paciente vinculado";

  // ====================================================
  // CARREGAR MEDICAMENTOS
  // ====================================================

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

  // ====================================================
  // LIMPAR FORMULÁRIO
  // ====================================================

  function limparFormulario() {
    setNome("");
    setDosagem("");
    setQuantidade("");
    setHorario("");
    setFrequencia("");
    setDuracao("");

    setEstoqueInicial("");
    setConsumoPorDose("");
    setUnidadeEstoque("comprimido");
    setEstoqueJaIniciado(false);

    setEditandoId(null);
  }

  // ====================================================
  // SALVAR MEDICAMENTO
  // ====================================================

  async function salvarMedicamento() {
    if (!opcoes || salvando) return;

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
      const dados: DadosMedicamento = {
        medicamento: nome.trim(),
        dosagem: dosagem.trim(),
        quantidade: quantidade.trim(),
        horario: horario.trim(),
        frequencia: frequencia.trim(),
        duracao: duracao.trim(),
      };

      // Não alterar estoque inicial de ciclo existente.
      if (!estoqueJaIniciado) {
        const estoque = textoParaNumero(estoqueInicial);
        const consumo = textoParaNumero(consumoPorDose);

        if ((estoque === null) !== (consumo === null)) {
          throw new Error(
            "Preencha o estoque inicial e o consumo por dose juntos."
          );
        }

        if (estoque !== null && estoque < 0) {
          throw new Error("O estoque não pode ser negativo.");
        }

        if (consumo !== null && consumo <= 0) {
          throw new Error(
            "O consumo por dose deve ser maior que zero."
          );
        }

        if (estoque !== null && consumo !== null) {
          dados.estoque_inicial = estoque;
          dados.consumo_por_dose = consumo;
          dados.unidade_estoque =
            unidadeEstoque.trim() || "comprimido";
        }
      }

      setSalvando(true);

      if (editandoId) {
        const atualizado = await atualizarMedicamento(
          editandoId,
          dados,
          opcoes
        );

        if (!atualizado) {
          throw new Error("Medicamento não encontrado.");
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
      Alert.alert(
        "Erro",
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar o medicamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ====================================================
  // EDITAR MEDICAMENTO
  // ====================================================

  function editarMedicamento(medicamento: Medicamento) {
    setEditandoId(medicamento.id);

    setNome(medicamento.medicamento);
    setDosagem(medicamento.dosagem);
    setQuantidade(medicamento.quantidade);
    setHorario(medicamento.horario);
    setFrequencia(medicamento.frequencia);
    setDuracao(medicamento.duracao);

    setEstoqueInicial(
      numeroParaTexto(medicamento.estoque_inicial)
    );

    setConsumoPorDose(
      numeroParaTexto(medicamento.consumo_por_dose)
    );

    setUnidadeEstoque(
      medicamento.unidade_estoque || "comprimido"
    );

    setEstoqueJaIniciado(
      Boolean(medicamento.estoque_iniciado_em)
    );
  }

  // ====================================================
  // EXCLUIR MEDICAMENTO
  // ====================================================

  function confirmarExclusao(id: string) {
    if (!opcoes) return;

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
                throw new Error("Medicamento não encontrado.");
              }

              if (editandoId === id) {
                limparFormulario();
              }

              if (repondoId === id) {
                setRepondoId(null);
                setQuantidadeReposicao("");
              }

              await carregarMedicamentos();

              Alert.alert(
                "Excluído",
                "Medicamento removido com sucesso."
              );
            } catch (erro) {
              Alert.alert(
                "Erro",
                erro instanceof Error
                  ? erro.message
                  : "Não foi possível excluir o medicamento."
              );
            }
          },
        },
      ]
    );
  }

  // ====================================================
  // ABRIR / CANCELAR REPOSIÇÃO
  // ====================================================

  function abrirReposicao(id: string) {
    if (processandoReposicao) return;

    setRepondoId(id);
    setQuantidadeReposicao("");
  }

  function cancelarReposicao() {
    if (processandoReposicao) return;

    setRepondoId(null);
    setQuantidadeReposicao("");
  }

  // ====================================================
  // CONFIRMAR REPOSIÇÃO
  // ====================================================

  function confirmarReposicao() {
    if (!repondoId || !opcoes || processandoReposicao) {
      return;
    }

    const valor = quantidadeReposicao.trim().replace(",", ".");
    const quantidadeNova = Number(valor);

    if (
      !valor ||
      !Number.isFinite(quantidadeNova) ||
      quantidadeNova <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(valor)
    ) {
      Alert.alert(
        "Quantidade inválida",
        "Informe uma quantidade maior que zero, com até duas casas decimais."
      );
      return;
    }

    const medicamento = medicamentos.find(
      (item) => item.id === repondoId
    );

    if (!medicamento) {
      Alert.alert("Erro", "Medicamento não encontrado.");
      return;
    }

    const medicamentoId = repondoId;

    Alert.alert(
      "Confirmar reposição",
      `Deseja adicionar ${quantidadeReposicao} ${medicamento.unidade_estoque} ao estoque de ${medicamento.medicamento}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            if (processandoReposicao) return;

            try {
              setProcessandoReposicao(true);

              // CORREÇÃO:
              // Passa as opções do perfil para usar
              // o token correto do idoso ou familiar.
              await reporEstoqueMedicamento(
                medicamentoId,
                quantidadeNova,
                opcoes
              );

              setRepondoId(null);
              setQuantidadeReposicao("");

              await carregarMedicamentos();

              Alert.alert(
                "Estoque atualizado",
                "Reposição registrada com sucesso!"
              );
            } catch (erro) {
              Alert.alert(
                "Erro na reposição",
                erro instanceof Error
                  ? erro.message
                  : "Não foi possível repor o estoque."
              );
            } finally {
              setProcessandoReposicao(false);
            }
          },
        },
      ]
    );
  }

  // ====================================================
  // ACESSO INVÁLIDO
  // ====================================================

  if (!opcoes) {
    return (
      <View style={styles.erroContainer}>
        <Text style={styles.erroEmoji}>🔒</Text>

        <Text style={styles.erroTitulo}>
          Acesso não identificado
        </Text>

        <Text style={styles.erroTexto}>
          Abra os medicamentos pela tela do idoso ou
          selecione um paciente vinculado na área do familiar.
        </Text>

        <TouchableOpacity
          style={styles.salvarButton}
          onPress={() => router.back()}
        >
          <Text style={styles.salvarText}>VOLTAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ====================================================
  // INTERFACE
  // ====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.voltar}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>💊 Medicamentos</Text>
      <Text style={styles.subtitulo}>{perfilTexto}</Text>

      {/* FORMULÁRIO */}

      <View style={styles.formulario}>
        <Text style={styles.formTitulo}>
          {editandoId
            ? "✏️ Editar medicamento"
            : "➕ Novo medicamento"}
        </Text>

        <Text style={styles.label}>Nome do medicamento</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Dipirona"
          value={nome}
          onChangeText={setNome}
          editable={!salvando}
        />

        <Text style={styles.label}>Dosagem</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 500 mg"
          value={dosagem}
          onChangeText={setDosagem}
          editable={!salvando}
        />

        <Text style={styles.label}>Quantidade da receita</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 1 comprimido"
          value={quantidade}
          onChangeText={setQuantidade}
          editable={!salvando}
        />

        <Text style={styles.label}>Horário</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 08:00"
          value={horario}
          onChangeText={setHorario}
          editable={!salvando}
        />

        <Text style={styles.label}>Frequência</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 1 vez ao dia"
          value={frequencia}
          onChangeText={setFrequencia}
          editable={!salvando}
        />

        <Text style={styles.label}>Duração</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 30 dias"
          value={duracao}
          onChangeText={setDuracao}
          editable={!salvando}
        />

        {/* CONTROLE DE ESTOQUE */}

        <View style={styles.estoqueSecao}>
          <Text style={styles.estoqueTitulo}>
            📦 Controle de estoque
          </Text>

          <Text style={styles.estoqueDescricao}>
            Informe a quantidade disponível e quanto é
            utilizado em cada dose.
          </Text>

          {estoqueJaIniciado ? (
            <View style={styles.avisoInfo}>
              <Text style={styles.avisoInfoTexto}>
                O controle de estoque já foi iniciado.
                Para adicionar medicamentos, utilize o botão
                "Repor estoque" no cartão correspondente.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Estoque inicial</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: 30"
                keyboardType="decimal-pad"
                value={estoqueInicial}
                onChangeText={setEstoqueInicial}
                editable={!salvando}
              />

              <Text style={styles.label}>Consumo por dose</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: 1"
                keyboardType="decimal-pad"
                value={consumoPorDose}
                onChangeText={setConsumoPorDose}
                editable={!salvando}
              />

              <Text style={styles.label}>Unidade de estoque</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: comprimido, mL, gotas"
                value={unidadeEstoque}
                onChangeText={setUnidadeEstoque}
                editable={!salvando}
              />
            </>
          )}
        </View>

        {/* SALVAR */}

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

      {/* LISTA DE MEDICAMENTOS */}

      <View style={styles.listaContainer}>
        <Text style={styles.listaTitulo}>
          📋 Medicamentos cadastrados
        </Text>

        <TouchableOpacity
          style={styles.atualizarButton}
          onPress={() => void carregarMedicamentos()}
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
            <View key={item.id} style={styles.card}>
              <Text style={styles.nomeMedicamento}>
                💊 {item.medicamento}
              </Text>

              <Text style={styles.info}>
                Dosagem: {item.dosagem}
              </Text>

              <Text style={styles.info}>
                Quantidade: {item.quantidade || "Não informado"}
              </Text>

              <Text style={styles.info}>
                Horário: {item.horario}
              </Text>

              <Text style={styles.info}>
                Frequência: {item.frequencia || "Não informado"}
              </Text>

              <Text style={styles.info}>
                Duração: {item.duracao || "Não informado"}
              </Text>

              {/* ESTOQUE DO MEDICAMENTO */}

              <View style={styles.estoqueCard}>
                <Text style={styles.estoqueCardTitulo}>
                  📦 Estoque do medicamento
                </Text>

                {item.estoque?.configurado ? (
                  <>
                    <Text style={styles.info}>
                      Estoque restante:{" "}
                      {formatarNumero(
                        item.estoque.estoque_restante
                      )}{" "}
                      {item.unidade_estoque}
                    </Text>

                    <Text style={styles.info}>
                      Doses restantes:{" "}
                      {formatarNumero(
                        item.estoque.doses_restantes
                      )}
                    </Text>

                    <Text style={styles.info}>
                      Dias estimados:{" "}
                      {formatarNumero(
                        item.estoque.dias_restantes
                      )}
                    </Text>

                    {item.estoque.alerta_estoque && (
                      <View style={styles.alertaEstoque}>
                        <Text style={styles.alertaEstoqueTexto}>
                          ⚠️ Estoque baixo! Verifique a
                          necessidade de reposição.
                        </Text>
                      </View>
                    )}

                    {/* REPOR ESTOQUE */}

                    {repondoId === item.id ? (
                      <View style={styles.reposicaoBox}>
                        <Text style={styles.reposicaoTitulo}>
                          📦 Adicionar ao estoque
                        </Text>

                        <Text style={styles.reposicaoDescricao}>
                          Informe a quantidade comprada.
                          Ela será somada ao estoque restante.
                        </Text>

                        <TextInput
                          style={styles.input}
                          placeholder="Ex.: 30"
                          keyboardType="decimal-pad"
                          value={quantidadeReposicao}
                          onChangeText={setQuantidadeReposicao}
                          editable={!processandoReposicao}
                        />

                        <TouchableOpacity
                          style={[
                            styles.reporButton,
                            processandoReposicao &&
                              styles.botaoDesabilitado,
                          ]}
                          onPress={confirmarReposicao}
                          disabled={processandoReposicao}
                        >
                          {processandoReposicao ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.reporText}>
                              Confirmar reposição
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cancelarButton}
                          onPress={cancelarReposicao}
                          disabled={processandoReposicao}
                        >
                          <Text style={styles.cancelarText}>
                            Cancelar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.abrirReposicaoButton}
                        onPress={() => abrirReposicao(item.id)}
                        disabled={processandoReposicao}
                      >
                        <Text style={styles.abrirReposicaoText}>
                          📦 Repor estoque
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={styles.info}>
                    Controle de estoque não configurado.
                    Toque em Editar para informar a quantidade
                    disponível.
                  </Text>
                )}
              </View>

              {/* EDITAR E EXCLUIR */}

              <View style={styles.acoes}>
                <TouchableOpacity
                  style={styles.editarButton}
                  onPress={() => editarMedicamento(item)}
                >
                  <Text style={styles.editarText}>
                    ✏️ Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.excluirButton}
                  onPress={() => confirmarExclusao(item.id)}
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

// ======================================================
// ESTILOS
// ======================================================

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

  estoqueSecao: {
    marginTop: 22,
    padding: 15,
    backgroundColor: "#EFF6FF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  estoqueTitulo: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1D4ED8",
  },

  estoqueDescricao: {
    fontSize: 14,
    color: "#475569",
    marginTop: 7,
    marginBottom: 10,
    lineHeight: 21,
  },

  avisoInfo: {
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },

  avisoInfoTexto: {
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 21,
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

  estoqueCard: {
    marginTop: 14,
    padding: 14,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  estoqueCardTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#166534",
    marginBottom: 10,
  },

  alertaEstoque: {
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },

  alertaEstoqueTexto: {
    color: "#92400E",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  abrirReposicaoButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginTop: 14,
  },

  abrirReposicaoText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  reposicaoBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },

  reposicaoTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#166534",
    marginBottom: 6,
  },

  reposicaoDescricao: {
    color: "#475569",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },

  reporButton: {
    backgroundColor: "#15803D",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },

  reporText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
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
    marginBottom: 15,
  },
});
