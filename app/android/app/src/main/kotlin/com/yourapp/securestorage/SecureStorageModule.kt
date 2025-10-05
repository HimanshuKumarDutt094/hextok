package com.yourapp.securestorage

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Base64
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import java.util.HashMap

class SecureStorageModule(context: Context) : LynxModule(context) {

    private val mainHandler = Handler(Looper.getMainLooper())
    private val stores: MutableMap<String, MutableMap<String, String>> = mutableMapOf()

    private fun runOnMain(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            block()
        } else {
            mainHandler.post { block() }
        }
    }

    @LynxMethod
    fun open(options: ReadableMap?, callback: Callback) {
        try {
            val name = options?.getString("name") ?: "default"
            val handle = "store:$name"
            runOnMain {
                if (!stores.containsKey(handle)) {
                    stores[handle] = mutableMapOf()
                }
                callback.invoke(null, handle)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "OPEN_ERROR"
            error["message"] = e.message ?: "Failed to open storage"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun close(handle: String, callback: Callback) {
        try {
            runOnMain { 
                callback.invoke(null)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "CLOSE_ERROR"
            error["message"] = e.message ?: "Failed to close storage"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun get(handle: String, key: String, callback: Callback) {
        try {
            runOnMain {
                val store = stores[handle]
                val value = store?.get(key)
                callback.invoke(null, value)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "GET_ERROR"
            error["message"] = e.message ?: "Failed to get value"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun set(handle: String, key: String, value: String, options: ReadableMap?, callback: Callback) {
        try {
            runOnMain {
                val store = stores.getOrPut(handle) { mutableMapOf() }
                store[key] = value
                callback.invoke(null)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "SET_ERROR"
            error["message"] = e.message ?: "Failed to set value"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun remove(handle: String, key: String, callback: Callback) {
        try {
            runOnMain {
                stores[handle]?.remove(key)
                callback.invoke(null)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "REMOVE_ERROR"
            error["message"] = e.message ?: "Failed to remove value"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun has(handle: String, key: String, callback: Callback) {
        try {
            runOnMain {
                val hasKey = stores[handle]?.containsKey(key) == true
                callback.invoke(null, hasKey)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "HAS_ERROR"
            error["message"] = e.message ?: "Failed to check key existence"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun clear(handle: String, callback: Callback) {
        try {
            runOnMain {
                stores[handle]?.clear()
                callback.invoke(null)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "CLEAR_ERROR"
            error["message"] = e.message ?: "Failed to clear storage"
            callback.invoke(error)
        }
    }
}
