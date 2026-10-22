
package expo.modules.medicationalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import org.json.JSONObject
import java.util.Calendar

object AlarmScheduleStore {

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
    // INTERPRETAR FREQUÊNCIA
    // ==================================================

    fun intervalHours(raw: String): Int {

        val value = raw.trim()
            .lowercase()
            .replace(Regex("\\s+"), " ")

        // Uma vez ao dia.
        if (
            value in setOf(
                "1",
                "1 vez",
                "1 vez ao dia",
                "uma vez ao dia",
                "diariamente",
                "diário",
                "diaria",
                "diária",
                "todos os dias",
                "24h",
                "24 horas"
            )
        ) {
            return 24
        }

        // Duas vezes ao dia.
        if (
            value in setOf(
                "2",
                "2 vezes",
                "2 vezes ao dia",
                "12h",
                "12 horas"
            )
        ) {
            return 12
        }

        // Três vezes ao dia.
        if (
            value in setOf(
                "3",
                "3 vezes",
                "3 vezes ao dia",
                "8h",
                "8 horas"
            )
        ) {
            return 8
        }

        // Quatro vezes ao dia.
        if (
            value in setOf(
                "4",
                "4 vezes",
                "4 vezes ao dia",
                "6h",
                "6 horas"
            )
        ) {
            return 6
        }

        // Exemplo: 8 em 8 horas.
        val intervalo = Regex(
            "^(6|8|12|24) em (6|8|12|24) horas?$"
        ).matchEntire(value)

        if (
            intervalo != null &&
            intervalo.groupValues[1] ==
                intervalo.groupValues[2]
        ) {
            return intervalo.groupValues[1].toInt()
        }

        // Exemplo: a cada 8 horas.
        val cada = Regex(
            "^a cada (6|8|12|24) horas?$"
        ).matchEntire(value)

        if (cada != null) {
            return cada.groupValues[1].toInt()
        }

        throw IllegalArgumentException(
            "Frequência não reconhecida: $raw"
        )
    }

    // ==================================================
    // INTERPRETAR DURAÇÃO
    // ==================================================

