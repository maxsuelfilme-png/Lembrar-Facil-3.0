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
        const val ACTION_SNOOZE = "SNOOZE_ALARM"
    }

    override fun onCreate() {
        super.onCreate()
        criarCanalNotificacao()
        Log.i(TAG, "Serviço do despertador criado")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) {
            Log.w(TAG, "Serviço iniciado sem Intent")
            stopSelfResult(startId)
            return START_NOT_STICKY
        }

        if (intent.action == ACTION_STOP || intent.action == ACTION_SNOOZE) {
            val solicitado = intent.getIntExtra("alarmeId", -1)
            val ativo = alarmeAtivoId
            if (ativo == null || solicitado != ativo) {
                Log.w(TAG, "Ação ignorada: id=$solicitado ativo=$ativo")
                return START_NOT_STICKY
            }

            if (intent.action == ACTION_SNOOZE) {
                val adiado = try {
                    AlarmScheduleStore.snooze(this, solicitado)
                } catch (e: Exception) {
                    Log.e(TAG, "Não foi possível adiar o alarme $solicitado", e)
                    false
                }
                if (!adiado) {
                    Log.w(TAG, "Alarme não foi adiado: $solicitado")
                    return START_NOT_STICKY
                }
                Log.i(TAG, "Alarme adiado por cinco minutos: $solicitado")
            } else {
                Log.i(TAG, "Alarme desligado: $solicitado")
            }

            pararSom()
            alarmeAtivoId = null
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelfResult(startId)
            return START_NOT_STICKY
        }

        val medicamento = intent.getStringExtra("medicamento") ?: "Medicamento"
        val horario = intent.getStringExtra("horario") ?: "--:--"
        val id = intent.getIntExtra("alarmeId", 0)
        if (id <= 0) {
            Log.e(TAG, "Alarme com ID inválido: $id")
            stopSelfResult(startId)
            return START_NOT_STICKY
        }

        if (alarmeAtivoId != null && alarmeAtivoId != id) {
            Log.w(TAG, "Novo alarme $id substituiu o alarme ativo $alarmeAtivoId")
        }

        pararSom()
        alarmeAtivoId = id

        try {
            val notificacao = criarNotificacao(medicamento, horario, id)
            startForeground(NOTIFICATION_ID, notificacao)
            Log.i(TAG, "Notificação foreground iniciada para id=$id")
            iniciarSom()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar alarme id=$id", e)
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
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                enableVibration(true)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(canal)
        }
    }

    private fun criarNotificacao(medicamento: String, horario: String, id: Int): Notification {
        val abrirTela = Intent(this, MedicationAlarmActivity::class.java).apply {
            putExtra("medicamento", medicamento)
            putExtra("horario", horario)
            putExtra("alarmeId", id)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val abrirTelaPi = PendingIntent.getActivity(
            this, id, abrirTela,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val desligarPi = PendingIntent.getService(
            this, id,
            Intent(this, MedicationAlarmService::class.java).apply {
                action = ACTION_STOP
                putExtra("alarmeId", id)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val adiarPi = PendingIntent.getService(
            this, id,
            Intent(this, MedicationAlarmService::class.java).apply {
                action = ACTION_SNOOZE
                putExtra("alarmeId", id)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val manager = getSystemService(NotificationManager::class.java)
        val telaCheiaPermitida = if (Build.VERSION.SDK_INT >= 34) {
            manager.canUseFullScreenIntent()
        } else {
            true
        }
        if (!telaCheiaPermitida) {
            Log.w(TAG, "Permissão de tela cheia indisponível; usuário pode abrir pelo aviso")
        }

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
            .setAutoCancel(false)
            .setContentIntent(abrirTelaPi)
            .setFullScreenIntent(abrirTelaPi, telaCheiaPermitida)
            .addAction(android.R.drawable.ic_media_pause, "Desligar", desligarPi)
            .addAction(android.R.drawable.ic_popup_reminder, "Adiar 5 min", adiarPi)
            .build()
    }

    private fun iniciarSom() {
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                ?: throw IllegalStateException("Nenhum toque de alarme disponível")
            val player = MediaPlayer()
            try {
                player.setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                player.setDataSource(applicationContext, uri)
                player.isLooping = true
                player.prepare()
                player.start()
                mediaPlayer = player
                Log.i(TAG, "SOM INICIADO id=$alarmeAtivoId")
            } catch (e: Exception) {
                player.release()
                throw e
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao reproduzir som do alarme", e)
            pararSom()
        }
    }

    private fun pararSom() {
        val player = mediaPlayer
        mediaPlayer = null
        if (player != null) {
            try {
                if (player.isPlaying) player.stop()
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao parar reprodução", e)
            }
            try {
                player.release()
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao liberar MediaPlayer", e)
            }
        }
    }

    override fun onDestroy() {
        pararSom()
        alarmeAtivoId = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}