
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { Medicamento } from "./medicamentosService";

const CHAVE_LEMBRETES = "@lembrafacil:lembretes:idoso";

type LembretesSalvos = Record<string, string>;

type ModuloNotificacoes =
  typeof import("expo-notifications");

let modulo: ModuloNotificacoes | null = null;

function obterNotificacoes(): ModuloNotificacoes | null {
  if (Platform.OS === "web") return null;

  // Expo Go não suporta a integração completa
  // de notificações usada nesta implementação.
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

async function carregarIds(): Promise<LembretesSalvos> {
  const salvo = await AsyncStorage.getItem(CHAVE_LEMBRETES);

  if (!salvo) return {};

  try {
    return JSON.parse(salvo) as LembretesSalvos;
  } catch {
    return {};
  }
}

async function salvarIds(ids: LembretesSalvos) {
  await AsyncStorage.setItem(
    CHAVE_LEMBRETES,
    JSON.stringify(ids)
  );
}

function extrairHorario(horario: string) {
  const resultado = /^(\d{1,2}):(\d{2})$/.exec(
    horario.trim()
  );

  if (!resultado) {
    throw new Error("Use um horário como 08:00.");
  }

  const hour = Number(resultado[1]);
  const minute = Number(resultado[2]);

  if (hour > 23 || minute > 59) {
    throw new Error("Horário inválido.");
  }

  return { hour, minute };
}

async function solicitarPermissao(): Promise<boolean> {
  const Notifications = obterNotificacoes();

  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "medicamentos",
      {
        name: "Lembretes de medicamentos",
        importance:
          Notifications.AndroidImportance.HIGH,
        sound: "default",
      }
    );
  }

  const atual = await Notifications.getPermissionsAsync();

  if (atual.granted) return true;

  const resposta =
    await Notifications.requestPermissionsAsync();

  return resposta.granted;
}

export async function cancelarLembrete(
  medicamentoId: string
): Promise<void> {
  const Notifications = obterNotificacoes();

  if (!Notifications) return;

  const ids = await carregarIds();
  const notificacaoId = ids[medicamentoId];

  if (!notificacaoId) return;

  await Notifications.cancelScheduledNotificationAsync(
    notificacaoId
  );

  delete ids[medicamentoId];
  await salvarIds(ids);
}

export async function agendarLembrete(
  medicamento: Medicamento
): Promise<boolean> {
  const Notifications = obterNotificacoes();

  if (!Notifications) return false;

  const permitido = await solicitarPermissao();

  if (!permitido) return false;

  const { hour, minute } = extrairHorario(
    medicamento.horario
  );

  await cancelarLembrete(medicamento.id);

  const notificacaoId =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Hora do medicamento!",
        body:
          `${medicamento.medicamento} — ` +
          `${medicamento.dosagem}\n` +
          "Confira sua rotina no LembraFácil.",
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
        channelId: "medicamentos",
      },
    });

  const ids = await carregarIds();

  ids[medicamento.id] = notificacaoId;

  await salvarIds(ids);

  return true;
}

export async function sincronizarLembretes(
  medicamentos: Medicamento[]
): Promise<void> {
  const Notifications = obterNotificacoes();

  if (!Notifications) {
    console.log(
      "Lembretes desativados no Expo Go."
    );
    return;
  }

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
