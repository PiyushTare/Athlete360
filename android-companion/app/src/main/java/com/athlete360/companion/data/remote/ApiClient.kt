package com.athlete360.companion.data.remote

import android.content.Context
import com.athlete360.companion.data.storage.AppPreferences
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private var currentBaseUrl: String? = null
    private var cachedService: Athlete360ApiService? = null

    fun getService(context: Context): Athlete360ApiService {
        val prefs = AppPreferences(context)
        var baseUrl = prefs.serverUrl.trim()
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/"
        }

        if (cachedService != null && currentBaseUrl == baseUrl) {
            return cachedService!!
        }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(logging)
            .addInterceptor { chain ->
                val requestBuilder = chain.request().newBuilder()
                prefs.authToken?.let { token ->
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
                requestBuilder.addHeader("Content-Type", "application/json")
                requestBuilder.addHeader("Accept", "application/json")
                chain.proceed(requestBuilder.build())
            }
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        currentBaseUrl = baseUrl
        val service = retrofit.create(Athlete360ApiService::class.java)
        cachedService = service
        return service
    }

    fun invalidateCache() {
        cachedService = null
        currentBaseUrl = null
    }
}
