// BrowserLauncherActivity.kt
// Activity to handle browser state persistence and proper app lifecycle management
// Based on Expo WebBrowser plugin implementation

package com.app.webbrowser

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class BrowserLauncherActivity : Activity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val application = application as com.app.MainApplication
        
        // Check if MainActivity is already in the back stack
        if (!application.isActivityInBackStack(com.app.MainActivity::class.java)) {
            // Launch MainActivity if not already running
            val intent = Intent(this, com.app.MainActivity::class.java).apply {
                // Copy any extras from the original intent
                extras?.let { putExtras(it) }
                
                // Preserve any data or action from deep links
                data = intent.data
                action = intent.action
                
                // Clear top to ensure proper navigation stack
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            startActivity(intent)
        }
        
        // Immediately finish this launcher activity
        finish()
    }
}