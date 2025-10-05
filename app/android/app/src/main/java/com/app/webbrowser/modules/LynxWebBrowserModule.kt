// LynxWebBrowserModule.kt
// Android Native Module for LynxJS WebBrowser functionality
// Based on Expo WebBrowser but adapted for LynxJS architecture

package com.app.webbrowser.modules

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.net.Uri
import android.os.Bundle
import androidx.browser.customtabs.*
import androidx.browser.customtabs.CustomTabsIntent
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.WritableMap
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import java.util.concurrent.atomic.AtomicReference
import java.util.HashMap

class LynxWebBrowserModule(context: Context) : LynxModule(context) {
    
    companion object {
        private const val CUSTOM_TAB_PACKAGE_NAME = "com.android.chrome"
        private const val ACTION_CUSTOM_TABS_CONNECTION = "android.support.customtabs.action.CustomTabsService"
        
        // Result types
        private const val RESULT_TYPE_CANCEL = "cancel"
        private const val RESULT_TYPE_DISMISS = "dismiss" 
        private const val RESULT_TYPE_OPENED = "opened"
        private const val RESULT_TYPE_LOCKED = "locked"
    }
    
    private var customTabsClient: CustomTabsClient? = null
    private var customTabsSession: CustomTabsSession? = null
    private var customTabsServiceConnection: CustomTabsServiceConnection? = null
    private val currentPackageName = AtomicReference<String>()
    
    private fun getContext(): Context {
        val lynxContext = mContext as LynxContext
        return lynxContext.getContext()
    }
    
