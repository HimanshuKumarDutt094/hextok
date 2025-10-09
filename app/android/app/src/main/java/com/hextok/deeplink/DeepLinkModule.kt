package com.hextok.deeplink

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback
import org.json.JSONObject
import java.net.URLDecoder

class DeepLinkModule(context: Context) : LynxModule(context) {
    
    companion object {
        private const val TAG = "DeepLinkModule"
        private var initialDeepLink: Intent? = null
        private var hasConsumedInitialLink = false
        private val listeners = mutableListOf<Callback>()
        
        /**
         * Call this from MainActivity to set the initial intent
         */
        fun setInitialIntent(intent: Intent?) {
            Log.d(TAG, "setInitialIntent called with: ${intent?.data}")
            initialDeepLink = intent
            hasConsumedInitialLink = false
        }
        
        /**
         * Call this from MainActivity when a new intent is received
         */
        fun handleNewIntent(intent: Intent?) {
            Log.d(TAG, "handleNewIntent called with: ${intent?.data}")
            intent?.let { newIntent ->
                val deepLinkData = parseIntent(newIntent)
                deepLinkData?.let { data ->
                    // Notify all listeners
                    listeners.forEach { callback ->
                        try {
                            callback.invoke(data)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error notifying listener", e)
                        }
                    }
                }
            }
        }
        
        private fun parseIntent(intent: Intent): String? {
            val action = intent.action
            val data = intent.data
            
            // Only handle VIEW intents with data
            if (action == Intent.ACTION_VIEW && data != null) {
                return parseUri(data)
            }
            
            return null
        }
        
        private fun parseUri(uri: Uri): String {
            val json = JSONObject()
            
            // Full URL
            json.put("url", uri.toString())
            
            // Scheme
            json.put("scheme", uri.scheme ?: "")
            
            // Host
            json.put("host", uri.host ?: "")
            
            // Path (clean it up to always start with /)
            val path = uri.path?.let { p ->
                if (p.startsWith("/")) p else "/$p"
            } ?: "/"
            json.put("path", path)
            
            // Query parameters
            val queryParams = JSONObject()
            uri.queryParameterNames?.forEach { paramName ->
                try {
                    val paramValue = uri.getQueryParameter(paramName)
                    if (paramValue != null) {
                        // URL decode the parameter value
                        val decodedValue = URLDecoder.decode(paramValue, "UTF-8")
                        queryParams.put(paramName, decodedValue)
                    }
                } catch (e: Exception) {
                    // Skip malformed parameters
                    Log.w(TAG, "Skipping malformed parameter: $paramName", e)
                }
            }
            json.put("queryParams", queryParams)
            
            return json.toString()
        }
    }
    
    private fun getContext(): Context {
        return when (mContext) {
            is LynxContext -> (mContext as LynxContext).context
            is Context -> mContext as Context
            else -> throw IllegalStateException("Unable to get Android Context from Lynx context")
        }
    }
    
    @LynxMethod
    fun getInitialDeepLink(callback: Callback) {
        try {
            Log.d(TAG, "getInitialDeepLink called")
            if (!hasConsumedInitialLink && initialDeepLink != null) {
                val deepLinkData = parseIntent(initialDeepLink!!)
                hasConsumedInitialLink = true
                Log.d(TAG, "Returning initial deep link: $deepLinkData")
                callback.invoke(deepLinkData)
            } else {
                Log.d(TAG, "No initial deep link available")
                callback.invoke(null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting initial deep link", e)
            callback.invoke(null)
        }
    }
    
    @LynxMethod
    fun addDeepLinkListener(listener: Callback) {
        Log.d(TAG, "addDeepLinkListener called")
        if (!listeners.contains(listener)) {
            listeners.add(listener)
        }
    }
    
    @LynxMethod
    fun removeDeepLinkListener(listener: Callback) {
        Log.d(TAG, "removeDeepLinkListener called")
        listeners.remove(listener)
    }
    
    @LynxMethod
    fun removeAllDeepLinkListeners() {
        Log.d(TAG, "removeAllDeepLinkListeners called")
        listeners.clear()
    }
    
    @LynxMethod
    fun canHandleScheme(scheme: String, callback: Callback) {
        try {
            Log.d(TAG, "canHandleScheme called with: $scheme")
            // Check if our app can handle this scheme
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("$scheme://test"))
            val packageManager = getContext().packageManager
            val resolveInfo = packageManager.resolveActivity(intent, 0)
            
            val canHandle = resolveInfo != null && 
                           resolveInfo.activityInfo.packageName == getContext().packageName
            
            Log.d(TAG, "Can handle scheme $scheme: $canHandle")
            callback.invoke(canHandle)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking scheme", e)
            callback.invoke(false)
        }
    }
    
    @LynxMethod
    fun simulateDeepLink(url: String) {
        try {
            Log.d(TAG, "simulateDeepLink called with: $url")
            val uri = Uri.parse(url)
            val simulatedIntent = Intent(Intent.ACTION_VIEW, uri)
            val deepLinkData = parseIntent(simulatedIntent)
            
            deepLinkData?.let { data ->
                // Notify all listeners with simulated data
                listeners.forEach { callback ->
                    try {
                        callback.invoke(data)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error in simulated deep link callback", e)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error simulating deep link", e)
        }
    }
}