
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import MedicationAlarmModule from
  "../../modules/medication-alarm/src/MedicationAlarmModule";

const somenteAndroid = () => Platform.OS === "android";

export async function verificarAlarmeAndroid():
  Promise<string> {
  if (!somenteAndroid()) {
    return "Despertador nativo disponível apenas no Android";
  }

  return MedicationAlarmModule.verificarModulo();
}

export async function verificarPermissaoAlarme():
  Promise<boolean> {
  if (!somenteAndroid()) return false;

  return MedicationAlarmModule.verificarPermissaoAlarme();
}

export async function solicitarPermissaoAlarme():
  Promise<boolean> {
  if (!somenteAndroid()) return false;

  return MedicationAlarmModule.solicitarPermissaoAlarme();
}

export async function solicitarPermissaoNotificacoes():
  Promise<boolean> {
  if (!somenteAndroid()) return false;

  const atual = await Notifications.getPermissionsAsync();

  if (atual.granted) return true;

  const resultado =
    await Notifications.requestPermissionsAsync();

  return resultado.granted;
}

export async function verificarPermissoesDespertador():
  Promise<{
    alarmeExato: boolean;
    notificacoes: boolean;
  }> {
  if (!somenteAndroid()) {
    return {
      alarmeExato: false,
      notificacoes: false,
    };
  }

  const [alarmeExato, notificacoes] = await Promise.all([
    verificarPermissaoAlarme(),
    Notifications.getPermissionsAsync(),
  ]);

  return {
    alarmeExato,
    notificacoes: notificacoes.granted,
  };
}

export async function agendarAlarmeMedicamento(
  id: number,
  medicamento: string,
  horario: string,
  data: Date
): Promise<boolean> {
  if (!somenteAndroid()) return false;

  const timestamp = data.getTime();

  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
    throw new Error("Data do alarme inválida");
  }

  return MedicationAlarmModule.agendarAlarme(
    id,
    medicamento,
    horario,
    timestamp
  );
}

export async function agendarTratamentoMedicamento(
  id: number,
  medicamento: string,
  horario: string,
  frequencia: string,
  duracao: string,
  data: Date
): Promise<boolean> {
  if (!somenteAndroid()) return false;

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("ID do medicamento inválido");
  }

  const timestamp = data.getTime();

  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
    throw new Error("Data do alarme inválida");
  }

  if (!medicamento.trim()) {
    throw new Error("Nome do medicamento obrigatório");
  }

  return MedicationAlarmModule.agendarTratamento(
    id,
    medicamento,
    horario,
    frequencia,
    duracao,
    timestamp
  );
}

export async function cancelarAlarmeMedicamento(
  id: number
): Promise<boolean> {
  if (!somenteAndroid()) return false;

  return MedicationAlarmModule.cancelarAlarme(id);
}

export async function restaurarAlarmesMedicamentos():
  Promise<boolean> {
  if (!somenteAndroid()) return false;

  return MedicationAlarmModule.restaurarAlarmes();
}
