package com.athlete360.companion.ui

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.athlete360.companion.databinding.ActivityRationaleBinding

class PermissionsRationaleActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRationaleBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRationaleBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnCloseRationale.setOnClickListener {
            finish()
        }
    }
}