    // Core browser operations
    @LynxMethod
    fun openBrowserAsync(url: String, options: ReadableMap, callback: Callback) {
        try {
            val context = getContext()
            val uri = Uri.parse(url)
            
            val customTabsIntent = buildCustomTabsIntent(options)
            val browserPackage = options.getString("browserPackage") 
                ?: getPreferredCustomTabsPackage(context)
                
            if (browserPackage != null) {
                customTabsIntent.intent.setPackage(browserPackage)
            }
            
            // Launch Custom Tab
            try {
                customTabsIntent.launchUrl(context, uri)
                val result = HashMap<String, Any>().apply {
                    put("type", RESULT_TYPE_OPENED)
                }
                callback.invoke(null, result)
            } catch (e: Exception) {
                // Fallback to default browser
                val intent = Intent(Intent.ACTION_VIEW, uri)
                if (intent.resolveActivity(context.packageManager) != null) {
                    context.startActivity(intent)
                    val result = HashMap<String, Any>().apply {
                        put("type", RESULT_TYPE_OPENED)
                    }
                    callback.invoke(null, result)
                } else {
                    callback.invoke("No browser application found", null)
                }
            }
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }
    
    @LynxMethod
    fun dismissBrowser(callback: Callback) {
        // Custom tabs cannot be programmatically dismissed on Android
        // This is a limitation of the platform
        val result = HashMap<String, Any>().apply {
            put("type", RESULT_TYPE_DISMISS)
        }
        callback.invoke(null, result)
    }
    
    // Authentication session
    @LynxMethod
    fun openAuthSessionAsync(
        url: String, 
        redirectUrl: String?, 
        options: ReadableMap, 
        callback: Callback
    ) {
        // On Android, we use the same Custom Tabs approach as openBrowserAsync
        // The redirect handling will be managed by the JavaScript layer
        openBrowserAsync(url, options, callback)
    }
    
    @LynxMethod
    fun dismissAuthSession() {
        // Similar to dismissBrowser, this is not directly supported on Android
        // The JavaScript layer should handle this through app state changes
    }
    
    // Custom Tabs management
    @LynxMethod
    fun getCustomTabsSupportingBrowsersAsync(callback: Callback) {
        try {
            val context = getContext()
            val result = getCustomTabsSupportingBrowsers(context)
            callback.invoke(null, result)
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }
    
    @LynxMethod
    fun warmUpAsync(browserPackage: String?, callback: Callback) {
        GlobalScope.launch(Dispatchers.Main) {
            try {
                val packageName = browserPackage ?: getPreferredCustomTabsPackage(getContext())
                if (packageName == null) {
                    callback.invoke(null, HashMap<String, Any>())
                    return@launch
                }
                
                val connection = object : CustomTabsServiceConnection() {
                    override fun onCustomTabsServiceConnected(name: android.content.ComponentName, client: CustomTabsClient) {
                        customTabsClient = client
                        val warmUpSuccess = client.warmup(0L)
                        val result = HashMap<String, Any>().apply {
                            put("servicePackage", packageName)
                        }
                        callback.invoke(null, result)
                    }
                    
                    override fun onServiceDisconnected(name: android.content.ComponentName) {
                        customTabsClient = null
                    }
                }
                
                val bound = CustomTabsClient.bindCustomTabsService(getContext(), packageName, connection)
                if (bound) {
                    customTabsServiceConnection = connection
                    currentPackageName.set(packageName)
                } else {
                    callback.invoke(null, HashMap<String, Any>())
                }
            } catch (e: Exception) {
                callback.invoke(e.message, null)
            }
        }
    }
    
    @LynxMethod
    fun mayInitWithUrlAsync(url: String, browserPackage: String?, callback: Callback) {
        try {
            val packageName = browserPackage ?: currentPackageName.get()
            if (customTabsClient != null && packageName != null) {
                if (customTabsSession == null) {
                    customTabsSession = customTabsClient?.newSession(null)
                }
                
                val uri = Uri.parse(url)
                customTabsSession?.mayLaunchUrl(uri, null, null)
                
                val result = HashMap<String, Any>().apply {
                    put("servicePackage", packageName)
                }
                callback.invoke(null, result)
            } else {
                callback.invoke(null, HashMap<String, Any>())
            }
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }
    
    @LynxMethod
    fun coolDownAsync(browserPackage: String?, callback: Callback) {
        try {
            val packageName = browserPackage ?: currentPackageName.get()
            
            customTabsServiceConnection?.let { connection ->
                getContext().unbindService(connection)
                customTabsServiceConnection = null
                customTabsClient = null
                customTabsSession = null
                currentPackageName.set(null)
            }
            
            val result = HashMap<String, Any>().apply {
                if (packageName != null) {
                    put("servicePackage", packageName)
                }
            }
            callback.invoke(null, result)
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }
    
    // Web platform polyfill method (no-op on Android)
    @LynxMethod
    fun maybeCompleteAuthSession(options: ReadableMap, callback: Callback) {
        val result = HashMap<String, Any>().apply {
            put("type", "failed")
            put("message", "Not supported on this platform")
        }
        callback.invoke(null, result)
    }
    
    // Helper methods
    private fun buildCustomTabsIntent(options: ReadableMap): CustomTabsIntent {
        val builder = CustomTabsIntent.Builder(customTabsSession)
        
        // Apply styling options
        options.getString("toolbarColor")?.let { color ->
            try {
                builder.setToolbarColor(android.graphics.Color.parseColor(color))
            } catch (e: Exception) {
                // Invalid color, ignore
            }
        }
        
        options.getString("secondaryToolbarColor")?.let { color ->
            try {
                builder.setSecondaryToolbarColor(android.graphics.Color.parseColor(color))
            } catch (e: Exception) {
                // Invalid color, ignore
            }
        }
        
        if (options.hasKey("showTitle") && options.getBoolean("showTitle")) {
            builder.setShowTitle(true)
        }
        
        if (options.hasKey("enableDefaultShareMenuItem") && options.getBoolean("enableDefaultShareMenuItem")) {
            builder.addDefaultShareMenuItem()
        }
        
        if (options.hasKey("enableBarCollapsing") && !options.getBoolean("enableBarCollapsing")) {
            // Note: There's no direct API to disable bar collapsing in Custom Tabs
            // This would require custom implementation
        }
        
        return builder.build()
    }
    
    private fun getCustomTabsSupportingBrowsers(context: Context): HashMap<String, Any> {
        val packageManager = context.packageManager
        
        // Query for browsers that support Custom Tabs
        val browsers = mutableListOf<String>()
        val servicePackages = mutableListOf<String>()
        
        // Get all browsers
        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("http://"))
        val resolveInfoList = packageManager.queryIntentActivities(
            browserIntent, 
            PackageManager.MATCH_ALL
        )
        
        for (resolveInfo in resolveInfoList) {
            val packageName = resolveInfo.activityInfo.packageName
            browsers.add(packageName)
            
            // Check if browser supports Custom Tabs service
            val serviceIntent = Intent().apply {
                action = ACTION_CUSTOM_TABS_CONNECTION
                setPackage(packageName)
            }
            
            if (packageManager.resolveService(serviceIntent, 0) != null) {
                servicePackages.add(packageName)
            }
        }
        
        // Get default browser
        val defaultBrowserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("http://www.example.com"))
        val defaultResolveInfo = packageManager.resolveActivity(
            defaultBrowserIntent, 
            PackageManager.MATCH_DEFAULT_ONLY
        )
        val defaultBrowser = defaultResolveInfo?.activityInfo?.packageName
        
        // Determine preferred browser (default browser that also supports Custom Tabs)
        val preferredBrowser = if (defaultBrowser != null && servicePackages.contains(defaultBrowser)) {
            defaultBrowser
        } else if (servicePackages.isNotEmpty()) {
            servicePackages[0]
        } else {
            null
        }
        
        return HashMap<String, Any>().apply {
            put("browserPackages", ArrayList<String>().apply {
                browsers.forEach { add(it) }
            })
            put("servicePackages", ArrayList<String>().apply {
                servicePackages.forEach { add(it) }
            })
            put("defaultBrowserPackage", defaultBrowser ?: "")
            put("preferredBrowserPackage", preferredBrowser ?: "")
        }
    }
    
    private fun getPreferredCustomTabsPackage(context: Context): String? {
        val result = getCustomTabsSupportingBrowsers(context)
        return result["preferredBrowserPackage"] as? String
    }
}