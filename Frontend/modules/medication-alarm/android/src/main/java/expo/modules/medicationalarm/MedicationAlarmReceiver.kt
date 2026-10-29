
package expo.modules.medicationalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class MedicationAlarmReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "LembraFacilAlarm"

        private const val ACTION_REGULAR =
            "expo.modules.medicationalarm.REGULAR"

        private const val ACTION_SNOOZE =
            "expo.modules.medicationalarm.SNOOZE"
    }

    override fun onReceive(
        context: Context,
        intent: Intent
    ) {
        val action = intent.action

        if (action != ACTION_REGULAR &&
            action != ACTION_SNOOZE
        ) {
            Log.w(
                TAG,
                "Ação de alarme desconhecida: $action"
            )
            return
        }

        val id = intent.data
            ?.lastPathSegment
            ?.toIntOrNull()
            ?: intent.getIntExtra("alarmeId", 0)

        Log.i(
            TAG,
            "RECEIVER ACIONADO id=$id action=$action"
        )

        if (id <= 0) {
            Log.e(TAG, "ID do alarme inválido")
            return
        }

        val isSnooze = action == ACTION_SNOOZE

        val schedule = try {
            if (isSnooze) {
                AlarmScheduleStore.get(context, id)
            } else {
                AlarmScheduleStore.fired(context, id)
            }
        } catch (erro: Exception) {
            Log.e(
                TAG,
                "Erro ao processar alarme id=$id",
                erro
            )
            null
        }

        if (schedule == null) {
            Log.w(
                TAG,
                "Alarme ignorado: programação não encontrada id=$id"
            )
            return
        }

        val medicamento = schedule.optString(
            "name",
            "Medicamento"
        )

        val horario = schedule.optString(
            "time",
            "--:--"
        )

        val serviceIntent = Intent(
            context,
            MedicationAlarmService::class.java
        ).apply {
            putExtra("medicamento", medicamento)
            putExtra("horario", horario)
            putExtra("alarmeId", id)
        }

        try {
            if (Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.O
            ) {
                context.startForegroundService(
                    serviceIntent
                )
            } else {
                context.startService(
                    serviceIntent
                )
            }

            Log.i(
                TAG,
                "SERVIÇO DE ALARME SOLICITADO id=$id"
            )

        } catch (erro: Exception) {
            Log.e(
                TAG,
                "FALHA AO INICIAR SERVIÇO id=$id",
                erro
            )
        }
    }
}
