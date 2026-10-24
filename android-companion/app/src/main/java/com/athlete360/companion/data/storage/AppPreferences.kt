package com.athlete360.companion.data.storage

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("athlete360_companion_prefs", Context.MODE_PRIVATE)

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, "http://10.0.2.2:5000/api") ?: "http://10.0.2.2:5000/api"
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value.trimEnd('/')).apply()

    var athleteId: String
        get() = prefs.getString(KEY_ATHLETE_ID, "athlete-1") ?: "athlete-1"
        set(value) = prefs.edit().putString(KEY_ATHLETE_ID, value.trim()).apply()

    var athleteEmail: String
        get() = prefs.getString(KEY_ATHLETE_EMAIL, "alex.chen@athlete360.com") ?: "alex.chen@athlete360.com"
        set(value) = prefs.edit().putString(KEY_ATHLETE_EMAIL, value.trim()).apply()

    var authToken: String?
        get() = prefs.getString(KEY_AUTH_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_AUTH_TOKEN, value).apply()

    // Smartwatch Mode Sync Preferences
    var isAutoSyncEnabled: Boolean
        get() = prefs.getBoolean(KEY_AUTO_SYNC, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_SYNC, value).apply()

    var lastSyncTimestamp: Long
        get() = prefs.getLong(KEY_LAST_SYNC, 0L)
        set(value) = prefs.edit().putLong(KEY_LAST_SYNC, value).apply()

    // UI Mode Toggle (false = Smartwatch, true = Manual Dashboard)
    var isManualMode: Boolean
        get() = prefs.getBoolean(KEY_IS_MANUAL_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_MANUAL_MODE, value).apply()

    // Manual Dashboard Data (Strictly Independent from Smartwatch)
    var lastManualHeartRate: String
        get() = prefs.getString(KEY_LAST_MANUAL_HR, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LAST_MANUAL_HR, value).apply()

    var lastManualSpo2: String
        get() = prefs.getString(KEY_LAST_MANUAL_SPO2, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LAST_MANUAL_SPO2, value).apply()

    var manualFitnessIsFit: Boolean
        get() = prefs.getBoolean(KEY_MANUAL_FIT_IS_FIT, false)
        set(value) = prefs.edit().putBoolean(KEY_MANUAL_FIT_IS_FIT, value).apply()

    var manualFitnessScore: Int
        get() = prefs.getInt(KEY_MANUAL_FIT_SCORE, 0)
        set(value) = prefs.edit().putInt(KEY_MANUAL_FIT_SCORE, value).apply()

    var manualFitnessTitle: String
        get() = prefs.getString(KEY_MANUAL_FIT_TITLE, "") ?: ""
        set(value) = prefs.edit().putString(KEY_MANUAL_FIT_TITLE, value).apply()

    var manualFitnessHrAnalysis: String
        get() = prefs.getString(KEY_MANUAL_FIT_HR_ANALYSIS, "") ?: ""
        set(value) = prefs.edit().putString(KEY_MANUAL_FIT_HR_ANALYSIS, value).apply()

    var manualFitnessSpo2Analysis: String
        get() = prefs.getString(KEY_MANUAL_FIT_SPO2_ANALYSIS, "") ?: ""
        set(value) = prefs.edit().putString(KEY_MANUAL_FIT_SPO2_ANALYSIS, value).apply()

    var manualFitnessRecommendation: String
        get() = prefs.getString(KEY_MANUAL_FIT_REC, "") ?: ""
        set(value) = prefs.edit().putString(KEY_MANUAL_FIT_REC, value).apply()

    var manualFitnessTimestamp: Long
        get() = prefs.getLong(KEY_MANUAL_FIT_TIME, 0L)
        set(value) = prefs.edit().putLong(KEY_MANUAL_FIT_TIME, value).apply()

    val hasManualFitnessResult: Boolean
        get() = manualFitnessTimestamp > 0L

    // ML Readiness Prediction Cache
    var athleteSport: String
        get() = prefs.getString(KEY_ATHLETE_SPORT, "Football") ?: "Football"
        set(value) = prefs.edit().putString(KEY_ATHLETE_SPORT, value).apply()

    var lastMlStatus: String
        get() = prefs.getString(KEY_ML_STATUS, "FIT TO PLAY") ?: "FIT TO PLAY"
        set(value) = prefs.edit().putString(KEY_ML_STATUS, value).apply()

    var lastMlScore: Int
        get() = prefs.getInt(KEY_ML_SCORE, 85)
        set(value) = prefs.edit().putInt(KEY_ML_SCORE, value).apply()

    var lastMlConfidence: String
        get() = prefs.getString(KEY_ML_CONFIDENCE, "85%") ?: "85%"
        set(value) = prefs.edit().putString(KEY_ML_CONFIDENCE, value).apply()

    var lastMlQuality: String
        get() = prefs.getString(KEY_ML_QUALITY, "High") ?: "High"
        set(value) = prefs.edit().putString(KEY_ML_QUALITY, value).apply()

    var lastMlIsFit: Boolean
        get() = prefs.getBoolean(KEY_ML_IS_FIT, true)
        set(value) = prefs.edit().putBoolean(KEY_ML_IS_FIT, value).apply()

    var lastMlPositiveFactors: String
        get() = prefs.getString(KEY_ML_POSITIVE, "Heart rate is normal compared with personal baseline\nOptimal restorative sleep logged\nLow musculoskeletal soreness") ?: ""
        set(value) = prefs.edit().putString(KEY_ML_POSITIVE, value).apply()

    var lastMlConcerns: String
        get() = prefs.getString(KEY_ML_CONCERNS, "No critical physiological red flags detected.") ?: ""
        set(value) = prefs.edit().putString(KEY_ML_CONCERNS, value).apply()

    var lastMlRecommendation: String
        get() = prefs.getString(KEY_ML_RECOMMENDATION, "Your current recovery indicators are generally favorable for the next game. Maintain hydration and avoid unnecessary high-intensity training before competition.") ?: ""
        set(value) = prefs.edit().putString(KEY_ML_RECOMMENDATION, value).apply()

    var lastMlTimestamp: Long
        get() = prefs.getLong(KEY_ML_TIMESTAMP, 0L)
        set(value) = prefs.edit().putLong(KEY_ML_TIMESTAMP, value).apply()

    val hasMlPrediction: Boolean
        get() = lastMlTimestamp > 0L

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_ATHLETE_ID = "athlete_id"
        private const val KEY_ATHLETE_EMAIL = "athlete_email"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_AUTO_SYNC = "auto_sync"
        private const val KEY_LAST_SYNC = "last_sync"
        private const val KEY_IS_MANUAL_MODE = "is_manual_mode"

        private const val KEY_LAST_MANUAL_HR = "last_manual_hr"
        private const val KEY_LAST_MANUAL_SPO2 = "last_manual_spo2"
        private const val KEY_MANUAL_FIT_IS_FIT = "manual_fit_is_fit"
        private const val KEY_MANUAL_FIT_SCORE = "manual_fit_score"
        private const val KEY_MANUAL_FIT_TITLE = "manual_fit_title"
        private const val KEY_MANUAL_FIT_HR_ANALYSIS = "manual_fit_hr_analysis"
        private const val KEY_MANUAL_FIT_SPO2_ANALYSIS = "manual_fit_spo2_analysis"
        private const val KEY_MANUAL_FIT_REC = "manual_fit_rec"
        private const val KEY_MANUAL_FIT_TIME = "manual_fit_time"

        private const val KEY_ATHLETE_SPORT = "athlete_sport"
        private const val KEY_ML_STATUS = "ml_status"
        private const val KEY_ML_SCORE = "ml_score"
        private const val KEY_ML_CONFIDENCE = "ml_confidence"
        private const val KEY_ML_QUALITY = "ml_quality"
        private const val KEY_ML_IS_FIT = "ml_is_fit"
        private const val KEY_ML_POSITIVE = "ml_positive"
        private const val KEY_ML_CONCERNS = "ml_concerns"
        private const val KEY_ML_RECOMMENDATION = "ml_recommendation"
        private const val KEY_ML_TIMESTAMP = "ml_timestamp"
    }
}

