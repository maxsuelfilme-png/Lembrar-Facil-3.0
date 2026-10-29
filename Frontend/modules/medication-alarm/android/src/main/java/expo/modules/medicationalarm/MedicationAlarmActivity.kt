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
    private var processandoAcao = false

    private lateinit var descricao: TextView
    private lateinit var botaoDesligar: Button
    private lateinit var botaoAdiar: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configurarTelaBloqueada()
        atualizarDados(intent)
        construirTela()
        Log.i(TAG, "Tela aberta: id=$alarmeId medicamento=$medicamento")
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        atualizarDados(intent)
        processandoAcao = false
        if (::descricao.isInitialized) {
            descricao.text = "$medicamento\n$horario"
        }
        atualizarBotoes()
        Log.i(TAG, "Tela atualizada: id=$alarmeId medicamento=$medicamento")
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
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun atualizarDados(intent: Intent?) {
        medicamento = intent?.getStringExtra("medicamento")
            ?.takeIf { it.isNotBlank() } ?: "Medicamento"
        horario = intent?.getStringExtra("horario")
            ?.takeIf { it.isNotBlank() } ?: "--:--"
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

        botaoDesligar = Button(this).apply {
            text = "Desligar"
            setOnClickListener {
                if (processandoAcao) return@setOnClickListener
                if (!validarAlarme()) return@setOnClickListener
                processandoAcao = true
                atualizarBotoes()
                if (pararDespertador()) {
                    Log.i(TAG, "Alarme desligado pela tela: id=$alarmeId")
                    finish()
                } else {
                    processandoAcao = false
                    atualizarBotoes()
                }
            }
        }

        botaoAdiar = Button(this).apply {
            text = "Adiar 5 minutos"
            setOnClickListener {
                if (processandoAcao) return@setOnClickListener
                if (!validarAlarme()) return@setOnClickListener
                processandoAcao = true
                atualizarBotoes()
                try {
                    val agendado = AlarmScheduleStore.snooze(
                        this@MedicationAlarmActivity,
                        alarmeId
                    )
                    if (agendado) {
                        Log.i(TAG, "Alarme adiado: id=$alarmeId")
                        // O adiamento já foi agendado: não tente agendá-lo de novo.
                        if (pararDespertador()) {
                            finish()
                        } else {
                            // O novo disparo continua agendado mesmo se o
                            // serviço não puder ser encerrado agora.
                            finish()
                        }
                    } else {
                        mostrarMensagem("Não foi possível localizar este alarme")
                        processandoAcao = false
                        atualizarBotoes()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao adiar alarme $alarmeId", e)
                    mostrarMensagem("Não foi possível adiar o alarme")
                    processandoAcao = false
                    atualizarBotoes()
                }
            }
        }

        layout.addView(titulo)
        layout.addView(descricao)
        layout.addView(botaoDesligar)
        layout.addView(botaoAdiar)
        setContentView(layout)
        atualizarBotoes()
    }

    private fun validarAlarme(): Boolean {
        if (alarmeId > 0) return true
        Log.w(TAG, "Ação recusada: ID de alarme inválido ($alarmeId)")
        mostrarMensagem("Identificação do alarme inválida")
        return false
    }

    private fun atualizarBotoes() {
        val habilitados = !processandoAcao && alarmeId > 0
        if (::botaoDesligar.isInitialized) botaoDesligar.isEnabled = habilitados
        if (::botaoAdiar.isInitialized) botaoAdiar.isEnabled = habilitados
    }

    private fun mostrarMensagem(mensagem: String) {
        Toast.makeText(this, mensagem, Toast.LENGTH_LONG).show()
    }

    private fun pararDespertador(): Boolean {
        return try {
            startService(
                Intent(this, MedicationAlarmService::class.java).apply {
                    action = MedicationAlarmService.ACTION_STOP
                    putExtra("alarmeId", alarmeId)
                }
            )
            true
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar comando Desligar para $alarmeId", e)
            mostrarMensagem("Não foi possível desligar o despertador")
            false
        }
    }
}
