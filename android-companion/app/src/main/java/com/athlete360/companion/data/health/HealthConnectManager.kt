package com.athlete360.companion.data.health

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.athlete360.companion.data.model.CaloriesReading
import com.athlete360.companion.data.model.HeartRateReading
import com.athlete360.companion.data.model.OxygenSaturationReading
import com.athlete360.companion.data.model.SleepReading
import com.athlete360.companion.data.model.StepsReading
import com.athlete360.companion.data.model.VitalsSnapshot
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit

class HealthConnectManager(private val context: Context) {

    val healthConnectClient: HealthConnectClient? by lazy {
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else {
            null
        }
    }

    val requiredPermissions: Set<String> = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class)
    )

    fun isSdkAvailable(): Boolean {
        return HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    }

    fun getSdkStatusMessage(): String {
        return when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> "Health Connect is Available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "Health Connect update required on this phone"
            HealthConnectClient.SDK_UNAVAILABLE -> "Health Connect is not supported on this device"
            else -> "Health Connect Status Unknown"
        }
    }

    suspend fun getGrantedPermissions(): Set<String> {
        val client = healthConnectClient ?: return emptySet()
        return try {
            client.permissionController.getGrantedPermissions()
        } catch (e: Exception) {
            emptySet()
        }
    }

    suspend fun hasAllPermissions(): Boolean {
        val granted = getGrantedPermissions()
        val core = setOf(
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(StepsRecord::class)
        )
        return granted.containsAll(core)
    }

    /**
     * Read the most recent Heart Rate record available in Health Connect (past 48 hours).
     * Never fabricates values.
     */
    suspend fun readLatestHeartRate(): HeartRateReading? {
        val client = healthConnectClient ?: return null
        val now = Instant.now()
        val twoDaysAgo = now.minus(48, ChronoUnit.HOURS)

        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(twoDaysAgo, now)
                )
            )

            val latestRecord = response.records.maxByOrNull { it.endTime } ?: return null
            val latestSample = latestRecord.samples.maxByOrNull { it.time } ?: return null

            val sourcePackage = latestRecord.metadata.dataOrigin.packageName
            HeartRateReading(
                bpm = latestSample.beatsPerMinute,
                timestamp = latestSample.time,
                sourcePackage = formatSourcePackage(sourcePackage)
            )
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Read the most recent Blood Oxygen (SpO2) record available in Health Connect (past 48 hours).
     */
    suspend fun readLatestOxygenSaturation(): OxygenSaturationReading? {
        val client = healthConnectClient ?: return null
        val now = Instant.now()
        val twoDaysAgo = now.minus(48, ChronoUnit.HOURS)

        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = OxygenSaturationRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(twoDaysAgo, now)
                )
            )

            val latestRecord = response.records.maxByOrNull { it.time } ?: return null
            val sourcePackage = latestRecord.metadata.dataOrigin.packageName

            OxygenSaturationReading(
                percentage = latestRecord.percentage.value,
                timestamp = latestRecord.time,
                sourcePackage = formatSourcePackage(sourcePackage)
            )
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Read today's step count records from Health Connect (from 00:00 to now).
     * Rigorously eliminates duplicate counting across multiple recording apps
     * (e.g. Fastrack vs Google Fit vs Phone sensors) and overlapping time intervals.
     */
    suspend fun readTodaySteps(): StepsReading? {
        val client = healthConnectClient ?: return null
        val now = Instant.now()
        val startOfDay = now.truncatedTo(ChronoUnit.DAYS)

        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                )
            )

            if (response.records.isEmpty()) return null

            // Group records by package name (data origin)
            val byOrigin = response.records.groupBy { it.metadata.dataOrigin.packageName }

            // Deduplicate per data origin
            val originTotals = byOrigin.mapValues { (_, records) ->
                calculateDeduplicatedSteps(records)
            }

            // Prioritize primary origin:
            // 1. Dedicated smartwatch / Fastrack app
            // 2. Google Fit
            // 3. Highest valid step count among any other origin
            val primaryEntry = originTotals.entries.maxWithOrNull(
                compareBy<Map.Entry<String, Long>> { (pkg, _) ->
                    when {
                        pkg.contains("fastrack", ignoreCase = true) || pkg.contains("titan", ignoreCase = true) -> 3
                        pkg.contains("fitness", ignoreCase = true) || pkg.contains("fit", ignoreCase = true) -> 2
                        else -> 1
                    }
                }.thenBy { it.value }
            ) ?: return null

            val totalSteps = primaryEntry.value
            if (totalSteps <= 0L) return null

            StepsReading(
                steps = totalSteps,
                startTime = startOfDay,
                endTime = now,
                sourcePackage = formatSourcePackage(primaryEntry.key)
            )
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Calculates step count without duplicate interval counting.
     */
    private fun calculateDeduplicatedSteps(records: List<StepsRecord>): Long {
        if (records.isEmpty()) return 0L
        if (records.size == 1) return records[0].count

        val sorted = records.sortedBy { it.startTime }
        val maxSingleRecord = sorted.maxOf { it.count }

        var intervalSum = 0L
        var lastEnd = Instant.MIN

        for (record in sorted) {
            if (record.startTime >= lastEnd) {
                // Non-overlapping interval
                intervalSum += record.count
                lastEnd = record.endTime
            } else if (record.endTime > lastEnd) {
                // Partial overlap: add non-overlapping fraction
                val totalDuration = Duration.between(record.startTime, record.endTime).toMillis()
                val overlapDuration = Duration.between(record.startTime, lastEnd).toMillis()
                if (totalDuration > 0 && overlapDuration < totalDuration) {
                    val nonOverlapFraction = (totalDuration - overlapDuration).toDouble() / totalDuration.toDouble()
                    intervalSum += (record.count * nonOverlapFraction).toLong()
                    lastEnd = record.endTime
                }
            }
            // Wholly overlapping interval is ignored to avoid double counting
        }

        return maxOf(intervalSum, maxSingleRecord)
    }

    /**
     * Read today's active calories burned from Health Connect (from 00:00 to now).
     * Eliminates duplicate counting from multiple apps and overlapping intervals.
     */
    suspend fun readTodayActiveCalories(): CaloriesReading? {
        val client = healthConnectClient ?: return null
        val now = Instant.now()
        val startOfDay = now.truncatedTo(ChronoUnit.DAYS)

        return try {
            val activeResponse = client.readRecords(
                ReadRecordsRequest(
                    recordType = ActiveCaloriesBurnedRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                )
            )

            if (activeResponse.records.isNotEmpty()) {
                val byOrigin = activeResponse.records.groupBy { it.metadata.dataOrigin.packageName }
                val originTotals = byOrigin.mapValues { (_, records) ->
                    calculateDeduplicatedActiveCalories(records)
                }

                val primaryEntry = originTotals.entries.maxWithOrNull(
                    compareBy<Map.Entry<String, Double>> { (pkg, _) ->
                        when {
                            pkg.contains("fastrack", ignoreCase = true) || pkg.contains("titan", ignoreCase = true) -> 3
                            pkg.contains("fitness", ignoreCase = true) || pkg.contains("fit", ignoreCase = true) -> 2
                            else -> 1
                        }
                    }.thenBy { it.value }
                )

                if (primaryEntry != null && primaryEntry.value > 0.0) {
                    return CaloriesReading(
                        calories = primaryEntry.value,
                        startTime = startOfDay,
                        endTime = now,
                        sourcePackage = formatSourcePackage(primaryEntry.key)
                    )
                }
            }

            // Fallback: check TotalCaloriesBurnedRecord if active calories not directly recorded
            val totalResponse = client.readRecords(
                ReadRecordsRequest(
                    recordType = TotalCaloriesBurnedRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfDay, now)
                )
            )

            if (totalResponse.records.isNotEmpty()) {
                val byOrigin = totalResponse.records.groupBy { it.metadata.dataOrigin.packageName }
                val originTotals = byOrigin.mapValues { (_, records) ->
                    calculateDeduplicatedTotalCalories(records)
                }

                val primaryEntry = originTotals.entries.maxWithOrNull(
                    compareBy<Map.Entry<String, Double>> { (pkg, _) ->
                        when {
                            pkg.contains("fastrack", ignoreCase = true) || pkg.contains("titan", ignoreCase = true) -> 3
                            pkg.contains("fitness", ignoreCase = true) || pkg.contains("fit", ignoreCase = true) -> 2
                            else -> 1
                        }
                    }.thenBy { it.value }
                )

                if (primaryEntry != null && primaryEntry.value > 0.0) {
                    return CaloriesReading(
                        calories = primaryEntry.value,
                        startTime = startOfDay,
                        endTime = now,
                        sourcePackage = formatSourcePackage(primaryEntry.key)
                    )
                }
            }

            null
        } catch (e: Exception) {
            null
        }
    }

    private fun calculateDeduplicatedActiveCalories(records: List<ActiveCaloriesBurnedRecord>): Double {
        if (records.isEmpty()) return 0.0
        val sorted = records.sortedBy { it.startTime }
        val maxSingle = sorted.maxOf { it.energy.inKilocalories }

        var intervalSum = 0.0
        var lastEnd = Instant.MIN

        for (record in sorted) {
            if (record.startTime >= lastEnd) {
                intervalSum += record.energy.inKilocalories
                lastEnd = record.endTime
            } else if (record.endTime > lastEnd) {
                val totalDuration = Duration.between(record.startTime, record.endTime).toMillis()
                val overlapDuration = Duration.between(record.startTime, lastEnd).toMillis()
                if (totalDuration > 0 && overlapDuration < totalDuration) {
                    val nonOverlapFraction = (totalDuration - overlapDuration).toDouble() / totalDuration.toDouble()
                    intervalSum += (record.energy.inKilocalories * nonOverlapFraction)
                    lastEnd = record.endTime
                }
            }
        }

        return maxOf(intervalSum, maxSingle)
    }

    private fun calculateDeduplicatedTotalCalories(records: List<TotalCaloriesBurnedRecord>): Double {
        if (records.isEmpty()) return 0.0
        val sorted = records.sortedBy { it.startTime }
        val maxSingle = sorted.maxOf { it.energy.inKilocalories }

        var intervalSum = 0.0
        var lastEnd = Instant.MIN

        for (record in sorted) {
            if (record.startTime >= lastEnd) {
                intervalSum += record.energy.inKilocalories
                lastEnd = record.endTime
            } else if (record.endTime > lastEnd) {
                val totalDuration = Duration.between(record.startTime, record.endTime).toMillis()
                val overlapDuration = Duration.between(record.startTime, lastEnd).toMillis()
                if (totalDuration > 0 && overlapDuration < totalDuration) {
                    val nonOverlapFraction = (totalDuration - overlapDuration).toDouble() / totalDuration.toDouble()
                    intervalSum += (record.energy.inKilocalories * nonOverlapFraction)
                    lastEnd = record.endTime
                }
            }
        }

        return maxOf(intervalSum, maxSingle)
    }

    /**
     * Read the most recent sleep session record from Health Connect (past 48 hours).
     */
    suspend fun readLatestSleepSession(): SleepReading? {
        val client = healthConnectClient ?: return null
        val now = Instant.now()
        val twoDaysAgo = now.minus(48, ChronoUnit.HOURS)

        return try {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = SleepSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(twoDaysAgo, now)
                )
            )

            val latestSession = response.records.maxByOrNull { it.endTime } ?: return null
            val minutes = Duration.between(latestSession.startTime, latestSession.endTime).toMinutes()
            val hours = (minutes / 60.0 * 10.0).toLong() / 10.0

            SleepReading(
                durationHours = hours,
                startTime = latestSession.startTime,
                endTime = latestSession.endTime,
                sourcePackage = formatSourcePackage(latestSession.metadata.dataOrigin.packageName)
            )
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Aggregates all available genuine records currently in Health Connect.
     */
    suspend fun readAllVitals(): VitalsSnapshot {
        val hr = readLatestHeartRate()
        val spo2 = readLatestOxygenSaturation()
        val steps = readTodaySteps()
        val calories = readTodayActiveCalories()
        val sleep = readLatestSleepSession()

        val primarySource = hr?.sourcePackage
            ?: steps?.sourcePackage
            ?: spo2?.sourcePackage
            ?: sleep?.sourcePackage
            ?: "Fastrack Smart via Health Connect"

        return VitalsSnapshot(
            heartRate = hr,
            spo2 = spo2,
            steps = steps,
            calories = calories,
            sleep = sleep,
            primarySource = primarySource
        )
    }

    /**
     * Maps Android package name to human-readable source app name.
     */
    private fun formatSourcePackage(pkg: String): String {
        return when {
            pkg.contains("fastrack", ignoreCase = true) -> "Fastrack Smart via Health Connect"
            pkg.contains("fitness", ignoreCase = true) || pkg.contains("fit", ignoreCase = true) -> "Google Fit via Health Connect"
            pkg.contains("samsung", ignoreCase = true) -> "Samsung Health via Health Connect"
            pkg.contains("titan", ignoreCase = true) -> "Titan Smart via Health Connect"
            else -> "$pkg via Health Connect"
        }
    }
}
