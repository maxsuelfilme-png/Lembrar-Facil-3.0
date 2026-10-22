
import MedicationAlarmModule from "../../modules/medication-alarm/src/MedicationAlarmModule";

export async function verificarAlarmeAndroid(): Promise<string> {
  return MedicationAlarmModule.verificarModulo();
}

export async function verificarPermissaoAlarme(): Promise<boolean> {
  return MedicationAlarmModule.verificarPermissaoAlarme();
}

export async function solicitarPermissaoAlarme(): Promise<boolean> {
  return MedicationAlarmModule.solicitarPermissaoAlarme();
}

export async function agendarAlarmeMedicamento(
  id: number,
  medicamento: string,
  horario: string,
  data: Date
): Promise<boolean> {
  const timestamp = data.getTime();

  if (
    !Number.isFinite(timestamp) ||
    timestamp <= Date.now()
  ) {
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
  const timestamp = data.getTime();

  if (
    !Number.isFinite(timestamp) ||
    timestamp <= Date.now()
  ) {
    throw new Error("Data do alarme inválida");
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
  return MedicationAlarmModule.cancelarAlarme(id);
}

export async function restaurarAlarmesMedicamentos(): Promise<boolean> {
  return MedicationAlarmModule.restaurarAlarmes();
}
