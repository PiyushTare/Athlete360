package com.athlete360.companion.data.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.athlete360.companion.data.health.HealthConnectManager
import com.athlete360.companion.data.model.SyncPayload
import com.athlete360.companion.data.remote.ApiClient
import com.athlete360.companion.data.storage.AppPreferences
import java.time.Instant

class HealthSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val prefs = AppPreferences(applicationContext)
        if (!prefs.isAutoSyncEnabled) {
            return Result.success()
        }

        val hcManager = HealthConnectManager(applicationContext)
        if (!hcManager.isSdkAvailable() || !hcManager.hasAllPermissions()) {
            return Result.retry()
        }

        return try {
            val snapshot = hcManager.readAllVitals()

            // If at least one genuine record exists, sync to Athlete 360
            val hasData = snapshot.heartRate != null ||
                    snapshot.spo2 != null ||
                    snapshot.steps != null ||
                    snapshot.calories != null ||
                    snapshot.sleep != null

            if (hasData) {
                val recordTime = snapshot.heartRate?.timestamp
                    ?: snapshot.spo2?.timestamp
                    ?: snapshot.steps?.endTime
                    ?: snapshot.sleep?.endTime
                    ?: Instant.now()

                val payload = SyncPayload(
                    athleteId = prefs.athleteId,
                    deviceName = "Fastrack Smartwatch",
                    modelIdentifier = "Fastrack-HC",
                    connectionType = "HEALTH_CONNECT",
                    source = snapshot.primarySource,
                    heartRateBpm = snapshot.heartRate?.bpm,
                    spo2Pct = snapshot.spo2?.percentage?.toLong(),
                    steps = snapshot.steps?.steps,
                    caloriesKcal = snapshot.calories?.calories?.toLong(),
                    sleepDurationHours = snapshot.sleep?.durationHours,
                    timestamp = recordTime.toString(),
                    rawPayload = mapOf(
                        "client" to "Athlete 360 Android Companion",
                        "sync_type" to "background_worker"
                    )
                )

                val api = ApiClient.getService(applicationContext)
                val response = api.syncVitals(prefs.athleteId, payload)

                if (response.isSuccessful && response.body()?.success == true) {
                    prefs.lastSyncTimestamp = System.currentTimeMillis()
                    Result.success()
                } else {
                    Result.retry()
                }
            } else {
                // No records in Health Connect yet
                Result.success()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
