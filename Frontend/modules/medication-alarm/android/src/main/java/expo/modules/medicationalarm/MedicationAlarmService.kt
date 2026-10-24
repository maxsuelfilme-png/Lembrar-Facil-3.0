
package expo.modules.medicationalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.util.Log

class MedicationAlarmService : Service() {

    private var mediaPlayer: MediaPlayer? = null
    private var alarmeAtivoId: Int? = null

    companion object {
        private const val TAG = "LembraFacilAlarm"

        const val CHANNEL_ID = "lembrafacil_alarme"
        const val NOTIFICATION_ID = 5001
        const val ACTION_STOP = "STOP_ALARM"
    }

    override fun onCreate() {
        super.onCreate()
        criarCanalNotificacao()

        Log.i(TAG, "Serviço do despertador criado")
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int
    ): Int {

        if (intent?.action == ACTION_STOP) {

            val idParaDesligar = intent.getIntExtra(
                "alarmeId",
                -1
            )

            if (
                alarmeAtivoId != null &&
                idParaDesligar != alarmeAtivoId
            ) {
                Log.w(
                    TAG,
                    "Comando Desligar ignorado: " +
                        "id=$idParaDesligar ativo=$alarmeAtivoId"
                )

                return START_NOT_STICKY
            }

            Log.i(
                TAG,
                "Desligando alarme id=$idParaDesligar"
            )

            pararSom()
            alarmeAtivoId = null

            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelfResult(startId)

            return START_NOT_STICKY
        }

        if (intent == null) {
            Log.w(TAG, "Serviço iniciado sem Intent")
            return START_NOT_STICKY
        }

        val medicamento = intent.getStringExtra(
            "medicamento"
        ) ?: "Medicamento"

        val horario = intent.getStringExtra(
            "horario"
        ) ?: "--:--"

        val alarmeId = intent.getIntExtra(
            "alarmeId",
            0
        )

        Log.i(
            TAG,
            "Recebido alarme id=$alarmeId " +
                "medicamento=$medicamento horario=$horario"
        )

        // Se outro medicamento disparar enquanto
        // o serviço está ativo, encerra o som anterior
        // antes de iniciar o novo.
        pararSom()

        alarmeAtivoId = alarmeId

        val notificacao = criarNotificacao(
            medicamento,
            horario,
            alarmeId
        )

        try {
            startForeground(
                NOTIFICATION_ID,
                notificacao
            )

            Log.i(
                TAG,
                "Notificação de alarme iniciada: $alarmeId"
            )

            iniciarSom()

        } catch (erro: Exception) {
            Log.e(
                TAG,
                "Erro ao iniciar alarme $alarmeId",
                erro
            )

            pararSom()
            alarmeAtivoId = null
            stopSelfResult(startId)
        }

        return START_NOT_STICKY
    }

    private fun criarCanalNotificacao() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            val canal = NotificationChannel(
                CHANNEL_ID,
                "Despertador de medicamentos",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alarmes do LembraFácil"
                lockscreenVisibility =
                    Notification.VISIBILITY_PUBLIC
            }

            getSystemService(
                NotificationManager::class.java
            ).createNotificationChannel(canal)
        }
    }

    private fun criarNotificacao(
        medicamento: String,
        horario: String,
        alarmeId: Int
    ): Notification {

        val abrirTelaIntent = Intent(
            this,
            MedicationAlarmActivity::class.java
        ).apply {

            putExtra("medicamento", medicamento)
            putExtra("horario", horario)
            putExtra("alarmeId", alarmeId)

            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val abrirTelaPendingIntent =
            PendingIntent.getActivity(
                this,
                alarmeId,
                abrirTelaIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
            )

        val pararIntent = Intent(
            this,
            MedicationAlarmService::class.java
        ).apply {

            action = ACTION_STOP
            putExtra("alarmeId", alarmeId)
        }

        val pararPendingIntent =
            PendingIntent.getService(
                this,
                alarmeId,
                pararIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
            )

        val builder =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Notification.Builder(this, CHANNEL_ID)
            } else {
                Notification.Builder(this)
            }

        return builder
            .setContentTitle("Hora do medicamento!")
            .setContentText("$medicamento - $horario")
            .setSmallIcon(
                android.R.drawable.ic_lock_idle_alarm
            )
            .setCategory(Notification.CATEGORY_ALARM)
            .setVisibility(
                Notification.VISIBILITY_PUBLIC
            )
            .setPriority(
                Notification.PRIORITY_HIGH
            )
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(
                abrirTelaPendingIntent
            )
            .setFullScreenIntent(
                abrirTelaPendingIntent,
                true
            )
            .addAction(
                android.R.drawable.ic_media_pause,
                "Desligar",
                pararPendingIntent
            )
            .build()
    }

    private fun iniciarSom() {

        try {

            val uri =
                RingtoneManager.getDefaultUri(
                    RingtoneManager.TYPE_ALARM
                ) ?: RingtoneManager.getDefaultUri(
                    RingtoneManager.TYPE_NOTIFICATION
                ) ?: throw IllegalStateException(
                    "Nenhum toque de alarme disponível"
                )

            val player = MediaPlayer()

            try {
                player.setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(
                            AudioAttributes.USAGE_ALARM
                        )
                        .setContentType(
                            AudioAttributes
                                .CONTENT_TYPE_SONIFICATION
                        )
                        .build()
                )

                player.setDataSource(
                    applicationContext,
                    uri
                )

                player.isLooping = true
                player.prepare()
                player.start()

                mediaPlayer = player

                Log.i(
                    TAG,
                    "SOM INICIADO id=$alarmeAtivoId"
                )

            } catch (erro: Exception) {
                player.release()
                throw erro
            }

        } catch (erro: Exception) {

            Log.e(
                TAG,
                "Erro ao reproduzir som do alarme",
                erro
            )

            pararSom()
        }
    }

    private fun pararSom() {

        val player = mediaPlayer
        mediaPlayer = null

        if (player != null) {

            try {
                if (player.isPlaying) {
                    player.stop()
                }
            } catch (erro: Exception) {
                Log.w(
                    TAG,
                    "Erro ao parar reprodução",
                    erro
                )
            }

            try {
                player.release()
            } catch (erro: Exception) {
                Log.w(
                    TAG,
                    "Erro ao liberar MediaPlayer",
                    erro
                )
            }
        }

        Log.d(TAG, "Som encerrado")
    }

    override fun onDestroy() {

        Log.i(
            TAG,
            "Serviço destruído; alarme=$alarmeAtivoId"
        )

        pararSom()
        alarmeAtivoId = null

        super.onDestroy()
    }

    override fun onBind(
        intent: Intent?
    ): IBinder? = null
}
