
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
        val medicamento = intent.getStringExtra("medicamento")
            ?: "Medicamento"

        val horario = intent.getStringExtra("horario")
            ?: "--:--"

        val alarmeId = intent.getIntExtra("alarmeId", 0)

        Log.d(
            "LembraFacilAlarm",
            "Alarme recebido: $medicamento às $horario"
        )

        val serviceIntent = Intent(
            context,
            MedicationAlarmService::class.java
        ).apply {
            putExtra("medicamento", medicamento)
            putExtra("horario", horario)
            putExtra("alarmeId", alarmeId)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        // A abertura da tela será feita pela notificação
        // de alarme, respeitando as restrições do Android.
    }
}
