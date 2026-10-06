import { CameraView, useCameraPermissions } from "expo-camera";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { adicionarMedicamento } from "../services/medicamentosService";

type DadosReceita = {
  medicamento: string;
  dosagem: string;
  quantidade: string;
  horario: string;
  frequencia: string;
  duracao: string;
};

const dadosVazios: DadosReceita = {
  medicamento: "",
  dosagem: "",
  quantidade: "",
  horario: "",
  frequencia: "",
  duracao: "",
};

export default function ReceitaScreen() {
  const router = useRouter();

  const cameraRef = useRef<CameraView>(null);

  const [cameraAberta, setCameraAberta] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [tirandoFoto, setTirandoFoto] = useState(false);
  const [lendoReceita, setLendoReceita] = useState(false);
  const [textoOCR, setTextoOCR] = useState("");

  const [dadosReceita, setDadosReceita] =
    useState<DadosReceita | null>(null);

  const [permission, requestPermission] =
    useCameraPermissions();

  // =========================================================
  // ABRIR CÂMERA
  // =========================================================

  async function abrirCamera() {
    try {
      if (!permission?.granted) {
        const resultado = await requestPermission();

        if (!resultado.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos acessar a câmera para fotografar a receita."
          );

          return;
        }
      }

      setFoto(null);
      setTextoOCR("");
      setDadosReceita(null);
      setCameraAberta(true);
    } catch (erro) {
      console.log("Erro ao abrir câmera:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível abrir a câmera."
      );
    }
  }

  // =========================================================
  // TIRAR FOTO
  // =========================================================

  async function tirarFoto() {
    if (!cameraRef.current || tirandoFoto) {
      return;
    }

    try {
      setTirandoFoto(true);

      const resultado =
        await cameraRef.current.takePictureAsync({
          quality: 1,
        });

      if (resultado?.uri) {
        setFoto(resultado.uri);
        setTextoOCR("");
        setDadosReceita(null);
        setCameraAberta(false);
      }
    } catch (erro) {
      console.log("Erro ao tirar foto:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível tirar a foto."
      );
    } finally {
      setTirandoFoto(false);
    }
  }

  // =========================================================
  // ESCOLHER FOTO DA GALERIA
  // =========================================================

  async function escolherFoto() {
    try {
      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 1,
        });

      if (
        !resultado.canceled &&
        resultado.assets &&
        resultado.assets.length > 0
      ) {
        setFoto(resultado.assets[0].uri);
        setTextoOCR("");
        setDadosReceita(null);
      }
    } catch (erro) {
      console.log(
        "Erro ao escolher foto:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível selecionar a imagem."
      );
    }
  }

  // =========================================================
  // TIRAR OUTRA FOTO
  // =========================================================

  async function tirarOutraFoto() {
    setFoto(null);
    setTextoOCR("");
    setDadosReceita(null);

    await abrirCamera();
  }

  // =========================================================
  // IMAGEM -> BASE64
  // =========================================================

  async function imagemParaBase64(
    uri: string
  ): Promise<string> {
    try {
      const arquivo = new File(uri);

      const base64 = await arquivo.base64();

      if (!base64) {
        throw new Error("Imagem sem conteúdo.");
      }

      return base64;
    } catch (erro) {
      console.log("Erro Base64:", erro);

      throw new Error(
        "Não foi possível preparar a imagem."
      );
    }
  }

  // =========================================================
  // NORMALIZAR DOSAGEM
  // =========================================================

  function normalizarDosagem(valor: string) {
    return valor
      .replace(/\s+/g, " ")
      .replace(/\s*\+\s*/g, " + ")
      .trim()
      .toUpperCase();
  }

  // =========================================================
  // EXTRAIR DADOS DO TEXTO
  // =========================================================

  function extrairDadosSeguros(
    texto: string
  ): DadosReceita {
    const resultado: DadosReceita = {
      ...dadosVazios,
    };

    const textoLimpo = texto
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    const linhas = textoLimpo
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean);

    console.log("======= LINHAS OCR =======");

    linhas.forEach((linha, indice) => {
      console.log(indice, linha);
    });

    // =======================================================
    // ENCONTRAR ÁREA DA PRESCRIÇÃO
    // =======================================================

    let indicePrescricao = linhas.findIndex(
      (linha) =>
        /PRESCRIÇÃO|PRESCRICAO/i.test(linha)
    );

    if (indicePrescricao === -1) {
      indicePrescricao = linhas.findIndex(
        (linha) =>
          /USO\s+ORAL|USO\s+INTERNO|USO\s+EXTERNO/i.test(
            linha
          )
      );
    }

    const inicio =
      indicePrescricao >= 0
        ? indicePrescricao
        : 0;

    // =======================================================
    // MEDICAMENTO + DOSAGEM
    // =======================================================

    for (
      let i = inicio;
      i < linhas.length;
      i++
    ) {
      const linha = linhas[i];

      if (
        /IDENTIFICAÇÃO DO COMPRADOR|IDENTIFICACAO DO COMPRADOR|IDENTIFICAÇÃO DO FORNECEDOR|IDENTIFICACAO DO FORNECEDOR/i.test(
          linha
        )
      ) {
        break;
      }

      const semNumero = linha
        .replace(
          /^\s*\d+\s*[.)º°:-]?\s*/,
          ""
        )
        .trim();

      const matchDosagem =
        semNumero.match(
          /\d+(?:[.,]\d+)?\s*(?:\+\s*\d+(?:[.,]\d+)?)?\s*(?:MG|MCG|G|ML|UI)\b/i
        );

      if (!matchDosagem) {
        continue;
      }

      const posicaoDosagem =
        matchDosagem.index ?? -1;

      if (posicaoDosagem <= 0) {
        continue;
      }

      const nomePossivel = semNumero
        .substring(0, posicaoDosagem)
        .trim()
        .replace(/[,:;-]+$/, "")
        .trim();

      const proibidas = [
        "CRM",
        "UF",
        "CEP",
        "PACIENTE",
        "ENDEREÇO",
        "ENDERECO",
        "BAIRRO",
        "CIDADE",
        "ESTADO",
        "HOSPITAL",
        "SECRETARIA",
        "UNIDADE",
        "TELEFONE",
        "IDENTIFICAÇÃO",
        "IDENTIFICACAO",
        "DATA",
      ];

      const nomeUpper =
        nomePossivel.toUpperCase();

      const proibido =
        proibidas.some((palavra) =>
          nomeUpper.includes(palavra)
        );

      if (
        !proibido &&
        nomePossivel.length >= 3 &&
        /[A-Za-zÀ-ÿ]/.test(nomePossivel)
      ) {
        resultado.medicamento =
          nomePossivel.toUpperCase();

        resultado.dosagem =
          normalizarDosagem(
            matchDosagem[0]
          );

        console.log(
          "MEDICAMENTO ENCONTRADO:",
          resultado.medicamento
        );

        console.log(
          "DOSAGEM ENCONTRADA:",
          resultado.dosagem
        );

        break;
      }
    }

    // =======================================================
    // FALLBACK QUANDO NOME E DOSAGEM ESTÃO EM LINHAS SEPARADAS
    // =======================================================

    if (!resultado.medicamento) {
      for (
        let i = inicio;
        i < linhas.length - 1;
        i++
      ) {
        const atual = linhas[i]
          .replace(
            /^\s*\d+\s*[.)º°:-]?\s*/,
            ""
          )
          .trim();

        const proxima = linhas[i + 1];

        const dosagemProxima =
          proxima.match(
            /^\s*(\d+(?:[.,]\d+)?\s*(?:\+\s*\d+(?:[.,]\d+)?)?\s*(?:MG|MCG|G|ML|UI))\b/i
          );

        if (
          dosagemProxima &&
          atual.length >= 3 &&
          /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]+$/.test(
            atual
          )
        ) {
          resultado.medicamento =
            atual.toUpperCase();

          resultado.dosagem =
            normalizarDosagem(
              dosagemProxima[1]
            );

          break;
        }
      }
    }

    // =======================================================
    // QUANTIDADE
    // =======================================================

    const quantidadeMatch =
      textoLimpo.match(
        /\b(?:TOMAR|USAR|ADMINISTRAR)\s+(\d+(?:[.,]\d+)?)\s*(CP|CPS?|COMPRIMIDOS?|COMPRIMIDO|CÁPSULAS?|CAPSULAS?|CAPS?|GOTAS?|ML)\b/i
      );

    if (quantidadeMatch) {
      resultado.quantidade =
        `${quantidadeMatch[1]} ${quantidadeMatch[2]}`
          .toUpperCase();
    }

    // =======================================================
    // FREQUÊNCIA - 12/12 HORAS
    // =======================================================

    const frequenciaMatch =
      textoLimpo.match(
        /\b(\d{1,2})\s*\/\s*(\d{1,2})\s*(HORAS?|H|HS)\b/i
      );

    if (frequenciaMatch) {
      resultado.frequencia =
        `${frequenciaMatch[1]}/${frequenciaMatch[2]} HORAS`;
    }

    // =======================================================
    // FREQUÊNCIA - A CADA X HORAS
    // =======================================================

    if (!resultado.frequencia) {
      const cadaHoras =
        textoLimpo.match(
          /\bA\s+CADA\s+(\d{1,2})\s+HORAS?\b/i
        );

      if (cadaHoras) {
        resultado.frequencia =
          `A CADA ${cadaHoras[1]} HORAS`;
      }
    }

    // =======================================================
    // FREQUÊNCIA - X VEZES AO DIA
    // =======================================================

    if (!resultado.frequencia) {
      const vezesDia =
        textoLimpo.match(
          /\b(\d+|UMA|DUAS|TRÊS|TRES|QUATRO)\s+VEZ(?:ES)?\s+AO\s+DIA\b/i
        );

      if (vezesDia) {
        resultado.frequencia =
          vezesDia[0].toUpperCase();
      }
    }

    // =======================================================
    // DURAÇÃO
    // =======================================================

    const duracaoMatch =
      textoLimpo.match(
        /\b(?:POR|DURANTE)\s+(\d+)\s*(DIAS?|SEMANAS?|MESES?)\b/i
      );

    if (duracaoMatch) {
      resultado.duracao =
        `${duracaoMatch[1]} ${duracaoMatch[2]}`
          .toUpperCase();
    }

    // =======================================================
    // HORÁRIO
    // =======================================================

    const horarios =
      textoLimpo.match(
        /\b(?:[01]?\d|2[0-3])[:hH][0-5]\d\b/g
      );

    if (horarios) {
      resultado.horario = [
        ...new Set(horarios),
      ].join(", ");
    }

    console.log("============================");
    console.log("RESULTADO FINAL");
    console.log(
      "Medicamento:",
      resultado.medicamento
    );
    console.log(
      "Dosagem:",
      resultado.dosagem
    );
    console.log(
      "Quantidade:",
      resultado.quantidade
    );
    console.log(
      "Horário:",
      resultado.horario
    );
    console.log(
      "Frequência:",
      resultado.frequencia
    );
    console.log(
      "Duração:",
      resultado.duracao
    );
    console.log("============================");

    return resultado;
  }

  // =========================================================
  // OCR
  // =========================================================

  async function lerReceita() {
    if (!foto || lendoReceita) {
      return;
    }

    try {
      setLendoReceita(true);
      setTextoOCR("");
      setDadosReceita(null);

      const base64 =
        await imagemParaBase64(foto);

      const resposta = await fetch(
        "https://api.ocr.space/parse/image",
        {
          method: "POST",

          headers: {
            apikey: "helloworld",
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            "base64Image=" +
            encodeURIComponent(
              `data:image/jpeg;base64,${base64}`
            ) +
            "&language=por" +
            "&OCREngine=3" +
            "&isOverlayRequired=false" +
            "&detectOrientation=true" +
            "&scale=true",
        }
      );

      if (!resposta.ok) {
        throw new Error(
          `HTTP ${resposta.status}`
        );
      }

      const resultado =
        await resposta.json();

      if (
        resultado.IsErroredOnProcessing
      ) {
        const mensagem =
          Array.isArray(
            resultado.ErrorMessage
          )
            ? resultado.ErrorMessage.join(
                "\n"
              )
            : resultado.ErrorMessage;

        throw new Error(
          mensagem ||
            "Erro ao processar OCR."
        );
      }

      const textoReconhecido =
        resultado.ParsedResults
          ?.map(
            (item: {
              ParsedText?: string;
            }) =>
              item.ParsedText || ""
          )
          .join("\n")
          .trim() || "";

      if (!textoReconhecido) {
        Alert.alert(
          "Não foi possível ler",
          "O OCR não encontrou texto suficiente."
        );

        return;
      }

      console.log(
        "========= TEXTO OCR ========="
      );

      console.log(textoReconhecido);

      setTextoOCR(
        textoReconhecido
      );

      const dados =
        extrairDadosSeguros(
          textoReconhecido
        );

      setDadosReceita(dados);

      Alert.alert(
        "OCR concluído ✅",
        "Confira os dados encontrados antes de cadastrar."
      );
    } catch (erro) {
      console.log(
        "Erro OCR:",
        erro
      );

      Alert.alert(
        "Erro no OCR",
        "Não foi possível ler a receita. Verifique sua internet e tente novamente."
      );
    } finally {
      setLendoReceita(false);
    }
  }

  // =========================================================
  // ALTERAR CAMPO
  // =========================================================

  function atualizarCampo(
    campo: keyof DadosReceita,
    valor: string
  ) {
    setDadosReceita((atual) => {
      if (!atual) {
        return atual;
      }

      return {
        ...atual,
        [campo]: valor,
      };
    });
  }

  // =========================================================
  // SALVAR MEDICAMENTO
  // =========================================================

  async function salvarMedicamento() {
    if (!dadosReceita) {
      return;
    }

    if (
      !dadosReceita.medicamento.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Informe o medicamento."
      );

      return;
    }

    if (
      !dadosReceita.dosagem.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Informe a dosagem."
      );

      return;
    }

    if (
      !dadosReceita.horario.trim()
    ) {
      Alert.alert(
        "Defina o primeiro horário",
        `A receita informa ${
          dadosReceita.frequencia ||
          "a frequência"
        }, mas precisamos saber a hora da primeira dose. Digite, por exemplo, 08:00.`
      );

      return;
    }

    try {
      await adicionarMedicamento({
        medicamento:
          dadosReceita.medicamento.trim(),

        dosagem:
          dadosReceita.dosagem.trim(),

        quantidade:
          dadosReceita.quantidade.trim(),

        horario:
          dadosReceita.horario.trim(),

        frequencia:
          dadosReceita.frequencia.trim(),

        duracao:
          dadosReceita.duracao.trim(),
      });

      Alert.alert(
        "Medicamento cadastrado ✅",
        "O medicamento foi salvo com sucesso.",
        [
          {
            text: "Ver medicamentos",
            onPress: () =>
              router.push(
                "/medicamentos"
              ),
          },
          {
            text: "OK",
          },
        ]
      );
    } catch (erro) {
      console.log(
        "Erro ao salvar:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível cadastrar o medicamento."
      );
    }
  }

  // =========================================================
  // CÂMERA ABERTA
  // =========================================================

  if (cameraAberta) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />

        <TouchableOpacity
          style={styles.cancelar}
          onPress={() =>
            setCameraAberta(false)
          }
        >
          <Ionicons
            name="close"
            size={23}
            color="#FFFFFF"
          />

          <Text style={styles.cancelarText}>
            Cancelar
          </Text>
        </TouchableOpacity>

        <View style={styles.cameraButtons}>
          <TouchableOpacity
            style={styles.capture}
            onPress={tirarFoto}
            disabled={tirandoFoto}
          >
            {tirandoFoto ? (
              <ActivityIndicator
                size="large"
                color="#2563EB"
              />
            ) : (
              <View
                style={
                  styles.captureInner
                }
              />
            )}
          </TouchableOpacity>

          <Text
            style={
              styles.cameraInstruction
            }
          >
            Fotografar receita
          </Text>
        </View>
      </View>
    );
  }

  // =========================================================
  // TELA PRINCIPAL
  // =========================================================

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* CABEÇALHO */}

        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color="#2563EB"
            />
          </TouchableOpacity>

          <View style={styles.headerIcon}>
            <Ionicons
              name="camera"
              size={25}
              color="#2563EB"
            />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            Ler receita
          </Text>

          <Text style={styles.subtitle}>
            Fotografe sua receita e confira
            as informações antes de cadastrar.
          </Text>
        </View>

        {/* FOTO / ÁREA DE CAPTURA */}

        {foto ? (
          <View
            style={
              styles.previewContainer
            }
          >
            <View style={styles.previewHeader}>
              <View
                style={
                  styles.previewHeaderIcon
                }
              >
                <Ionicons
                  name="document-text"
                  size={22}
                  color="#2563EB"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.previewTitle
                  }
                >
                  Receita selecionada
                </Text>

                <Text
                  style={
                    styles.previewSubtitle
                  }
                >
                  Confira a imagem antes
                  da leitura
                </Text>
              </View>
            </View>

            <Image
              source={{ uri: foto }}
              style={styles.preview}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={
                styles.continuarButton
              }
              onPress={lerReceita}
              disabled={lendoReceita}
              activeOpacity={0.85}
            >
              {lendoReceita ? (
                <>
                  <ActivityIndicator
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.continuarText
                    }
                  >
                    LENDO RECEITA...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="scan"
                    size={23}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.continuarText
                    }
                  >
                    LER RECEITA
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.novaFotoButton
              }
              onPress={
                tirarOutraFoto
              }
            >
              <Ionicons
                name="camera-outline"
                size={21}
                color="#2563EB"
              />

              <Text
                style={
                  styles.novaFotoText
                }
              >
                Tirar outra foto
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={styles.cameraBox}
          >
            <View
              style={
                styles.bigCameraIcon
              }
            >
              <Ionicons
                name="document-text-outline"
                size={43}
                color="#2563EB"
              />
            </View>

            <Text
              style={
                styles.cameraTitle
              }
            >
              Fotografe sua receita
            </Text>

            <Text
              style={
                styles.cameraText
              }
            >
              Posicione a receita em um
              local bem iluminado para
              facilitar a leitura.
            </Text>

            <View
              style={
                styles.securityInfo
              }
            >
              <Ionicons
                name="shield-checkmark"
                size={19}
                color="#16A34A"
              />

              <Text
                style={
                  styles.securityText
                }
              >
                Você confere os dados antes
                de cadastrar
              </Text>
            </View>
          </View>
        )}

        {/* BOTÕES PARA ESCOLHER IMAGEM */}

        {!foto && (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={abrirCamera}
              activeOpacity={0.85}
            >
              <Ionicons
                name="camera"
                size={24}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                ABRIR CÂMERA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.galleryButton
              }
              onPress={
                escolherFoto
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="images-outline"
                size={23}
                color="#2563EB"
              />

              <Text
                style={
                  styles.galleryText
                }
              >
                Escolher da galeria
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* RESULTADO */}

        {dadosReceita && (
          <View
            style={
              styles.resultadoContainer
            }
          >
            <View
              style={
                styles.resultadoHeader
              }
            >
              <View
                style={
                  styles.resultadoIcon
                }
              >
                <Ionicons
                  name="clipboard-outline"
                  size={25}
                  color="#2563EB"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.resultadoTitulo
                  }
                >
                  Informações da receita
                </Text>

                <Text
                  style={
                    styles.resultadoSubtitulo
                  }
                >
                  Revise antes de salvar
                </Text>
              </View>
            </View>

            <View style={styles.aviso}>
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color="#92400E"
              />

              <Text
                style={
                  styles.avisoText
                }
              >
                Confira os dados com a
                receita original antes de
                cadastrar.
              </Text>
            </View>

            <Text
              style={styles.inputLabel}
            >
              Medicamento *
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <MaterialCommunityIcons
                name="pill"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: Dipirona"
                placeholderTextColor="#94A3B8"
                value={
                  dadosReceita.medicamento
                }
                onChangeText={(valor) =>
                  atualizarCampo(
                    "medicamento",
                    valor
                  )
                }
              />
            </View>

            <Text
              style={styles.inputLabel}
            >
              Dosagem *
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="flask-outline"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: 500MG"
                placeholderTextColor="#94A3B8"
                value={
                  dadosReceita.dosagem
                }
                onChangeText={(valor) =>
                  atualizarCampo(
                    "dosagem",
                    valor
                  )
                }
              />
            </View>

            <Text
              style={styles.inputLabel}
            >
              Quantidade
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="layers-outline"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: 1 CP"
                placeholderTextColor="#94A3B8"
                value={
                  dadosReceita.quantidade
                }
                onChangeText={(valor) =>
                  atualizarCampo(
                    "quantidade",
                    valor
                  )
                }
              />
            </View>

            <Text
              style={styles.inputLabel}
            >
              Horário da primeira dose *
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="time-outline"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: 08:00"
                placeholderTextColor="#94A3B8"
                value={
                  dadosReceita.horario
                }
                onChangeText={(valor) =>
                  atualizarCampo(
                    "horario",
                    valor
                  )
                }
              />
            </View>

            <Text
              style={styles.inputLabel}
            >
              Frequência
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="repeat-outline"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: 12/12 HORAS"
                placeholderTextColor="#94A3B8"
                value={
                  dadosReceita.frequencia
                }
                onChangeText={(valor) =>
                  atualizarCampo(
                    "frequencia",
                    valor
                  )
                }
              />
            </View>

            <Text
              style={styles.inputLabel}
            >
              Duração
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="calendar-outline"
                size={21}
                color="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Ex.: 7 DIAS"
                placeholderTextColor="#94A3B8"
                value={
                  dadosReceita.duracao
                }
                onChangeText={(valor) =>
                  atualizarCampo(
                    "duracao",
                    valor
                  )
                }
              />
            </View>

            <TouchableOpacity
              style={
                styles.confirmarButton
              }
              onPress={
                salvarMedicamento
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.confirmarText
                }
              >
                CONFIRMAR E CADASTRAR
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TEXTO RECONHECIDO */}

        {textoOCR ? (
          <View
            style={
              styles.ocrContainer
            }
          >
            <View
              style={
                styles.ocrHeader
              }
            >
              <Ionicons
                name="scan-outline"
                size={23}
                color="#2563EB"
              />

              <Text
                style={
                  styles.ocrTitulo
                }
              >
                Texto reconhecido
              </Text>
            </View>

            <Text
              style={
                styles.ocrAviso
              }
            >
              Este é o texto identificado
              na fotografia. Compare com a
              receita original.
            </Text>

            <View
              style={
                styles.ocrTextoBox
              }
            >
              <Text
                style={
                  styles.ocrTexto
                }
              >
                {textoOCR}
              </Text>
            </View>
          </View>
        ) : null}

        {/* MEDICAMENTOS */}

        <TouchableOpacity
          style={
            styles.listaButton
          }
          onPress={() =>
            router.push(
              "/medicamentos"
            )
          }
          activeOpacity={0.85}
        >
          <View
            style={
              styles.listaIcon
            }
          >
            <MaterialCommunityIcons
              name="pill"
              size={24}
              color="#2563EB"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={
                styles.listaButtonText
              }
            >
              Meus medicamentos
            </Text>

            <Text
              style={
                styles.listaDescription
              }
            >
              Veja os medicamentos já
              cadastrados
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={23}
            color="#2563EB"
          />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Ionicons
            name="heart"
            size={18}
            color="#16A34A"
          />

          <Text
            style={styles.footerText}
          >
            LembraFácil • Cuidando da sua
            rotina
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ===========================================================
// ESTILOS
// ===========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 45,
  },

  // CABEÇALHO

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#E4F1FF",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    marginBottom: 23,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F2557",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 7,
    lineHeight: 23,
    fontWeight: "500",
  },

  // CARD INICIAL

  cameraBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 31,
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  bigCameraIcon: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: "#E4F1FF",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F2557",
    marginTop: 18,
  },

  cameraText: {
    textAlign: "center",
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
    marginTop: 8,
  },

  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF9F0",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    marginTop: 18,
  },

  securityText: {
    flex: 1,
    color: "#166534",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginLeft: 7,
  },

  // BOTÕES

  button: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 20,

    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  galleryButton: {
    minHeight: 58,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    borderWidth: 1,
    borderColor: "#DCE7F5",
  },

  galleryText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
  },

  // CÂMERA

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  camera: {
    flex: 1,
  },

  cameraButtons: {
    position: "absolute",
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  capture: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  captureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#2563EB",
  },

  cancelar: {
    position: "absolute",
    left: 20,
    top: 50,
    zIndex: 10,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  cancelarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  cameraInstruction: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },

  // FOTO

  previewContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 14,

    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  previewHeaderIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#E4F1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  previewTitle: {
    color: "#0F2557",
    fontSize: 17,
    fontWeight: "900",
  },

  previewSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },

  preview: {
    width: "100%",
    height: 280,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
  },

  novaFotoButton: {
    borderRadius: 16,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    gap: 8,
  },

  novaFotoText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "800",
  },

  continuarButton: {
    backgroundColor: "#16A34A",
    borderRadius: 17,
    minHeight: 59,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    flexDirection: "row",
    gap: 9,
  },

  continuarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  // RESULTADO OCR

  resultadoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    marginTop: 20,

    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  resultadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  resultadoIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#E4F1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  resultadoTitulo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F2557",
  },

  resultadoSubtitulo: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  aviso: {
    backgroundColor: "#FEF3C7",
    borderRadius: 15,
    padding: 13,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avisoText: {
    flex: 1,
    color: "#92400E",
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 8,
    fontWeight: "600",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 7,
    marginTop: 11,
  },

  inputContainer: {
    minHeight: 56,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 14,
  },

  confirmarButton: {
    backgroundColor: "#16A34A",
    borderRadius: 18,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 23,
    flexDirection: "row",
    gap: 8,
  },

  confirmarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  // TEXTO OCR

  ocrContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  ocrHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  ocrTitulo: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  ocrAviso: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    marginBottom: 12,
  },

  ocrTextoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DCE7F5",
  },

  ocrTexto: {
    fontSize: 15,
    lineHeight: 23,
    color: "#1E293B",
  },

  // MEUS MEDICAMENTOS

  listaButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    minHeight: 78,
    paddingHorizontal: 14,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  listaIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: "#E4F1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  listaButtonText: {
    color: "#0F2557",
    fontSize: 16,
    fontWeight: "900",
  },

  listaDescription: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },

  // RODAPÉ

  footer: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  footerText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
});