// MainApplicationExtensions.kt
// Extensions and modifications for MainApplication to support browser state tracking
// This code should be integrated into your existing MainApplication class

package com.app.webbrowser

import android.app.Activity
import android.app.Application.ActivityLifecycleCallbacks
import android.os.Bundle

// Add these properties and methods to your existing MainApplication class

class MainApplicationBrowserSupport {
    // Activity tracking for browser state management
    private val runningActivities = ArrayList<Class<*>>()
    
    // Activity lifecycle callbacks for tracking active activities
    private val lifecycleCallbacks = object : ActivityLifecycleCallbacks {
        override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
            if (!runningActivities.contains(activity::class.java)) {
                runningActivities.add(activity::class.java)
            }
        }
        
        override fun onActivityStarted(activity: Activity) = Unit
        override fun onActivityResumed(activity: Activity) = Unit
        override fun onActivityPaused(activity: Activity) = Unit
        override fun onActivityStopped(activity: Activity) = Unit
        override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
        
        override fun onActivityDestroyed(activity: Activity) {
            if (runningActivities.contains(activity::class.java)) {
                runningActivities.remove(activity::class.java)
            }
        }
    }
    
    /**
     * Check if a specific activity class is currently in the back stack
     * @param cls The activity class to check for
     * @return true if the activity is in the back stack, false otherwise
     */
    fun isActivityInBackStack(cls: Class<*>?): Boolean {
        return runningActivities.contains(cls)
    }
    
    /**
     * Get the list of currently running activities
     * @return List of activity classes currently in the back stack
     */
    fun getRunningActivities(): List<Class<*>> {
        return runningActivities.toList()
    }
    
    /**
     * Register the lifecycle callbacks with the application
     * Call this in your MainApplication.onCreate()
     */
    fun registerLifecycleCallbacks(application: android.app.Application) {
        application.registerActivityLifecycleCallbacks(lifecycleCallbacks)
    }
    
    /**
     * Unregister the lifecycle callbacks
     * Call this in your MainApplication.onTerminate() if overridden
     */
    fun unregisterLifecycleCallbacks(application: android.app.Application) {
        application.unregisterActivityLifecycleCallbacks(lifecycleCallbacks)
    }
    
    /**
     * Clear all activity tracking (useful for testing or reset scenarios)
     */
    fun clearActivityTracking() {
        runningActivities.clear()
    }
}

/*
 * Integration instructions for your existing MainApplication:
 * 
 * 1. Add this property to your MainApplication class:
 *    private val browserSupport = MainApplicationBrowserSupport()
 * 
 * 2. In your onCreate() method, add:
 *    browserSupport.registerLifecycleCallbacks(this)
 * 
 * 3. Add this method to your MainApplication class:
 *    fun isActivityInBackStack(cls: Class<*>?): Boolean {
 *        return browserSupport.isActivityInBackStack(cls)
 *    }
 * 
 * 4. If you override onTerminate(), add:
 *    browserSupport.unregisterLifecycleCallbacks(this)
 * 
 * Example integration:
 * 
 * class MainApplication : Application(), ReactApplication {
 *     private val browserSupport = MainApplicationBrowserSupport()
 *     
 *     override fun onCreate() {
 *         super.onCreate()
 *         // ... your existing code ...
 *         browserSupport.registerLifecycleCallbacks(this)
 *     }
 *     
 *     fun isActivityInBackStack(cls: Class<*>?): Boolean {
 *         return browserSupport.isActivityInBackStack(cls)
 *     }
 *     
 *     override fun onTerminate() {
 *         super.onTerminate()
 *         browserSupport.unregisterLifecycleCallbacks(this)
 *     }
 * }
 */