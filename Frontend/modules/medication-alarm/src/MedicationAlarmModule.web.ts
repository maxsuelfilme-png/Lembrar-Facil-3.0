import { registerWebModule, NativeModule } from 'expo';

// MedicationAlarmModule is not available on the web platform.
class MedicationAlarmModule extends NativeModule<{}> {}

export default registerWebModule(MedicationAlarmModule, 'MedicationAlarmModule');
