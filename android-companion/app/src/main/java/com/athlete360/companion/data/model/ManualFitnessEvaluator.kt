package com.athlete360.companion.data.model

data class ManualFitnessResult(
    val isFit: Boolean,
    val statusBadge: String,        // "ATHLETE IS FIT" vs "ATHLETE IS NOT FIT"
    val score: Int,                 // 10 to 100
    val title: String,              // "Optimal Physical Condition" vs "Needs Recovery / Elevated Strain"
    val hrAnalysis: String,         // HR diagnostic message
    val spo2Analysis: String,       // SpO2 diagnostic message
    val recommendation: String,     // Clinical training guidance
    val hrBpm: Long,
    val spo2Pct: Long,
    val evaluatedAtMillis: Long
)

object ManualFitnessEvaluator {

    /**
     * Directly evaluates whether an athlete is FIT or NOT FIT based on manual HR and SpO2.
     * Evaluates instantly and purely on-device without any network dependency.
     */
    fun evaluate(hr: Long, spo2: Long, timestampMillis: Long = System.currentTimeMillis()): ManualFitnessResult {
        val issues = mutableListOf<String>()
        var score = 100

        // 1. SpO2 Blood Oxygen Analysis
        val spo2Analysis = when {
            spo2 >= 98 -> {
                "✓ $spo2% — Excellent arterial oxygenation (≥98%)"
            }
            spo2 in 95..97 -> {
                score -= (98 - spo2.toInt()) * 3
                "✓ $spo2% — Normal oxygen saturation (95–97%)"
            }
            spo2 in 90..94 -> {
                val penalty = 25 + (95 - spo2.toInt()) * 4
                score -= penalty
                issues.add("Low Blood Oxygen ($spo2%): Below healthy 95% threshold. Muscle oxygen uptake is compromised.")
                "⚠ $spo2% — Sub-optimal oxygen saturation (<95%)"
            }
            else -> {
                score -= 60
                issues.add("Critical Hypoxia ($spo2%): Severe oxygen depletion (<90%). Physical exertion strictly restricted.")
                "🚨 $spo2% — Critical low oxygen (<90%)"
            }
        }

        // 2. Heart Rate (Resting / Baseline) Analysis
        val hrAnalysis = when {
            hr in 55..75 -> {
                "✓ $hr BPM — Optimal athletic baseline pulse"
            }
            hr in 45..54 -> {
                score -= 4
                "✓ $hr BPM — High athletic endurance resting pulse"
            }
            hr in 76..85 -> {
                score -= 6
                "✓ $hr BPM — Acceptable resting heart rate"
            }
            hr in 86..95 -> {
                score -= 14
                "⚠ $hr BPM — Borderline elevated pulse"
            }
            hr > 95 -> {
                val penalty = 25 + ((hr.toInt() - 95) * 1.5).toInt()
                score -= penalty
                issues.add("Elevated Heart Rate ($hr BPM): Tachycardia / physiological stress detected (>95 BPM threshold).")
                "⚠ $hr BPM — Elevated pulse indicating fatigue / stress (>95 BPM)"
            }
            else -> { // < 45
                score -= 20
                issues.add("Low Pulse ($hr BPM): Possible extreme fatigue or severe bradycardia (<45 BPM).")
                "⚠ $hr BPM — Abnormally low resting pulse (<45 BPM)"
            }
        }

        val clampedScore = score.coerceIn(10, 100)
        val isFit = (spo2 >= 95 && hr in 45..95 && clampedScore >= 70)

        val statusBadge = if (isFit) "ATHLETE IS FIT" else "ATHLETE IS NOT FIT"
        val title = if (isFit) {
            if (clampedScore >= 90) "Optimal Physical Condition" else "Good Training Readiness"
        } else {
            if (spo2 < 90 || hr > 115) "Critical Recovery Required" else "Recovery & Rest Advised"
        }

        val recommendation = if (isFit) {
            "Cardiovascular and blood oxygenation levels are well within optimal athletic parameters. The athlete is medically and physically FIT for high-intensity training, drills, and competitive play."
        } else {
            val reasonsStr = issues.joinToString(" ")
            "$reasonsStr Athlete is NOT fit for intense physical strain today. Recommended action: active recovery, proper hydration, nutrition, and rest before re-testing."
        }

        return ManualFitnessResult(
            isFit = isFit,
            statusBadge = statusBadge,
            score = clampedScore,
            title = title,
            hrAnalysis = hrAnalysis,
            spo2Analysis = spo2Analysis,
            recommendation = recommendation,
            hrBpm = hr,
            spo2Pct = spo2,
            evaluatedAtMillis = timestampMillis
        )
    }
}
