
package expo.modules.medicationalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MedicationAlarmModule : Module() {

    override fun definition() = ModuleDefinition {

        Name("MedicationAlarm")

        AsyncFunction("verificarModulo") {
            "MedicationAlarm conectado ao Android"
        }

        AsyncFunction("verificarPermissaoAlarme") {
            val context = appContext.reactContext
                ?: throw IllegalStateException("Contexto Android indisponível")

            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager.canScheduleExactAlarms()
            } else {
                true
            }
        }

        AsyncFunction(
            "agendarAlarme"
        ) { id: Int, medicamento: String, horario: String, timestamp: Double ->

            val context = appContext.reactContext
                ?: throw IllegalStateException("Contexto Android indisponível")

            val horarioMillis = timestamp.toLong()

            require(horarioMillis > System.currentTimeMillis()) {
                "O horário do alarme precisa estar no futuro"
            }

            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            if (
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                !alarmManager.canScheduleExactAlarms()
            ) {
                throw IllegalStateException(
                    "Permissão para alarmes exatos não concedida"
                )
            }

            val intent = Intent(
                context,
                MedicationAlarmReceiver::class.java
            ).apply {
                putExtra("medicamento", medicamento)
                putExtra("horario", horario)
                putExtra("alarmeId", id)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
            )

            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                horarioMillis,
                pendingIntent
            )

            true
        }

        AsyncFunction("cancelarAlarme") { id: Int ->

            val context = appContext.reactContext
                ?: throw IllegalStateException("Contexto Android indisponível")

            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            val intent = Intent(
                context,
                MedicationAlarmReceiver::class.java
            )

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                id,
                intent,
                PendingIntent.FLAG_NO_CREATE or
                    PendingIntent.FLAG_IMMUTABLE
            )

            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }

            true
        }
    }
}
