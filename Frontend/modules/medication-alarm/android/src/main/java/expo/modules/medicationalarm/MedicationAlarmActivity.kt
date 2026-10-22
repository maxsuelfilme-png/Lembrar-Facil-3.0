
package expo.modules.medicationalarm

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class MedicationAlarmActivity : Activity() {

    private var medicamento = "Medicamento"
    private var horario = "--:--"
    private var alarmeId = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        medicamento = intent.getStringExtra("medicamento")
            ?: "Medicamento"

        horario = intent.getStringExtra("horario")
            ?: "--:--"

        alarmeId = intent.getIntExtra("alarmeId", 0)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(40, 40, 40, 40)
            setBackgroundColor(Color.rgb(18, 61, 42))
        }

        val titulo = TextView(this).apply {
            text = "Hora do medicamento!"
            textSize = 27f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }

        val descricao = TextView(this).apply {
            text = "$medicamento\n$horario"
            textSize = 23f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 35, 0, 45)
        }

        val desligar = Button(this).apply {
            text = "Desligar"

            setOnClickListener {
                pararDespertador()
                finish()
            }
        }

        val adiar = Button(this).apply {
            text = "Adiar 5 minutos"

            setOnClickListener {
                try {
                    val agendado = AlarmScheduleStore.snooze(
                        this@MedicationAlarmActivity,
                        alarmeId
                    )

                    if (agendado) {
                        pararDespertador()
                        finish()
                    } else {
                        Toast.makeText(
                            this@MedicationAlarmActivity,
                            "Alarme não encontrado",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(
                        this@MedicationAlarmActivity,
                        "Não foi possível adiar: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }

        layout.addView(titulo)
        layout.addView(descricao)
        layout.addView(desligar)
        layout.addView(adiar)

        setContentView(layout)
    }

    private fun pararDespertador() {
        startService(
            Intent(
                this,
                MedicationAlarmService::class.java
            ).apply {
                action = MedicationAlarmService.ACTION_STOP
            }
        )
    }
}
