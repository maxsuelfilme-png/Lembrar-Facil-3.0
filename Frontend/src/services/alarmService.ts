
import MedicationAlarmModule from "../modules/medication-alarm/src/MedicationAlarmModule";

export async function verificarAlarmeAndroid() {
  return MedicationAlarmModule.verificarModulo();
}

export async function verificarPermissaoAlarme() {
  return MedicationAlarmModule.verificarPermissaoAlarme();
}

export async function agendarAlarmeMedicamento(
  id: number,
  medicamento: string,
  horario: string,
  data: Date
) {
  const timestamp = data.getTime();

  if (Number.isNaN(timestamp)) {
    throw new Error("Data inválida para o alarme");
  }

  return MedicationAlarmModule.agendarAlarme(
    id,
    medicamento,
    horario,
    timestamp
  );
}

export async function cancelarAlarmeMedicamento(
  id: number
) {
  return MedicationAlarmModule.cancelarAlarme(id);
}
