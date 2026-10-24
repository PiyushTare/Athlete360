package com.athlete360.companion.data.remote

import com.athlete360.companion.data.model.LoginRequest
import com.athlete360.companion.data.model.LoginResponse
import com.athlete360.companion.data.model.MlPredictRequest
import com.athlete360.companion.data.model.MlPredictResponse
import com.athlete360.companion.data.model.ModelMetricsResponse
import com.athlete360.companion.data.model.PingResponse
import com.athlete360.companion.data.model.QuestionnaireSubmitRequest
import com.athlete360.companion.data.model.ReadinessHistoryResponse
import com.athlete360.companion.data.model.SyncPayload
import com.athlete360.companion.data.model.SyncResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface Athlete360ApiService {

    @GET("smartwatch/ping")
    suspend fun ping(): Response<PingResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("smartwatch/{athleteId}/sync")
    suspend fun syncVitals(
        @Path("athleteId") athleteId: String,
        @Body payload: SyncPayload
    ): Response<SyncResponse>

    @GET("readiness/model-metrics")
    suspend fun getModelMetrics(): Response<ModelMetricsResponse>

    @POST("readiness/predict")
    suspend fun predictReadiness(@Body request: MlPredictRequest): Response<MlPredictResponse>

    @POST("readiness/questionnaire/{athleteId}")
    suspend fun submitQuestionnaire(
        @Path("athleteId") athleteId: String,
        @Body request: QuestionnaireSubmitRequest
    ): Response<MlPredictResponse>

    @GET("readiness/history/{athleteId}")
    suspend fun getReadinessHistory(
        @Path("athleteId") athleteId: String
    ): Response<ReadinessHistoryResponse>
}

