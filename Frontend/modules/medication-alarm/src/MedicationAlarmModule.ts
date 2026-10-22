
import { requireNativeModule } from "expo-modules-core";

export type MedicationAlarmNativeModule = {
  verificarModulo(): Promise<string>;

  verificarPermissaoAlarme(): Promise<boolean>;

  solicitarPermissaoAlarme(): Promise<boolean>;

  agendarAlarme(
    id: number,
    medicamento: string,
    horario: string,
    timestamp: number
  ): Promise<boolean>;

  agendarTratamento(
    id: number,
    medicamento: string,
    horario: string,
    frequencia: string,
    duracao: string,
    timestamp: number
  ): Promise<boolean>;

  cancelarAlarme(id: number): Promise<boolean>;

  restaurarAlarmes(): Promise<boolean>;
};

export default requireNativeModule<MedicationAlarmNativeModule>(
  "MedicationAlarm"
);
