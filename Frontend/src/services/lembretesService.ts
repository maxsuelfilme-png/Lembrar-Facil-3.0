
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

import type { Medicamento } from "./medicamentosService";

const CHAVE_LEMBRETES = "@lembrafacil:lembretes:idoso";

type LembretesSalvos = Record<string, string>;

type ModuloNotificacoes = typeof import("expo-notifications");

let modulo: ModuloNotificacoes | null = null;

// ======================================================
// NOTIFICAÇÕES EXPO
// ======================================================

function obterNotificacoes(): ModuloNotificacoes | null {
  if (Platform.OS === "web") {
    return null;
  }

  // Expo Go não é utilizado para testar o módulo Kotlin.
  if (Constants.appOwnership === "expo") {
    return null;
  }

  if (!modulo) {
    modulo = require("expo-notifications") as ModuloNotificacoes;

    modulo.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  return modulo;
}

// ======================================================
// ARMAZENAMENTO DOS IDS DAS NOTIFICAÇÕES
// ======================================================

async function carregarIds(): Promise<LembretesSalvos> {
  const salvo = await AsyncStorage.getItem(CHAVE_LEMBRETES);

  if (!salvo) {
    return {};
  }

  try {
    const dados = JSON.parse(salvo);

    if (
      dados &&
      typeof dados === "object" &&
      !Array.isArray(dados)
    ) {
      return dados as LembretesSalvos;
    }

    return {};
  } catch (erro) {
    console.warn(
      "[LembraFácil] Erro ao carregar notificações:",
      erro
    );
    return {};
  }
}

async function salvarIds(
  ids: LembretesSalvos
): Promise<void> {
  await AsyncStorage.setItem(
    CHAVE_LEMBRETES,
    JSON.stringify(ids)
  );
}

// ======================================================
// CONFIGURAR CANAL DE NOTIFICAÇÕES ANDROID
// ======================================================

async function configurarCanalAndroid(): Promise<void> {
  const Notifications = obterNotificacoes();

  if (!Notifications || Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    "medicamentos",
    {
      name: "Lembretes de medicamentos",
      description: "Avisos dos horários dos medicamentos",
      importance:
        Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    }
  );
}

// ======================================================
// VERIFICAR / SOLICITAR PERMISSÃO
// ======================================================

async function verificarPermissaoNotificacoes(): Promise<boolean> {
  const Notifications = obterNotificacoes();

  if (!Notifications) {
    return false;
  }

  try {
    await configurarCanalAndroid();

    let permissao =
      await Notifications.getPermissionsAsync();

    if (!permissao.granted) {
      permissao =
        await Notifications.requestPermissionsAsync();
    }

    return permissao.granted;
  } catch (erro) {
    console.error(
      "[LembraFácil] Erro na permissão de notificações:",
      erro
    );
    return false;
  }
}

// ======================================================
// CANCELAR NOTIFICAÇÃO EXPO
// ======================================================

export async function cancelarLembrete(
  medicamentoId: string
): Promise<void> {
  const Notifications = obterNotificacoes();

  if (!Notifications) {
    return;
  }

  const ids = await carregarIds();
  const notificacaoId = ids[medicamentoId];

  if (!notificacaoId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(
      notificacaoId
    );

    delete ids[medicamentoId];
    await salvarIds(ids);

    console.log(
      `[LembraFácil] Notificação cancelada: ${medicamentoId}`
    );
  } catch (erro) {
    console.warn(
      "[LembraFácil] Erro ao cancelar notificação:",
      erro
    );
    throw erro;
  }
}

// ======================================================
// AGENDAR NOTIFICAÇÃO EXPO
// ======================================================

export async function agendarLembrete(
  medicamento: Medicamento
): Promise<boolean> {
  const Notifications = obterNotificacoes();

  if (!Notifications) {
    console.warn(
      "[LembraFácil] Notificações indisponíveis."
    );
    return false;
  }

  const horario = medicamento.horario.match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (!horario) {
    throw new Error(
      "Horário inválido para notificação."
    );
  }

  const hour = Number(horario[1]);
  const minute = Number(horario[2]);

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(
      "Horário inválido para notificação."
    );
  }

  const permissao =
    await verificarPermissaoNotificacoes();

  if (!permissao) {
    console.warn(
      "[LembraFácil] Permissão de notificações negada."
    );
    return false;
  }

  // Cancela a notificação anterior ao reagendar.
  await cancelarLembrete(medicamento.id);

  const notificacaoId =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Hora do medicamento!",
        body:
          `${medicamento.medicamento} — ` +
          `${medicamento.dosagem}`,
        sound: "default",
        ...(Platform.OS === "android"
          ? { channelId: "medicamentos" }
          : {}),
        data: {
          medicamentoId: medicamento.id,
        },
      },
      trigger: {
        type:
          Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

  const ids = await carregarIds();

  ids[medicamento.id] = notificacaoId;

  await salvarIds(ids);

  console.log(
    `[LembraFácil] Notificação agendada: ` +
    `${medicamento.medicamento} às ${medicamento.horario}`
  );

  return true;
}

// ======================================================
// SINCRONIZAR NOTIFICAÇÕES
// ======================================================

export async function sincronizarLembretes(
  medicamentos: Medicamento[]
): Promise<void> {
  const Notifications = obterNotificacoes();

  if (!Notifications) {
    return;
  }

  const ids = await carregarIds();

  const medicamentosAtuais = new Set(
    medicamentos.map((item) => item.id)
  );

  // Remove notificações de medicamentos excluídos.
  for (const id of Object.keys(ids)) {
    if (!medicamentosAtuais.has(id)) {
      await cancelarLembrete(id);
    }
  }

  // Agenda ou atualiza os lembretes existentes.
  for (const medicamento of medicamentos) {
    try {
      await agendarLembrete(medicamento);
    } catch (erro) {
      console.error(
        `[LembraFácil] Falha ao agendar ${medicamento.medicamento}:`,
        erro
      );
    }
  }

  console.log(
    "[LembraFácil] Sincronização de notificações concluída."
  );
}
