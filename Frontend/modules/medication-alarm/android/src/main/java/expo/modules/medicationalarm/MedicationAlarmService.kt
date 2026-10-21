
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

    companion object {
        const val CHANNEL_ID = "lembrafacil_alarme"
        const val NOTIFICATION_ID = 5001
        const val ACTION_STOP = "STOP_ALARM"
    }

    override fun onCreate() {
        super.onCreate()
        criarCanalNotificacao()
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int
    ): Int {

        if (intent?.action == ACTION_STOP) {
            pararSom()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        val medicamento = intent?.getStringExtra("medicamento")
            ?: "Medicamento"

        val horario = intent?.getStringExtra("horario")
            ?: "--:--"

        val alarmeId = intent?.getIntExtra("alarmeId", 0) ?: 0

        val notificacao = criarNotificacao(
            medicamento,
            horario,
            alarmeId
        )

        startForeground(
            NOTIFICATION_ID,
            notificacao
        )

        iniciarSom()

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
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(canal)
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

        val abrirTelaPendingIntent = PendingIntent.getActivity(
            this,
            5003,
            abrirTelaIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        val pararIntent = Intent(
            this,
            MedicationAlarmService::class.java
        ).apply {
            action = ACTION_STOP
        }

        val pararPendingIntent = PendingIntent.getService(
            this,
            5002,
            pararIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        val builder = if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
        ) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("Hora do medicamento!")
            .setContentText("$medicamento - $horario")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setCategory(Notification.CATEGORY_ALARM)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setPriority(Notification.PRIORITY_HIGH)
            .setOngoing(true)
            .setContentIntent(abrirTelaPendingIntent)
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
        if (mediaPlayer != null) return

        try {
            val uri = RingtoneManager.getDefaultUri(
                RingtoneManager.TYPE_ALARM
            ) ?: RingtoneManager.getDefaultUri(
                RingtoneManager.TYPE_NOTIFICATION
            )

            mediaPlayer = MediaPlayer().apply {
                setDataSource(applicationContext, uri)

                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(
                            AudioAttributes.CONTENT_TYPE_SONIFICATION
                        )
                        .build()
                )

                isLooping = true
                prepare()
                start()
            }
        } catch (erro: Exception) {
            Log.e(
                "LembraFacilAlarm",
                "Erro ao reproduzir alarme",
                erro
            )
            pararSom()
        }
    }

    private fun pararSom() {
        mediaPlayer?.run {
            try {
                if (isPlaying) stop()
            } catch (_: Exception) {
            }
            release()
        }

        mediaPlayer = null
    }

    override fun onDestroy() {
        pararSom()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
