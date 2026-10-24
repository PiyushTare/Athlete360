# Health Connect ProGuard Rules
-keep class androidx.health.connect.client.** { *; }
-keepclassmembers class * {
    @androidx.health.connect.client.records.* <fields>;
}

# Retrofit / Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.athlete360.companion.data.model.** { *; }
-keep class com.google.gson.** { *; }
