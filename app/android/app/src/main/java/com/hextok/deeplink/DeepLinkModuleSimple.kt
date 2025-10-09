package com.hextok.deeplink

import android.content.Context
import android.net.Uri
import android.util.Log
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.tasm.behavior.LynxContext
import org.json.JSONObject

/**
 * Simple DeepLinkModule for Lynx - just stores and retrieves deep link data
 */
class DeepLinkModuleSimple(context: Context) : LynxModule(context) {
    
    companion object {
        private const val TAG = "DeepLinkModuleSimple"
        private var lastDeepLinkData: HashMap<String, Any>? = null
        private var lastDeepLinkJson: String? = null

        @JvmStatic
        fun storeDeepLink(uri: Uri) {
            try {
                Log.d(TAG, "Storing deep link (raw): ${uri.toString()}")

                val data = HashMap<String, Any>()
                data["url"] = uri.toString()
                data["host"] = uri.host ?: ""
                data["path"] = uri.path ?: ""

                val queryParams = HashMap<String, String?>()
                val queryJson = JSONObject()
                for (name in uri.queryParameterNames) {
                    // Ensure we never store null values in the map - convert to empty string
                    val v = uri.getQueryParameter(name) ?: ""
                    queryParams[name] = v
                    queryJson.put(name, v)
                }
                data["queryParams"] = queryParams
                data["timestamp"] = System.currentTimeMillis()

                // Keep the map for compatibility, but also store a JSON string to avoid bridge marshalling issues
                lastDeepLinkData = data
                val json = JSONObject()
                json.put("url", uri.toString())
                json.put("host", uri.host ?: "")
                json.put("path", uri.path ?: "")
                json.put("queryParams", queryJson)
                json.put("timestamp", System.currentTimeMillis())
                lastDeepLinkJson = json.toString()

                Log.d(TAG, "Deep link stored successfully (json length=${lastDeepLinkJson?.length})")
            } catch (e: Exception) {
                Log.e(TAG, "Error storing deep link", e)
            }
        }
    }
    
    init {
        Log.d(TAG, "DeepLinkModule initialized!")
    }

    private fun getContext(): Context {
        return when (mContext) {
            is LynxContext -> (mContext as LynxContext).context
            is Context -> mContext as Context
            else -> throw IllegalStateException("Unable to get Android Context from Lynx context")
        }
    }

    /**
     * Get the last received deep link data
     */
    @LynxMethod
    fun getLastDeepLink(callback: Callback) {
        try {
            Log.d(TAG, "getLastDeepLink called - returning JSON string")
            // Return JSON string to JS to avoid complex map marshalling issues
            callback.invoke(lastDeepLinkJson)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get last deep link", e)
            callback.invoke(null)
        }
    }

    /**
     * Clear the stored deep link data
     */
    @LynxMethod
    fun clearDeepLink() {
        try {
            Log.d(TAG, "clearDeepLink called")
            lastDeepLinkData = null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear deep link", e)
        }
    }

    /**
     * Check if there is stored deep link data
     */
    @LynxMethod
    fun hasDeepLink(callback: Callback) {
        try {
            Log.d(TAG, "hasDeepLink called")
            callback.invoke(lastDeepLinkData != null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check deep link", e)
            callback.invoke(false)
        }
    }

    @LynxMethod
    fun testMethod() {
        Log.d(TAG, "testMethod called - DeepLinkModule is working!")
    }
}