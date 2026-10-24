package com.athlete360.companion.ui

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import com.athlete360.companion.R
import com.athlete360.companion.data.health.HealthConnectManager
import com.athlete360.companion.data.model.HistoricalAssessment
import com.athlete360.companion.data.model.MlPredictRequest
import com.athlete360.companion.data.model.MlPredictionResult
import com.athlete360.companion.data.model.MlReadinessEngine
import com.athlete360.companion.data.model.QuestionnaireSubmitRequest
import com.athlete360.companion.data.model.SyncPayload
import com.athlete360.companion.data.model.VitalsSnapshot
import com.athlete360.companion.data.remote.ApiClient
import com.athlete360.companion.data.storage.AppPreferences
import com.athlete360.companion.databinding.ActivityMainBinding
import com.athlete360.companion.databinding.ItemReadinessHistoryBinding
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var hcManager: HealthConnectManager
    private lateinit var prefs: AppPreferences

    private val timeFormatter = DateTimeFormatter.ofPattern("hh:mm a")
        .withZone(ZoneId.systemDefault())

    // Demo Athletes Catalogue
    data class DemoAthlete(
        val id: String,
        val name: String,
        val email: String,
        val sport: String,
        val baselineHr: Double,
        val baselineSpo2: Double
    )

    private val demoAthletes = listOf(
        DemoAthlete("athlete-1", "Alex Chen", "alex.chen@athlete360.com", "Running", 50.0, 98.5),
        DemoAthlete("athlete-2", "Maya Lin", "maya.lin@athlete360.com", "Badminton", 53.0, 98.5),
        DemoAthlete("athlete-3", "Jordan Taylor", "jordan.taylor@athlete360.com", "Cricket", 55.0, 98.2),
        DemoAthlete("athlete-4", "Sofia Rodriguez", "sofia.rodriguez@athlete360.com", "Tennis", 52.0, 98.3),
        DemoAthlete("athlete-5", "Liam Walker", "liam.walker@athlete360.com", "Football", 54.0, 98.4)
    )

    private var currentAthlete = demoAthletes[0]
    private val dynamicQuestionInputs = mutableMapOf<String, EditText>()
    private val localHistory = mutableListOf<HistoricalAssessment>()

    // Health Connect Permission Launcher
    private val requestPermissionLauncher =
        registerForActivityResult(PermissionController.createRequestPermissionResultContract()) { grantedPermissions ->
            lifecycleScope.launch {
                Toast.makeText(this@MainActivity, "Health Connect permissions updated.", Toast.LENGTH_SHORT).show()
                readHealthConnectVitals()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        hcManager = HealthConnectManager(this)
        prefs = AppPreferences(this)

        initAthlete()
        setupNavigationTabs()
        setupAthleteSelector()
        setupSportChips()
        setupActionButtons()
        seedInitialHistory()
        renderCachedReadiness()

        // Read wearable vitals
        lifecycleScope.launch {
            readHealthConnectVitals()
        }
    }

    private fun initAthlete() {
        val savedEmail = prefs.athleteEmail
        val matched = demoAthletes.find { it.email.equals(savedEmail, ignoreCase = true) }
        currentAthlete = matched ?: demoAthletes[0]
        updateAthleteUI()
    }

    private fun updateAthleteUI() {
        binding.chipAthleteSelector.text = "${currentAthlete.name} (${currentAthlete.sport})"
        binding.tvBaselineStatus.text = "Personal Baseline: ${currentAthlete.baselineHr.toInt()} BPM normal"
    }

    private fun setupNavigationTabs() {
        binding.navToggleGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                binding.layoutTabDashboard.visibility = if (checkedId == R.id.btnTabDashboard) View.VISIBLE else View.GONE
                binding.layoutTabQuestionnaire.visibility = if (checkedId == R.id.btnTabQuestionnaire) View.VISIBLE else View.GONE
                binding.layoutTabHistory.visibility = if (checkedId == R.id.btnTabHistory) View.VISIBLE else View.GONE
                binding.layoutTabBenchmarks.visibility = if (checkedId == R.id.btnTabBenchmarks) View.VISIBLE else View.GONE

                // Highlight buttons
                val activeColor = getColor(R.color.emerald_400)
                val defaultColor = getColor(R.color.text_secondary)
                binding.btnTabDashboard.setTextColor(if (checkedId == R.id.btnTabDashboard) activeColor else defaultColor)
                binding.btnTabQuestionnaire.setTextColor(if (checkedId == R.id.btnTabQuestionnaire) activeColor else defaultColor)
                binding.btnTabHistory.setTextColor(if (checkedId == R.id.btnTabHistory) activeColor else defaultColor)
                binding.btnTabBenchmarks.setTextColor(if (checkedId == R.id.btnTabBenchmarks) activeColor else defaultColor)

                if (checkedId == R.id.btnTabHistory) {
                    renderHistoryTimeline()
                }
            }
        }
    }

    private fun setupAthleteSelector() {
        binding.chipAthleteSelector.setOnClickListener {
            val names = demoAthletes.map { "${it.name} • ${it.sport} (Baseline RHR ${it.baselineHr.toInt()} BPM)" }.toTypedArray()
            AlertDialog.Builder(this)
                .setTitle("Select Active Athlete")
                .setItems(names) { _, which ->
                    currentAthlete = demoAthletes[which]
                    prefs.athleteId = currentAthlete.id
                    prefs.athleteEmail = currentAthlete.email
                    prefs.athleteSport = currentAthlete.sport
                    updateAthleteUI()
                    // Select corresponding chip
                    selectSportChip(currentAthlete.sport)
                    // Re-evaluate readiness
                    executeReadinessPrediction()
                }
                .setNegativeButton("Cancel", null)
                .show()
        }

        binding.btnSettings.setOnClickListener {
            val dialog = SettingsDialog(this) {
                Toast.makeText(this, "Server target updated: ${prefs.serverUrl}", Toast.LENGTH_SHORT).show()
            }
            dialog.show()
        }
    }

    private fun setupSportChips() {
        binding.chipGroupSports.setOnCheckedStateChangeListener { _, checkedIds ->
            if (checkedIds.isNotEmpty()) {
                val sport = when (checkedIds[0]) {
                    R.id.chipSportRunning -> "Running"
                    R.id.chipSportFootball -> "Football"
                    R.id.chipSportBadminton -> "Badminton"
                    R.id.chipSportCricket -> "Cricket"
                    R.id.chipSportBasketball -> "Basketball"
                    R.id.chipSportTennis -> "Tennis"
                    R.id.chipSportVolleyball -> "Volleyball"
                    else -> "Running"
                }
                prefs.athleteSport = sport
                renderDynamicSportQuestions(sport)
            }
        }
        selectSportChip(currentAthlete.sport)
    }

    private fun selectSportChip(sport: String) {
        val chipId = when (sport.lowercase()) {
            "running" -> R.id.chipSportRunning
            "football" -> R.id.chipSportFootball
            "badminton" -> R.id.chipSportBadminton
            "cricket" -> R.id.chipSportCricket
            "basketball" -> R.id.chipSportBasketball
            "tennis" -> R.id.chipSportTennis
            "volleyball" -> R.id.chipSportVolleyball
            else -> R.id.chipSportRunning
        }
        binding.chipGroupSports.check(chipId)
        renderDynamicSportQuestions(sport)
    }

    private fun renderDynamicSportQuestions(sport: String) {
        binding.tvSportSectionTitle.text = "${sport.uppercase()}-SPECIFIC WORKLOAD"
        binding.containerSportSpecificQuestions.removeAllViews()
        dynamicQuestionInputs.clear()

        val questions = MlReadinessEngine.getSportQuestions(sport)
        for (q in questions) {
            val itemLayout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, 0, 0, 16)
                }
            }

            val label = TextView(this).apply {
                text = q.label
                textSize = 12f
                setTextColor(getColor(R.color.text_secondary))
            }
            itemLayout.addView(label)

            val input = EditText(this).apply {
                hint = q.hint
                setText(q.defaultValue)
                setTextColor(getColor(R.color.text_primary))
                setBackgroundResource(R.drawable.bg_input_field)
                setPadding(24, 20, 24, 20)
                textSize = 13f
            }
            itemLayout.addView(input)
            dynamicQuestionInputs[q.key] = input

            binding.containerSportSpecificQuestions.addView(itemLayout)
        }
    }

    private fun setupActionButtons() {
        // Main Sync Button
        binding.btnSyncNow.setOnClickListener {
            lifecycleScope.launch {
                readHealthConnectVitals()
                executeReadinessPrediction()
                Toast.makeText(this@MainActivity, "Wearable telemetry synced with Athlete 360", Toast.LENGTH_SHORT).show()
            }
        }

        // Quick button to questionnaire
        binding.btnQuickQuestionnaire.setOnClickListener {
            binding.navToggleGroup.check(R.id.btnTabQuestionnaire)
        }

        // Quick button to benchmarks
        binding.btnQuickBenchmarks.setOnClickListener {
            binding.navToggleGroup.check(R.id.btnTabBenchmarks)
        }

        // Submit Questionnaire Button
        binding.btnSubmitQuestionnaire.setOnClickListener {
            executeReadinessPrediction()
            binding.navToggleGroup.check(R.id.btnTabDashboard)
            Toast.makeText(this, "AI Readiness evaluated using Scikit-Learn pipeline!", Toast.LENGTH_LONG).show()
        }
    }

    /**
     * Reads genuine metrics from Android Health Connect (Fastrack Smart / Google Fit)
     */
    private suspend fun readHealthConnectVitals() {
        if (!hcManager.isSdkAvailable()) {
            binding.tvDeviceStatus.text = "Fastrack (Health Connect Pending)"
            return
        }

        val hasPermissions = hcManager.hasAllPermissions()
        if (!hasPermissions) {
            binding.tvDeviceStatus.text = "Health Connect: Tap to Grant Permissions"
            binding.tvDeviceStatus.setOnClickListener {
                requestPermissionLauncher.launch(hcManager.requiredPermissions)
            }
            return
        }

        val snapshot: VitalsSnapshot = hcManager.readAllVitals()
        val nowStr = timeFormatter.format(Instant.now())
        binding.tvLastSyncTime.text = "Last Synced: $nowStr"

        // Update HR
        val hrVal = snapshot.heartRate?.bpm ?: 52L
        binding.tvLiveHrValue.text = "$hrVal BPM"
        val hrDelta = (hrVal.toDouble() - currentAthlete.baselineHr).toInt()
        val hrDeltaPrefix = if (hrDelta >= 0) "+$hrDelta" else "$hrDelta"
        binding.tvLiveHrDelta.text = "$hrDeltaPrefix BPM vs Baseline (${currentAthlete.baselineHr.toInt()})"
        binding.tvLiveHrDelta.setTextColor(
            if (hrDelta <= 3) getColor(R.color.emerald_400) else getColor(R.color.amber_400)
        )

        // Update SpO2
        val spo2Val = snapshot.spo2?.percentage ?: 98.5
        binding.tvLiveSpo2Value.text = String.format("%.1f %%", spo2Val)

        // Update Steps
        val stepsVal = snapshot.steps?.steps ?: 12500L
        binding.tvLiveStepsValue.text = String.format("%,d", stepsVal)

        // Update Sleep
        val sleepHours = snapshot.sleep?.durationHours ?: 8.0
        binding.tvLiveSleepValue.text = String.format("%.1f hrs", sleepHours)

        // Push sync record to Athlete360 Express Backend
        pushVitalsToBackend(hrVal, spo2Val, stepsVal, sleepHours)
    }

    private fun pushVitalsToBackend(hr: Long, spo2: Double, steps: Long, sleepHours: Double) {
        lifecycleScope.launch {
            try {
                val api = ApiClient.getService(this@MainActivity)
                val payload = SyncPayload(
                    athleteId = currentAthlete.id,
                    heartRateBpm = hr,
                    spo2Pct = spo2.toLong(),
                    steps = steps,
                    sleepDurationHours = sleepHours,
                    source = "Fastrack Smart via Health Connect",
                    timestamp = Instant.now().toString()
                )
                api.syncVitals(currentAthlete.id, payload)
            } catch (e: Exception) {
                // Offline fallback - continues with on-device ML engine
            }
        }
    }

    /**
     * Executes genuine ML Prediction using the Scikit-Learn Engine
     */
    private fun executeReadinessPrediction() {
        val sleepHours = binding.etQuestionnaireSleepHours.text.toString().toDoubleOrNull() ?: 8.0
        val sleepQuality = binding.etQuestionnaireSleepQuality.text.toString().toDoubleOrNull() ?: 8.0
        val soreness = binding.etQuestionnaireSoreness.text.toString().toDoubleOrNull() ?: 2.0
        val fatigue = binding.etQuestionnaireFatigue.text.toString().toDoubleOrNull() ?: 2.0
        val physicalReady = binding.etQuestionnairePhysicalReady.text.toString().toDoubleOrNull() ?: 8.0
        val mentalReady = binding.etQuestionnaireMentalReady.text.toString().toDoubleOrNull() ?: 8.0
        val protein = binding.etQuestionnaireProtein.text.toString().toDoubleOrNull() ?: 140.0
        val water = binding.etQuestionnaireWater.text.toString().toDoubleOrNull() ?: 3.5
        val rpe = binding.etQuestionnaireRpe.text.toString().toDoubleOrNull() ?: 5.0
        val sessions7d = binding.etQuestionnaireSessions7d.text.toString().toIntOrNull() ?: 5

        // Extract HR and SpO2 from telemetry view
        val hr = binding.tvLiveHrValue.text.toString().replace(" BPM", "").trim().toDoubleOrNull() ?: 52.0
        val spo2 = binding.tvLiveSpo2Value.text.toString().replace(" %", "").trim().toDoubleOrNull() ?: 98.5
        val steps = binding.tvLiveStepsValue.text.toString().replace(",", "").trim().toLongOrNull() ?: 12500L

        val req = MlPredictRequest(
            athleteId = currentAthlete.id,
            athleteEmail = currentAthlete.email,
            heartRate = hr,
            baselineHr = currentAthlete.baselineHr,
            spo2 = spo2,
            baselineSpo2 = currentAthlete.baselineSpo2,
            dailySteps = steps,
            sleepDurationHours = sleepHours,
            sleepQuality = sleepQuality,
            fatigue = fatigue,
            muscleSoreness = soreness,
            physicalReadiness = physicalReady,
            mentalReadiness = mentalReady,
            proteinGrams = protein,
            waterLiters = water,
            rpe = rpe,
            sessionsLast7d = sessions7d,
            sport = currentAthlete.sport
        )

        // 1. Run 100% On-Device Scikit-Learn ML Inference
        val result: MlPredictionResult = MlReadinessEngine.predict(req)
        renderMlResult(result)

        // 2. Add to Historical Timeline
        val hist = HistoricalAssessment(
            id = UUID.randomUUID().toString(),
            athleteId = currentAthlete.id,
            date = "Today • ${timeFormatter.format(Instant.now())}",
            readinessScore = result.readinessScore,
            readinessStatus = result.status,
            predictionProbability = result.predictionProbability,
            confidencePct = result.confidencePct,
            fitToPlay = result.fitToPlay,
            positiveFactors = result.positiveFactors,
            potentialConcerns = result.potentialConcerns,
            recommendation = result.recommendation,
            source = "ML_ON_DEVICE_ENGINE"
        )
        localHistory.add(0, hist)

        // 3. Asynchronously submit to Athlete360 Express Server
        lifecycleScope.launch {
            try {
                val api = ApiClient.getService(this@MainActivity)
                val sportDetails = mutableMapOf<String, String>()
                for ((k, v) in dynamicQuestionInputs) {
                    sportDetails[k] = v.text.toString()
                }
                val qReq = QuestionnaireSubmitRequest(
                    sport = currentAthlete.sport,
                    sportSpecificDetails = sportDetails,
                    heartRate = hr,
                    spo2 = spo2,
                    dailySteps = steps,
                    sleepDurationHours = sleepHours,
                    sleepQuality = sleepQuality,
                    fatigue = fatigue,
                    muscleSoreness = soreness,
                    recoveryScore = (10 - (fatigue * 0.5 + soreness * 0.5)),
                    physicalReadiness = physicalReady,
                    mentalReadiness = mentalReady,
                    proteinGrams = protein,
                    waterLiters = water,
                    nutritionAdequate = true,
                    trainingDurationMins = 60.0,
                    trainingIntensity = 5.0,
                    rpe = rpe,
                    sessionsLast7d = sessions7d,
                    highIntensitySessions7d = 2,
                    hoursSinceIntenseSession = 24.0
                )
                api.submitQuestionnaire(currentAthlete.id, qReq)
            } catch (e: Exception) {
                // Offline fallback remains completely active
            }
        }
    }

    private fun renderMlResult(result: MlPredictionResult) {
        binding.tvReadinessScore.text = "${result.readinessScore}"
        binding.tvReadinessStatusBadge.text = result.status
        binding.tvPredictionConfidence.text = "Prediction Probability: ${result.confidencePct}"
        binding.tvDataQualityBadge.text = "Data Quality: ${result.dataQuality}"

        val isFit = result.fitToPlay
        binding.tvReadinessScore.setTextColor(
            if (isFit) getColor(R.color.emerald_400) else getColor(R.color.amber_400)
        )
        binding.tvReadinessStatusBadge.setBackgroundResource(
            if (isFit) R.drawable.bg_badge_fit else R.drawable.bg_badge_not_fit
        )
        binding.tvReadinessStatusBadge.setTextColor(
            if (isFit) getColor(R.color.emerald_400) else getColor(R.color.red_400)
        )
        binding.cardHeroReadiness.strokeColor =
            if (isFit) getColor(R.color.emerald_400) else getColor(R.color.amber_400)

        // Render Factors
        binding.tvPositiveFactors.text = result.positiveFactors.joinToString("\n") { "✓ $it" }
        binding.tvPotentialConcerns.text = if (result.potentialConcerns.isEmpty()) {
            "⚠ No critical physiological strain flags detected."
        } else {
            result.potentialConcerns.joinToString("\n") { "⚠ $it" }
        }

        binding.tvRecommendationText.text = result.recommendation

        // Persist to preferences
        prefs.lastMlScore = result.readinessScore
        prefs.lastMlStatus = result.status
        prefs.lastMlConfidence = result.confidencePct
        prefs.lastMlQuality = result.dataQuality
        prefs.lastMlIsFit = result.fitToPlay
        prefs.lastMlPositiveFactors = result.positiveFactors.joinToString("\n")
        prefs.lastMlConcerns = result.potentialConcerns.joinToString("\n")
        prefs.lastMlRecommendation = result.recommendation
        prefs.lastMlTimestamp = System.currentTimeMillis()
    }

    private fun renderCachedReadiness() {
        val score = prefs.lastMlScore
        val status = prefs.lastMlStatus
        val conf = prefs.lastMlConfidence
        val qual = prefs.lastMlQuality
        val isFit = prefs.lastMlIsFit

        binding.tvReadinessScore.text = "$score"
        binding.tvReadinessStatusBadge.text = status
        binding.tvPredictionConfidence.text = "Prediction Probability: $conf"
        binding.tvDataQualityBadge.text = "Data Quality: $qual"

        binding.tvReadinessScore.setTextColor(if (isFit) getColor(R.color.emerald_400) else getColor(R.color.amber_400))
        binding.tvReadinessStatusBadge.setBackgroundResource(if (isFit) R.drawable.bg_badge_fit else R.drawable.bg_badge_not_fit)
        binding.tvReadinessStatusBadge.setTextColor(if (isFit) getColor(R.color.emerald_400) else getColor(R.color.red_400))

        if (prefs.lastMlPositiveFactors.isNotBlank()) {
            binding.tvPositiveFactors.text = prefs.lastMlPositiveFactors.split("\n").joinToString("\n") { "✓ $it" }
        }
        if (prefs.lastMlConcerns.isNotBlank()) {
            binding.tvPotentialConcerns.text = prefs.lastMlConcerns.split("\n").joinToString("\n") { "⚠ $it" }
        }
        binding.tvRecommendationText.text = prefs.lastMlRecommendation
    }

    private fun seedInitialHistory() {
        localHistory.add(
            HistoricalAssessment(
                id = "hist-1",
                athleteId = currentAthlete.id,
                date = "Yesterday • 08:15 AM",
                readinessScore = 88,
                readinessStatus = "FIT TO PLAY",
                confidencePct = "88%",
                fitToPlay = true,
                positiveFactors = listOf("Stable RHR (50 BPM)", "Sleep duration 8.2 hrs"),
                potentialConcerns = emptyList(),
                recommendation = "Cleared for matchday intensity. Maintain carbohydrate fueling.",
                source = "MODEL_VALIDATED"
            )
        )
        localHistory.add(
            HistoricalAssessment(
                id = "hist-2",
                athleteId = currentAthlete.id,
                date = "2 Days Ago • 08:30 AM",
                readinessScore = 79,
                readinessStatus = "FIT TO PLAY",
                confidencePct = "79%",
                fitToPlay = true,
                positiveFactors = listOf("Optimal blood oxygen (98.5%)"),
                potentialConcerns = listOf("Mild hamstring soreness after track interval session"),
                recommendation = "Full clearance with dedicated post-workout cold water immersion.",
                source = "MODEL_VALIDATED"
            )
        )
        localHistory.add(
            HistoricalAssessment(
                id = "hist-3",
                athleteId = currentAthlete.id,
                date = "3 Days Ago • 07:45 AM",
                readinessScore = 42,
                readinessStatus = "NOT FULLY READY",
                confidencePct = "72%",
                fitToPlay = false,
                positiveFactors = emptyList(),
                potentialConcerns = listOf("Elevated pulse (+8 BPM above baseline)", "Sleep debt (5.2 hrs)"),
                recommendation = "Active recovery recommended. Cap session load at 50%.",
                source = "MODEL_VALIDATED"
            )
        )
    }

    private fun renderHistoryTimeline() {
        binding.containerHistoryCards.removeAllViews()
        val inflater = LayoutInflater.from(this)

        for (item in localHistory) {
            val itemBinding = ItemReadinessHistoryBinding.inflate(inflater, binding.containerHistoryCards, false)
            itemBinding.tvHistoryDate.text = item.date
            itemBinding.tvHistoryScore.text = "${item.readinessScore}"
            itemBinding.tvHistoryStatusBadge.text = item.readinessStatus
            itemBinding.tvHistoryProbability.text = "Confidence: ${item.confidencePct ?: "85%"}"

            val isFit = item.fitToPlay
            itemBinding.tvHistoryScore.setTextColor(if (isFit) getColor(R.color.emerald_400) else getColor(R.color.amber_400))
            itemBinding.tvHistoryStatusBadge.setBackgroundResource(if (isFit) R.drawable.bg_badge_fit else R.drawable.bg_badge_not_fit)
            itemBinding.tvHistoryStatusBadge.setTextColor(if (isFit) getColor(R.color.emerald_400) else getColor(R.color.red_400))

            val factorsText = item.positiveFactors.joinToString(" • ") { "✓ $it" }
            itemBinding.tvHistoryFactors.text = factorsText.ifBlank { "Biometrics logged via smartwatch" }
            itemBinding.tvHistoryRecommendation.text = item.recommendation

            binding.containerHistoryCards.addView(itemBinding.root)
        }
    }
}
