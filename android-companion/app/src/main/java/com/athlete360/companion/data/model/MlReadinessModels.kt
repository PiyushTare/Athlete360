package com.athlete360.companion.data.model

import com.google.gson.annotations.SerializedName

/**
 * Data structures for the Production Scikit-Learn Readiness Engine
 */
data class MlPredictRequest(
    @SerializedName("athlete_id") val athleteId: String? = null,
    @SerializedName("athlete_email") val athleteEmail: String? = null,
    @SerializedName("heart_rate") val heartRate: Double? = null,
    @SerializedName("baseline_hr") val baselineHr: Double? = null,
    @SerializedName("spo2") val spo2: Double? = null,
    @SerializedName("baseline_spo2") val baselineSpo2: Double? = null,
    @SerializedName("daily_steps") val dailySteps: Long? = null,
    @SerializedName("step_trend_pct") val stepTrendPct: Double? = null,
    @SerializedName("sleep_duration_hours") val sleepDurationHours: Double? = null,
    @SerializedName("sleep_quality_1_10") val sleepQuality: Double? = null,
    @SerializedName("fatigue_1_10") val fatigue: Double? = null,
    @SerializedName("muscle_soreness_1_10") val muscleSoreness: Double? = null,
    @SerializedName("recovery_score_perceived_1_10") val recoveryScore: Double? = null,
    @SerializedName("physical_readiness_1_10") val physicalReadiness: Double? = null,
    @SerializedName("mental_readiness_1_10") val mentalReadiness: Double? = null,
    @SerializedName("protein_intake_grams") val proteinGrams: Double? = null,
    @SerializedName("water_intake_liters") val waterLiters: Double? = null,
    @SerializedName("nutrition_adequate") val nutritionAdequate: Int? = 1,
    @SerializedName("training_duration_minutes") val trainingDurationMins: Double? = null,
    @SerializedName("training_intensity_1_10") val trainingIntensity: Double? = null,
    @SerializedName("rpe_1_10") val rpe: Double? = null,
    @SerializedName("sessions_last_7d") val sessionsLast7d: Int? = null,
    @SerializedName("high_intensity_sessions_7d") val highIntensitySessions7d: Int? = null,
    @SerializedName("hours_since_intense_session") val hoursSinceIntenseSession: Double? = null,
    @SerializedName("sport") val sport: String? = "Football"
)

data class MlPredictResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("prediction") val prediction: MlPredictionResult? = null,
    @SerializedName("assessmentId") val assessmentId: String? = null
)

data class MlPredictionResult(
    @SerializedName("status") val status: String = "NOT FULLY READY",
    @SerializedName("readiness_score") val readinessScore: Int = 0,
    @SerializedName("prediction_probability") val predictionProbability: Double = 0.0,
    @SerializedName("confidence_pct") val confidencePct: String = "0%",
    @SerializedName("fit_to_play") val fitToPlay: Boolean = false,
    @SerializedName("data_quality") val dataQuality: String = "Insufficient",
    @SerializedName("positive_factors") val positiveFactors: List<String> = emptyList(),
    @SerializedName("potential_concerns") val potentialConcerns: List<String> = emptyList(),
    @SerializedName("recommendation") val recommendation: String = "",
    @SerializedName("model_version") val modelVersion: String = "Athlete360 Readiness Model v1.0",
    @SerializedName("selected_algorithm") val selectedAlgorithm: String = "Random Forest Classifier",
    @SerializedName("message") val message: String? = null
)

data class ModelMetricsResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("metadata") val metadata: ModelMetadata? = null
)

data class ModelMetadata(
    @SerializedName("model_version") val modelVersion: String = "",
    @SerializedName("selected_model") val selectedModel: String = "",
    @SerializedName("selection_rationale") val selectionRationale: String = "",
    @SerializedName("training_samples") val trainingSamples: Int = 0,
    @SerializedName("test_samples") val testSamples: Int = 0,
    @SerializedName("models_comparison") val modelsComparison: ModelsComparison? = null,
    @SerializedName("top_features") val topFeatures: Map<String, Double> = emptyMap(),
    @SerializedName("data_sources") val dataSources: List<String> = emptyList(),
    @SerializedName("sports_supported") val sportsSupported: List<String> = emptyList()
)