    private fun durationDays(raw: String): Int {

        val value = raw.trim().lowercase()

        val match = Regex(
            "^(\\d{1,4})(?:\\s*dias?)?$"
        ).matchEntire(value)
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
    // VERIFICAR PERMISSÃO
    // ==================================================

    private fun checkPermission(context: Context) {

        if (
            Build.VERSION.SDK_INT >=
                Build.VERSION_CODES.S &&
            !manager(context).canScheduleExactAlarms()
        ) {
            throw IllegalStateException(
                "Permissão de alarmes exatos não concedida"
            )
        }
    }

    // ==================================================
    // IDENTIFICAR ALARMES
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
            alarmIntent(
                context,
                id,
                snooze
            ),
            flags or PendingIntent.FLAG_IMMUTABLE
        )
    }

    // ==================================================
    // CANCELAR PENDING INTENT
    // ==================================================

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
    // SALVAR PROGRAMAÇÃO
    // ==================================================

    private fun save(
        context: Context,
        id: Int,
        data: JSONObject
    ) {

        check(
            prefs(context).edit()
                .putString(
                    key(id),
                    data.toString()
                )
                .commit()
        ) {
            "Falha ao salvar programação"
        }
    }

    // ==================================================
    // CONSULTAR PROGRAMAÇÃO
    // ==================================================

    fun get(
        context: Context,
        id: Int
    ): JSONObject? {

        return try {

            prefs(context)
                .getString(
                    key(id),
                    null
                )
                ?.let {
                    JSONObject(it)
                }

        } catch (_: Exception) {
            null
        }
    }

    // ==================================================
    // CALCULAR FIM DO TRATAMENTO
    // ==================================================

    private fun endExclusive(
        first: Long,
        days: Int
    ): Long {

        return Calendar.getInstance().apply {

            timeInMillis = first

            set(
                Calendar.HOUR_OF_DAY,
                0
            )

            set(
                Calendar.MINUTE,
                0
            )

            set(
                Calendar.SECOND,
                0
            )

            set(
                Calendar.MILLISECOND,
                0
            )

            add(
                Calendar.DAY_OF_YEAR,
                days
            )

        }.timeInMillis
    }

    // ==================================================
    // CADASTRAR PROGRAMAÇÃO
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

        require(
            id > 0 &&
            name.isNotBlank()
        ) {
            "Medicamento inválido"
        }

        require(
            first > System.currentTimeMillis()
        ) {
            "Primeiro horário precisa estar no futuro"
        }

        val hours = intervalHours(
            frequency
        )

        val days = durationDays(
            duration
        )

        val parts = Regex(
            "^(\\d{2}):(\\d{2})$"
        ).matchEntire(
            time.trim()
        ) ?: throw IllegalArgumentException(
            "Horário deve estar em HH:MM"
        )

        val h = parts.groupValues[1].toInt()
        val m = parts.groupValues[2].toInt()

        require(
            h in 0..23 &&
            m in 0..59
        ) {
            "Horário inválido"
        }

        checkPermission(
            context
        )

        val end = endExclusive(
            first,
            days
        )

        require(
            first < end
        ) {
            "Primeiro alarme fora da duração"
        }

        val data = JSONObject().apply {

            put(
                "id",
                id
            )

            put(
                "name",
                name
            )

            put(
                "time",
                time
            )

            put(
                "hours",
                hours
            )

            put(
                "first",
                first
            )

            put(
                "next",
                first
            )

            put(
                "end",
                end
            )
        }

        cancel(
            context,
            id
        )

        save(
            context,
            id,
            data
        )

        schedule(
            context,
            data
        )
    }

    // ==================================================
    // PROGRAMAR PRÓXIMO ALARME
    // ==================================================

    private fun schedule(
        context: Context,
        data: JSONObject
    ) {

        checkPermission(
            context
        )

        val id = data.getInt(
            "id"
        )

        val next = data.getLong(
            "next"
        )

        val end = data.getLong(
            "end"
        )

        if (
            next >= end
        ) {
            return
        }

        val pi = pending(
            context,
            id,
            false,
            PendingIntent.FLAG_UPDATE_CURRENT
        ) ?: error(
            "PendingIntent indisponível"
        )

        manager(context)
            .setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                next,
                pi
            )
    }

    // ==================================================
    // CALCULAR PRÓXIMA DOSE
    // ==================================================

    private fun nextAfter(
        data: JSONObject,
        now: Long
    ): Long {

        val first = data.getLong(
            "first"
        )

        val hours = data.getInt(
            "hours"
        )

        if (
            hours == 24
        ) {

            val calendar =
                Calendar.getInstance().apply {

                    timeInMillis = first
                }

            while (
                calendar.timeInMillis <= now
            ) {

                calendar.add(
                    Calendar.DAY_OF_YEAR,
                    1
                )
            }

            return calendar.timeInMillis
        }

        val step =
            hours * 60L * 60L * 1000L

        val intervals =
            if (
                now < first
            ) {
                0L
            } else {
                (
                    (now - first) / step
                ) + 1
            }

        return first +
            intervals * step
    }

    // ==================================================
    // QUANDO O ALARME TOCAR
    // ==================================================

    fun fired(
        context: Context,
        id: Int
    ): JSONObject? {

        val data = get(
            context,
            id
        ) ?: return null

        val now =
            System.currentTimeMillis()

        val due = data.optLong(
            "next",
            0
        )

        if (
            due <= 0 ||
            due > now + 90_000L ||
            now - due > 30 * 60_000L
        ) {
            return null
        }

        val next = nextAfter(
            data,
            now
        )

        data.put(
            "next",
            next
        )

        save(
            context,
            id,
            data
        )

        if (
            next < data.getLong(
                "end"
            )
        ) {

            schedule(
                context,
                data
            )
        }

        return data
    }

    // ==================================================
    // ADIAR POR CINCO MINUTOS
    // ==================================================

    fun snooze(
        context: Context,
        id: Int
    ): Boolean {

        if (
            get(context, id) == null
        ) {
            return false
        }

        checkPermission(
            context
        )

        val pi = pending(
            context,
            id,
            true,
            PendingIntent.FLAG_UPDATE_CURRENT
        ) ?: return false

        manager(context)
            .setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() +
                    5 * 60_000L,
                pi
            )

        return true
    }

    // ==================================================
    // CANCELAR ALARME
    // ==================================================

    fun cancel(
        context: Context,
        id: Int
    ) {

        cancelPending(
            context,
            id,
            false
        )

        cancelPending(
            context,
            id,
            true
        )

        // Cancela também alarmes da versão antiga.
        val legacy =
            PendingIntent.getBroadcast(
                context,
                id,
                Intent(
                    context,
                    MedicationAlarmReceiver::class.java
                ),
                PendingIntent.FLAG_NO_CREATE or
                    PendingIntent.FLAG_IMMUTABLE
            )

        if (
            legacy != null
        ) {

            manager(context)
                .cancel(legacy)

            legacy.cancel()
        }

        prefs(context).edit()
            .remove(
                key(id)
            )
            .commit()
    }

    // ==================================================
    // RESTAURAR ALARMES
    // ==================================================

    fun restore(
        context: Context
    ): Boolean {

        checkPermission(
            context
        )

        val ids =
            prefs(context)
                .all
                .keys
                .filter {
                    it.startsWith(
                        "med_"
                    )
                }

        for (
            storedKey in ids
        ) {

            val id = storedKey
                .removePrefix(
                    "med_"
                )
                .toIntOrNull()
                ?: continue

            val data = get(
                context,
                id
            ) ?: continue

            val next = nextAfter(
                data,
                System.currentTimeMillis()
            )

            data.put(
                "next",
                next
            )

            save(
                context,
                id,
                data
            )

            if (
                next < data.getLong(
                    "end"
                )
            ) {

                schedule(
                    context,
                    data
                )
            }
        }

        return true
    }
}
