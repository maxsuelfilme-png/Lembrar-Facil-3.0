
package expo.modules.medicationalarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings

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
                ?: error("Contexto Android indisponível")

            val manager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
                manager.canScheduleExactAlarms()
        }

        AsyncFunction("solicitarPermissaoAlarme") {
            val context = appContext.reactContext
                ?: error("Contexto Android indisponível")

            val manager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            if (
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                !manager.canScheduleExactAlarms()
            ) {
                context.startActivity(
                    Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
                    ).apply {
                        data = Uri.parse(
                            "package:${context.packageName}"
                        )
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                )
                false
            } else {
                true
            }
        }

        // Mantém a função de teste existente.
        AsyncFunction("agendarAlarme") {
            id: Int,
            medicamento: String,
            horario: String,
            timestamp: Double ->

            val context = appContext.reactContext
                ?: error("Contexto Android indisponível")

            AlarmScheduleStore.create(
                context,
                id,
                medicamento,
                horario,
                "1 vez ao dia",
                "1 dia",
                timestamp.toLong()
            )

            true
        }

        // Agenda conforme frequência e duração.
        AsyncFunction("agendarTratamento") {
            id: Int,
            medicamento: String,
            horario: String,
            frequencia: String,
            duracao: String,
            timestamp: Double ->

            val context = appContext.reactContext
                ?: error("Contexto Android indisponível")

            AlarmScheduleStore.create(
                context,
                id,
                medicamento,
                horario,
                frequencia,
                duracao,
                timestamp.toLong()
            )

            true
        }

        AsyncFunction("cancelarAlarme") { id: Int ->
            val context = appContext.reactContext
                ?: error("Contexto Android indisponível")

            AlarmScheduleStore.cancel(context, id)

            true
        }

        AsyncFunction("restaurarAlarmes") {
            val context = appContext.reactContext
                ?: error("Contexto Android indisponível")

            AlarmScheduleStore.restore(context)
        }
    }
}
