
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

import type { Medicamento } from "./medicamentosService";

const CHAVE_LEMBRETES =
  "@lembrafacil:lembretes:idoso";

type LembretesSalvos = Record<string, string>;

type ModuloNotificacoes =
  typeof import("expo-notifications");

let modulo: ModuloNotificacoes | null = null;

// ======================================================
// NOTIFICAÇÕES EXPO
// ======================================================

function obterNotificacoes(): ModuloNotificacoes | null {
  if (Platform.OS === "web") {
    return null;
  }

  if (Constants.appOwnership === "expo") {
    return null;
  }

  if (!modulo) {
    modulo =
      require("expo-notifications") as ModuloNotificacoes;

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
// ARMAZENAMENTO DOS IDS ANTIGOS
// ======================================================

async function carregarIds(): Promise<LembretesSalvos> {
  const salvo = await AsyncStorage.getItem(
    CHAVE_LEMBRETES
  );

  if (!salvo) {
    return {};
  }

  try {
    return JSON.parse(salvo) as LembretesSalvos;
  } catch {
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
// CANCELAR LEMBRETE EXPO ANTIGO
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
  } catch (erro) {
    console.warn(
      "Não foi possível cancelar a notificação antiga:",
      erro
    );
    return;
  }

  delete ids[medicamentoId];
  await salvarIds(ids);
}

// ======================================================
// AGENDAR LEMBRETE
// ======================================================

export async function agendarLembrete(
  medicamento: Medicamento
): Promise<boolean> {
  if (Platform.OS === "android") {
    // No Android, o despertador principal é Kotlin.
    // O agendamento nativo é tratado separadamente.
    return false;
  }

  const Notifications = obterNotificacoes();

  if (!Notifications) {
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
    await Notifications.getPermissionsAsync();

  if (!permissao.granted) {
    return false;
  }

  await cancelarLembrete(medicamento.id);

  const notificacaoId =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Hora do medicamento!",
        body:
          `${medicamento.medicamento} — ` +
          `${medicamento.dosagem}`,
        sound: "default",
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

  return true;
}

// ======================================================
// SINCRONIZAR LEMBRETES
// ======================================================

export async function sincronizarLembretes(
  medicamentos: Medicamento[]
): Promise<void> {
  const Notifications = obterNotificacoes();

  if (!Notifications) {
    return;
  }

  // No Android, remover notificações antigas do Expo
  // para evitar duplicidade com o despertador Kotlin.
  if (Platform.OS === "android") {
    const ids = await carregarIds();

    for (const id of Object.keys(ids)) {
      await cancelarLembrete(id);
    }

    console.log(
      "[LembraFácil] Notificações Expo antigas removidas."
    );

    return;
  }

  // Outros sistemas continuam com o mecanismo Expo.
  const ids = await carregarIds();

  const medicamentosAtuais = new Set(
    medicamentos.map((item) => item.id)
  );

  for (const id of Object.keys(ids)) {
    if (!medicamentosAtuais.has(id)) {
      await cancelarLembrete(id);
    }
  }

  for (const medicamento of medicamentos) {
    await agendarLembrete(medicamento);
  }
}
