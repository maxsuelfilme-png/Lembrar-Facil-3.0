
package expo.modules.medicationalarm

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class MedicationAlarmActivity : Activity() {

    companion object {
        private const val TAG = "LembraFacilAlarm"
    }

    private var medicamento = "Medicamento"
    private var horario = "--:--"
    private var alarmeId = 0

    private lateinit var descricao: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        configurarTelaBloqueada()
        atualizarDados(intent)
        construirTela()

        Log.i(
            TAG,
            "Tela aberta: id=$alarmeId medicamento=$medicamento"
        )
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)

        setIntent(intent)
        atualizarDados(intent)

        if (::descricao.isInitialized) {
            descricao.text = "$medicamento\n$horario"
        }

        Log.i(
            TAG,
            "Tela atualizada: id=$alarmeId medicamento=$medicamento"
        )
    }

    private fun configurarTelaBloqueada() {
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
    }

    private fun atualizarDados(intent: Intent?) {
        medicamento = intent?.getStringExtra("medicamento")
            ?: "Medicamento"

        horario = intent?.getStringExtra("horario")
            ?: "--:--"

        alarmeId = intent?.getIntExtra("alarmeId", 0) ?: 0
    }

    private fun construirTela() {
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

        descricao = TextView(this).apply {
            text = "$medicamento\n$horario"
            textSize = 23f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 35, 0, 45)
        }

        val desligar = Button(this).apply {
            text = "Desligar"

            setOnClickListener {
                Log.i(
                    TAG,
                    "Botão Desligar: id=$alarmeId"
                )

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
                        Log.i(
                            TAG,
                            "Alarme adiado: id=$alarmeId"
                        )

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
                    Log.e(
                        TAG,
                        "Erro ao adiar alarme $alarmeId",
                        e
                    )

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

                // Identifica exatamente qual alarme
                // o usuário está desligando.
                putExtra("alarmeId", alarmeId)
            }
        )
    }
}
