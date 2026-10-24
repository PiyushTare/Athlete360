package com.athlete360.companion.data.model

import com.google.gson.annotations.SerializedName

data class SyncPayload(
    @SerializedName("athlete_id") val athleteId: String,
    @SerializedName("device_name") val deviceName: String = "Fastrack Smartwatch",
    @SerializedName("model_identifier") val modelIdentifier: String = "Fastrack-HC",
    @SerializedName("connection_type") val connectionType: String = "HEALTH_CONNECT",
    @SerializedName("source") val source: String,
    @SerializedName("heart_rate_bpm") val heartRateBpm: Long? = null,
    @SerializedName("spo2_pct") val spo2Pct: Long? = null,
    @SerializedName("steps") val steps: Long? = null,
    @SerializedName("calories_kcal") val caloriesKcal: Long? = null,
    @SerializedName("sleep_duration_hours") val sleepDurationHours: Double? = null,
    @SerializedName("battery_level") val batteryLevel: Int? = null,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("raw_payload") val rawPayload: Map<String, Any>? = null
)

data class SyncResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("records_processed") val recordsProcessed: Int? = null,
    @SerializedName("device_id") val deviceId: String? = null
)

data class PingResponse(
    @SerializedName("status") val status: String,
    @SerializedName("serverTime") val serverTime: String? = null,
    @SerializedName("name") val name: String? = null
)

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String? = "athlete360",
    @SerializedName("role") val role: String = "athlete"
)

data class LoginResponse(
    @SerializedName("token") val token: String?,
    @SerializedName("error") val error: String?,
    @SerializedName("user") val user: Map<String, Any>? = null
)
