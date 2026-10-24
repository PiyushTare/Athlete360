package com.athlete360.companion.ui

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.lifecycle.findViewTreeLifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.athlete360.companion.data.remote.ApiClient
import com.athlete360.companion.data.storage.AppPreferences
import com.athlete360.companion.databinding.DialogSettingsBinding
import kotlinx.coroutines.launch

class SettingsDialog(
    context: Context,
    private val onSaved: () -> Unit
) : Dialog(context) {

    private lateinit var binding: DialogSettingsBinding
    private val prefs = AppPreferences(context)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DialogSettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Load existing settings
        binding.etServerUrl.setText(prefs.serverUrl)
        binding.etAthleteId.setText(prefs.athleteId)
        binding.etAthleteEmail.setText(prefs.athleteEmail)

        // Test Ping button
        binding.btnTestPing.setOnClickListener {
            val url = binding.etServerUrl.text.toString().trim()
            if (url.isBlank()) {
                Toast.makeText(context, "Please enter a valid server URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Save temporarily to test
            prefs.serverUrl = url
            ApiClient.invalidateCache()

            binding.btnTestPing.isEnabled = false
            binding.btnTestPing.text = "Testing..."

            val scope = window?.decorView?.findViewTreeLifecycleOwner()?.lifecycleScope
            if (scope != null) {
                scope.launch {
                    try {
                        val api = ApiClient.getService(context)
                        val response = api.ping()
                        if (response.isSuccessful && response.body()?.status == "ok") {
                            Toast.makeText(context, "Server connected successfully! Ping OK.", Toast.LENGTH_LONG).show()
                        } else {
                            Toast.makeText(context, "Server responded with error: ${response.code()}", Toast.LENGTH_LONG).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(context, "Ping failed: ${e.message}", Toast.LENGTH_LONG).show()
                    } finally {
                        binding.btnTestPing.isEnabled = true
                        binding.btnTestPing.text = "Test Ping"
                    }
                }
            } else {
                Toast.makeText(context, "Server URL updated.", Toast.LENGTH_SHORT).show()
                binding.btnTestPing.isEnabled = true
                binding.btnTestPing.text = "Test Ping"
            }
        }

        // Save Settings button
        binding.btnSaveSettings.setOnClickListener {
            val url = binding.etServerUrl.text.toString().trim()
            val athleteId = binding.etAthleteId.text.toString().trim()
            val email = binding.etAthleteEmail.text.toString().trim()

            if (url.isBlank() || athleteId.isBlank()) {
                Toast.makeText(context, "Server URL and Athlete ID are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            prefs.serverUrl = url
            prefs.athleteId = athleteId
            prefs.athleteEmail = email
            ApiClient.invalidateCache()

            Toast.makeText(context, "Settings saved.", Toast.LENGTH_SHORT).show()
            onSaved()
            dismiss()
        }
    }
}
