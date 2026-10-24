
package expo.modules.medicationalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.util.Calendar

object AlarmScheduleStore {

    private const val TAG = "LembraFacilAlarm"

    private const val PREFS =
        "lembrafacil_alarm_schedules_v2"

    private const val ACTION_REGULAR =
        "expo.modules.medicationalarm.REGULAR"

    private const val ACTION_SNOOZE =
        "expo.modules.medicationalarm.SNOOZE"

    private fun prefs(context: Context) =
        context.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE
        )

    private fun key(id: Int) = "med_$id"

    private fun manager(context: Context) =
        context.getSystemService(
            Context.ALARM_SERVICE
        ) as AlarmManager

    // ==================================================
    // FREQUÊNCIA
    // ==================================================

    fun intervalHours(raw: String): Int {
        val value = raw.trim()
            .lowercase()
            .replace(Regex("\\s+"), " ")

        val daily = mapOf(
            "1" to 24,
            "1 vez" to 24,
            "1 vez ao dia" to 24,
            "uma vez ao dia" to 24,
            "diariamente" to 24,
            "diário" to 24,
            "diaria" to 24,
            "diária" to 24,
            "todos os dias" to 24,
            "24h" to 24,
            "24 horas" to 24,
            "2" to 12,
            "2 vezes" to 12,
            "2 vezes ao dia" to 12,
            "3" to 8,
            "3 vezes" to 8,
            "3 vezes ao dia" to 8,
            "4" to 6,
            "4 vezes" to 6,
            "4 vezes ao dia" to 6
        )

        daily[value]?.let { return it }

        val repeated = Regex(
            "^(\\d{1,2}) em (\\d{1,2}) horas?$"
        ).matchEntire(value)

        if (repeated != null) {
            val a = repeated.groupValues[1].toInt()
            val b = repeated.groupValues[2].toInt()

            require(a == b && a in 1..12) {
                "Intervalo deve ser de 1 a 12 horas"
            }

            return a
        }

        val simple = Regex(
            "^(?:a cada )?(\\d{1,2})\\s*(h|horas?|hrs?)$"
        ).matchEntire(value)

        if (simple != null) {
            val hours = simple.groupValues[1].toInt()

            require(hours in 1..12) {
                "Intervalo deve ser de 1 a 12 horas"
            }

            return hours
        }

        throw IllegalArgumentException(
            "Frequência não reconhecida: $raw"
        )
    }

    // ==================================================
    // DURAÇÃO
    // ==================================================

    private fun durationDays(raw: String): Int {
        val match = Regex(
            "^(\\d{1,4})(?:\\s*dias?)?$"
        ).matchEntire(raw.trim().lowercase())
            ?: throw IllegalArgumentException(
                "Duração não reconhecida: $raw"
            )

        val days = match.groupValues[1].toInt()

        require(days in 1..3650) {
            "Duração fora do limite"
        }

        return days
    }

    // ==================================================
    // PERMISSÃO
    // ==================================================

    private fun checkPermission(context: Context) {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            !manager(context).canScheduleExactAlarms()
        ) {
            throw IllegalStateException(
                "Permissão de alarmes exatos não concedida"
            )
        }
    }

    // ==================================================
    // INTENTS INDIVIDUAIS
    // ==================================================

    private fun alarmIntent(
        context: Context,
        id: Int,
        snooze: Boolean
    ): Intent {
        return Intent(
            context,
            MedicationAlarmReceiver::class.java
        ).apply {
            action = if (snooze) {
                ACTION_SNOOZE
            } else {
                ACTION_REGULAR
            }

            data = Uri.parse(
                "lembrafacil://alarm/" +
                    "${if (snooze) "snooze" else "regular"}/$id"
            )
        }
    }

    private fun pending(
        context: Context,
        id: Int,
        snooze: Boolean,
        flags: Int
    ): PendingIntent? {
        return PendingIntent.getBroadcast(
            context,
            id,
            alarmIntent(context, id, snooze),
            flags or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun cancelPending(
        context: Context,
        id: Int,
        snooze: Boolean
    ) {
        val pi = pending(
            context,
            id,
            snooze,
            PendingIntent.FLAG_NO_CREATE
        ) ?: return

        manager(context).cancel(pi)
        pi.cancel()
    }

    // ==================================================
    // ARMAZENAMENTO
    // ==================================================

    private fun save(
        context: Context,
        id: Int,
        data: JSONObject
    ) {
        check(
            prefs(context).edit()
                .putString(key(id), data.toString())
                .commit()
        ) {
            "Falha ao salvar programação"
        }
    }

    fun get(
        context: Context,
        id: Int
    ): JSONObject? {
        return try {
            prefs(context)
                .getString(key(id), null)
                ?.let { JSONObject(it) }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao consultar alarme $id", e)
            null
        }
    }

    // ==================================================
    // FIM DO TRATAMENTO
    // ==================================================

    private fun endExclusive(
        first: Long,
        days: Int
    ): Long {
        return Calendar.getInstance().apply {
            timeInMillis = first

            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)

            add(Calendar.DAY_OF_YEAR, days)
        }.timeInMillis
    }

    // ==================================================
    // PENDING INTENT DE AGENDAMENTO
    // ==================================================

    private fun schedule(
        context: Context,
        data: JSONObject
    ) {
        checkPermission(context)

        val id = data.getInt("id")
        val next = data.getLong("next")
        val end = data.getLong("end")

        if (next >= end) {
            Log.d(TAG, "Tratamento encerrado: $id")
            return
        }

        val pi = pending(
            context,
            id,
            false,
            PendingIntent.FLAG_UPDATE_CURRENT
        ) ?: error("PendingIntent indisponível")

        manager(context).setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            next,
            pi
        )

        Log.i(
            TAG,
            "ALARME AGENDADO id=$id proximo=$next"
        )
    }

    // ==================================================
    // CRIAR ALARME
    // ==================================================

    fun create(
        context: Context,
        id: Int,
        name: String,
        time: String,
        frequency: String,
        duration: String,
        first: Long
    ) {
        require(id > 0 && name.isNotBlank()) {
            "Medicamento inválido"
        }

        require(first > System.currentTimeMillis()) {
            "Primeiro horário precisa estar no futuro"
        }

        val hours = intervalHours(frequency)
        val days = durationDays(duration)

        val match = Regex(
            "^(\\d{2}):(\\d{2})$"
        ).matchEntire(time.trim())
            ?: throw IllegalArgumentException(
                "Horário deve estar em HH:MM"
            )

        val h = match.groupValues[1].toInt()
        val m = match.groupValues[2].toInt()

        require(h in 0..23 && m in 0..59) {
            "Horário inválido"
        }

        checkPermission(context)

        val end = endExclusive(first, days)

        require(first < end) {
            "Primeiro alarme fora da duração"
        }

        val data = JSONObject().apply {
            put("id", id)
            put("name", name)
            put("time", time)
            put("hours", hours)
            put("first", first)
            put("next", first)
            put("end", end)
        }

        // Mantém a programação anterior para
        // restaurá-la caso o novo agendamento falhe.
        val previous = get(context, id)

        try {
            schedule(context, data)
            save(context, id, data)

            Log.i(
                TAG,
                "MEDICAMENTO AGENDADO id=$id nome=$name"
            )
        } catch (e: Exception) {
            Log.e(
                TAG,
                "Falha ao agendar medicamento $id",
                e
            )

            // Se havia programação anterior,
            // tenta restaurá-la.
            if (previous != null) {
                try {
                    schedule(context, previous)
                    save(context, id, previous)
                } catch (restoreError: Exception) {
                    Log.e(
                        TAG,
                        "Falha ao restaurar alarme $id",
                        restoreError
                    )
                }
            } else {
                cancelPending(context, id, false)
                prefs(context).edit()
                    .remove(key(id))
                    .commit()
            }

            throw e
        }

        // Um cadastro novo substitui somente o
        // adiamento pendente deste medicamento.
        cancelPending(context, id, true)
    }

    // ==================================================
    // PRÓXIMA DOSE
    // ==================================================

    private fun nextAfter(
        data: JSONObject,
        now: Long
    ): Long {
        val first = data.getLong("first")
        val hours = data.getInt("hours")

        if (hours == 24) {
            val calendar =
                Calendar.getInstance().apply {
                    timeInMillis = first
                }

            while (calendar.timeInMillis <= now) {
                calendar.add(
                    Calendar.DAY_OF_YEAR,
                    1
                )
            }

            return calendar.timeInMillis
        }

        val step = hours * 60L * 60L * 1000L

        val intervals = if (now < first) {
            0L
        } else {
            ((now - first) / step) + 1
        }

        return first + intervals * step
    }

    // ==================================================
    // DISPARO
    // ==================================================

    fun fired(
        context: Context,
        id: Int
    ): JSONObject? {
        val data = get(context, id)
            ?: run {
                Log.w(
                    TAG,
                    "Alarme recebido sem cadastro: $id"
                )
                return null
            }

        val now = System.currentTimeMillis()
        val due = data.optLong("next", 0L)

        if (
            due <= 0 ||
            due > now + 90_000L ||
            now - due > 30 * 60_000L
        ) {
            Log.w(
                TAG,
                "Disparo ignorado id=$id due=$due now=$now"
            )
            return null
        }

        Log.i(
            TAG,
            "ALARME DISPAROU id=$id"
        )

        val next = nextAfter(data, now)

        data.put("next", next)
        save(context, id, data)

        if (next < data.getLong("end")) {
            try {
                schedule(context, data)
            } catch (e: Exception) {
                Log.e(
                    TAG,
                    "Falha ao programar próxima dose $id",
                    e
                )
            }
        }

        return data
    }

    // ==================================================
    // ADIAR CINCO MINUTOS
    // ==================================================

    fun snooze(
        context: Context,
        id: Int
    ): Boolean {
        if (get(context, id) == null) {
            return false
        }

        checkPermission(context)

        val pi = pending(
            context,
            id,
            true,
            PendingIntent.FLAG_UPDATE_CURRENT
        ) ?: return false

        manager(context).setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis() +
                5 * 60_000L,
            pi
        )

        Log.i(TAG, "ALARME ADIADO id=$id")

        return true
    }

    // ==================================================
    // CANCELAR
    // ==================================================

    fun cancel(
        context: Context,
        id: Int
    ) {
        cancelPending(context, id, false)
        cancelPending(context, id, true)

        // Compatibilidade com alarmes antigos.
        val legacy = PendingIntent.getBroadcast(
            context,
            id,
            Intent(
                context,
                MedicationAlarmReceiver::class.java
            ),
            PendingIntent.FLAG_NO_CREATE or
                PendingIntent.FLAG_IMMUTABLE
        )

        if (legacy != null) {
            manager(context).cancel(legacy)
            legacy.cancel()
        }

        prefs(context).edit()
            .remove(key(id))
            .commit()

        Log.i(TAG, "ALARME CANCELADO id=$id")
    }

    // ==================================================
    // RESTAURAR ALARMES
    // ==================================================

    fun restore(
        context: Context
    ): Boolean {
        checkPermission(context)

        val now = System.currentTimeMillis()

        val ids = prefs(context)
            .all.keys
            .filter { it.startsWith("med_") }

        for (storedKey in ids) {
            val id = storedKey
                .removePrefix("med_")
                .toIntOrNull()
                ?: continue

            try {
                val data = get(context, id)
                    ?: continue

                val currentNext =
                    data.optLong("next", 0L)

                val next = if (currentNext > now) {
                    currentNext
                } else {
                    nextAfter(data, now)
                }

                data.put("next", next)

                if (next < data.getLong("end")) {
                    schedule(context, data)
                    save(context, id, data)

                    Log.i(
                        TAG,
                        "ALARME RESTAURADO id=$id"
                    )
                }
            } catch (e: Exception) {
                Log.e(
                    TAG,
                    "Falha ao restaurar alarme $id",
                    e
                )
            }
        }

        return true
    }
}
