// BrowserLauncherActivity.kt
// Activity to handle browser state persistence and proper app lifecycle management (Java 11)
// Based on Expo WebBrowser plugin implementation

package com.hextok.webbrowser

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import com.hextok.MainActivity

class BrowserLauncherActivity : Activity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get the MainApplication instance
        val app = application
        
        // Check if MainActivity is already in the back stack
        // Note: You'll need to implement isActivityInBackStack in your MainApplication
        try {
            val method = app.javaClass.getMethod("isActivityInBackStack", Class::class.java)
            val isInBackStack = method.invoke(app, MainActivity::class.java) as? Boolean
            
            if (isInBackStack == null || !isInBackStack) {
                // Launch MainActivity if not already running
                val intent = Intent(this, MainActivity::class.java).apply {
                    // Copy any extras from the original intent
                    intent.extras?.let { putExtras(it) }
                    
                    // Preserve any data or action from deep links
                    data = intent.data
                    action = intent.action
                    
                    // Clear top to ensure proper navigation stack
                    flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
                }
                
                startActivity(intent)
            }
        } catch (e: Exception) {
            // If reflection fails, just launch MainActivity anyway
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }
        
        // Immediately finish this launcher activity
        finish()
    }
}