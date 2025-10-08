// MainApplicationBrowserSupport.kt
// Helper class for MainApplication to support browser state tracking (Java 11)

package com.hextok.webbrowser

import android.app.Activity
import android.app.Application
import android.os.Bundle

/**
 * Helper class for MainApplication to support browser state tracking
 * This code should be integrated into your existing MainApplication class
 */
class MainApplicationBrowserSupport {
    
    // Activity tracking for browser state management
    private val runningActivities = ArrayList<Class<*>>()
    
    // Activity lifecycle callbacks for tracking active activities
    private val lifecycleCallbacks = object : Application.ActivityLifecycleCallbacks {
        
        override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
            val activityClass = activity.javaClass
            if (!runningActivities.contains(activityClass)) {
                runningActivities.add(activityClass)
            }
        }
        
        override fun onActivityStarted(activity: Activity) {
            // No implementation needed
        }
        
        override fun onActivityResumed(activity: Activity) {
            // No implementation needed
        }
        
        override fun onActivityPaused(activity: Activity) {
            // No implementation needed
        }
        
        override fun onActivityStopped(activity: Activity) {
            // No implementation needed
        }
        
        override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {
            // No implementation needed
        }
        
        override fun onActivityDestroyed(activity: Activity) {
            val activityClass = activity.javaClass
            runningActivities.remove(activityClass)
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
        return ArrayList(runningActivities)
    }
    
    /**
     * Register the lifecycle callbacks with the application
     * Call this in your MainApplication.onCreate()
     */
    fun registerLifecycleCallbacks(application: Application) {
        application.registerActivityLifecycleCallbacks(lifecycleCallbacks)
    }
    
    /**
     * Unregister the lifecycle callbacks
     * Call this in your MainApplication.onTerminate() if overridden
     */
    fun unregisterLifecycleCallbacks(application: Application) {
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
 * class MainApplication : Application() {
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