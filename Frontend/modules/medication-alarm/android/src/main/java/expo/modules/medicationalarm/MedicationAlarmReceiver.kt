
package expo.modules.medicationalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class MedicationAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(
        context: Context,
        intent: Intent
    ) {
        val id = intent.data
            ?.lastPathSegment
            ?.toIntOrNull()
            ?: intent.getIntExtra("alarmeId", 0)

        if (id <= 0) return

        val isSnooze = intent.action ==
            "expo.modules.medicationalarm.SNOOZE"

        val schedule = try {
            if (isSnooze) {
                AlarmScheduleStore.get(context, id)
            } else {
                AlarmScheduleStore.fired(context, id)
            }
        } catch (e: Exception) {
            Log.e(
                "LembraFacilAlarm",
                "Falha ao reagendar",
                e
            )
            null
        } ?: return

        val service = Intent(
            context,
            MedicationAlarmService::class.java
        ).apply {
            putExtra(
                "medicamento",
                schedule.optString("name", "Medicamento")
            )
            putExtra(
                "horario",
                schedule.optString("time", "--:--")
            )
            putExtra("alarmeId", id)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(service)
        } else {
            context.startService(service)
        }
    }
}
