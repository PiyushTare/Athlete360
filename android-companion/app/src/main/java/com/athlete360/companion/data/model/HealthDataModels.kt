package com.athlete360.companion.data.model

import java.time.Instant

/**
 * Data classes for Health Connect metrics.
 * Strictly captures genuine readings from Fastrack / Google Fit via Health Connect.
 */
data class HeartRateReading(
    val bpm: Long,
    val timestamp: Instant,
    val sourcePackage: String
)

data class OxygenSaturationReading(
    val percentage: Double,
    val timestamp: Instant,
    val sourcePackage: String
)

data class StepsReading(
    val steps: Long,
    val startTime: Instant,
    val endTime: Instant,
    val sourcePackage: String
)

data class CaloriesReading(
    val calories: Double,
    val startTime: Instant,
    val endTime: Instant,
    val sourcePackage: String
)

data class SleepReading(
    val durationHours: Double,
    val startTime: Instant,
    val endTime: Instant,
    val sourcePackage: String
)

data class VitalsSnapshot(
    val heartRate: HeartRateReading?,
    val spo2: OxygenSaturationReading?,
    val steps: StepsReading?,
    val calories: CaloriesReading?,
    val sleep: SleepReading?,
    val primarySource: String
)

enum class ReadinessStatus {
    FIT,
    NEEDS_RECOVERY,
    INSUFFICIENT_DATA
}

data class ReadinessAssessment(
    val status: ReadinessStatus,
    val title: String,
    val summary: String,
    val hrStatus: String? = null,
    val spo2Status: String? = null,
    val sleepStatus: String? = null
)

fun VitalsSnapshot.assessReadiness(): ReadinessAssessment {
    // 1. Data Sufficiency Check:
    // Never declare an athlete fit without sufficient data.
    // An athlete's readiness cannot be established without a valid Heart Rate reading,
    // and at least one recovery metric (SpO2 or Sleep Session).
    if (heartRate == null) {
        return ReadinessAssessment(
            status = ReadinessStatus.INSUFFICIENT_DATA,
            title = "Insufficient Data",
            summary = "Heart rate reading required to evaluate training readiness."
        )
    }

    if (spo2 == null && sleep == null) {
        return ReadinessAssessment(
            status = ReadinessStatus.INSUFFICIENT_DATA,
            title = "Insufficient Data",
            summary = "SpO₂ or Sleep session required alongside Heart Rate."
        )
    }

    val hr = heartRate.bpm
    val spo2Val = spo2?.percentage
    val sleepHours = sleep?.durationHours

    // 2. Health-based criteria checks:
    val recoveryReasons = mutableListOf<String>()

    val spo2Status = if (spo2Val != null) {
        if (spo2Val < 95.0) {
            recoveryReasons.add(String.format("Low Blood Oxygen (%.1f%%)", spo2Val))
            "Sub-optimal (<95%)"
        } else {
            "Optimal (${spo2Val.toInt()}%)"
        }
    } else null

    val hrStatus = if (hr > 95) {
        recoveryReasons.add("Elevated Pulse ($hr BPM)")
        "Elevated (>95 BPM)"
    } else if (hr < 42) {
        recoveryReasons.add("Low Pulse ($hr BPM)")
        "Low (<42 BPM)"
    } else {
        "Optimal ($hr BPM)"
    }

    val sleepStatus = if (sleepHours != null) {
        if (sleepHours < 6.0) {
            recoveryReasons.add(String.format("Inadequate Sleep (%.1fh)", sleepHours))
            "Deficient (<6h)"
        } else {
            String.format("Restored (%.1fh)", sleepHours)
        }
    } else null

    // 3. Final Determination:
    return if (recoveryReasons.isNotEmpty()) {
        ReadinessAssessment(
            status = ReadinessStatus.NEEDS_RECOVERY,
            title = "Needs Recovery",
            summary = recoveryReasons.joinToString(" • ") + " • Rest or light recovery advised",
            hrStatus = hrStatus,
            spo2Status = spo2Status,
            sleepStatus = sleepStatus
        )
    } else {
        ReadinessAssessment(
            status = ReadinessStatus.FIT,
            title = "Fit",
            summary = "Vitals within optimal ranges for athletic training",
            hrStatus = hrStatus,
            spo2Status = spo2Status,
            sleepStatus = sleepStatus
        )
    }
}