data class ModelsComparison(
    @SerializedName("random_forest") val randomForest: ModelPerfMetrics? = null,
    @SerializedName("logistic_regression") val logisticRegression: ModelPerfMetrics? = null
)

data class ModelPerfMetrics(
    @SerializedName("model_name") val modelName: String = "",
    @SerializedName("test_accuracy") val testAccuracy: Double = 0.0,
    @SerializedName("test_precision") val testPrecision: Double = 0.0,
    @SerializedName("test_recall_fit") val testRecallFit: Double = 0.0,
    @SerializedName("test_recall_not_ready") val testRecallNotReady: Double = 0.0,
    @SerializedName("test_f1_score") val testF1Score: Double = 0.0,
    @SerializedName("test_roc_auc") val testRocAuc: Double = 0.0,
    @SerializedName("test_brier_score") val testBrierScore: Double = 0.0,
    @SerializedName("confusion_matrix") val confusionMatrix: List<List<Int>> = emptyList()
)

data class ReadinessHistoryResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("history") val history: List<HistoricalAssessment> = emptyList()
)

data class HistoricalAssessment(
    @SerializedName("id") val id: String? = null,
    @SerializedName("athlete_id") val athleteId: String? = null,
    @SerializedName("date") val date: String? = null,
    @SerializedName("timestamp") val timestamp: String? = null,
    @SerializedName("readiness_score") val readinessScore: Int = 0,
    @SerializedName("readiness_status") val readinessStatus: String = "",
    @SerializedName("prediction_probability") val predictionProbability: Double? = null,
    @SerializedName("confidence_pct") val confidencePct: String? = null,
    @SerializedName("fit_to_play") val fitToPlay: Boolean = false,
    @SerializedName("positive_factors") val positiveFactors: List<String> = emptyList(),
    @SerializedName("potential_concerns") val potentialConcerns: List<String> = emptyList(),
    @SerializedName("recommendation") val recommendation: String = "",
    @SerializedName("source") val source: String = ""
)

data class QuestionnaireSubmitRequest(
    @SerializedName("sport") val sport: String,
    @SerializedName("sport_specific_details") val sportSpecificDetails: Map<String, String>,
    @SerializedName("heart_rate") val heartRate: Double? = null,
    @SerializedName("spo2") val spo2: Double? = null,
    @SerializedName("daily_steps") val dailySteps: Long? = null,
    @SerializedName("sleep_duration_hours") val sleepDurationHours: Double,
    @SerializedName("sleep_quality_1_10") val sleepQuality: Double,
    @SerializedName("fatigue_1_10") val fatigue: Double,
    @SerializedName("muscle_soreness_1_10") val muscleSoreness: Double,
    @SerializedName("recovery_score_perceived_1_10") val recoveryScore: Double,
    @SerializedName("physical_readiness_1_10") val physicalReadiness: Double,
    @SerializedName("mental_readiness_1_10") val mentalReadiness: Double,
    @SerializedName("protein_intake_grams") val proteinGrams: Double,
    @SerializedName("water_intake_liters") val waterLiters: Double,
    @SerializedName("nutrition_adequate") val nutritionAdequate: Boolean,
    @SerializedName("training_duration_minutes") val trainingDurationMins: Double,
    @SerializedName("training_intensity_1_10") val trainingIntensity: Double,
    @SerializedName("rpe_1_10") val rpe: Double,
    @SerializedName("sessions_last_7d") val sessionsLast7d: Int,
    @SerializedName("high_intensity_sessions_7d") val highIntensitySessions7d: Int,
    @SerializedName("hours_since_intense_session") val hoursSinceIntenseSession: Double
)
