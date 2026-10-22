
package expo.modules.medicationalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class MedicationAlarmBootReceiver : BroadcastReceiver() {

    override fun onReceive(
        context: Context,
        intent: Intent
    ) {
        if (
            intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action !=
                "android.intent.action.MY_PACKAGE_REPLACED"
        ) {
            return
        }

        val pending = goAsync()

        Thread {
            try {
                AlarmScheduleStore.restore(context)
            } catch (e: Exception) {
                Log.e(
                    "LembraFacilAlarm",
                    "Erro ao restaurar alarmes",
                    e
                )
            } finally {
                pending.finish()
            }
        }.start()
    }
}
