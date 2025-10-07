package com.hextok.securestorage

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
    fun setBinary(handle: String, key: String, valueBase64: String, callback: Callback) {
        try {
            val decoded = String(Base64.decode(valueBase64, Base64.DEFAULT))
            runOnMain {
                val store = stores.getOrPut(handle) { mutableMapOf() }
                store[key] = decoded
                callback.invoke(null)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "SET_BINARY_ERROR"
            error["message"] = e.message ?: "Failed to set binary value"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun getBinary(handle: String, key: String, callback: Callback) {
        try {
            runOnMain {
                val store = stores[handle]
                val value = store?.get(key)
                if (value == null) {
                    callback.invoke(null, null)
                } else {
                    val encoded = Base64.encodeToString(value.toByteArray(), Base64.NO_WRAP)
                    callback.invoke(null, encoded)
                }
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "GET_BINARY_ERROR"
            error["message"] = e.message ?: "Failed to get binary value"
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

    @LynxMethod
    fun getKeys(handle: String, callback: Callback) {
        try {
            runOnMain {
                val keys = stores[handle]?.keys?.toList() ?: emptyList<String>()
                callback.invoke(null, keys)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "GET_KEYS_ERROR"
            error["message"] = e.message ?: "Failed to get keys"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun getUsage(handle: String, callback: Callback) {
        try {
            runOnMain {
                val store = stores[handle]
                val bytesUsed = store?.entries?.sumOf { it.value.toByteArray().size } ?: 0
                val itemCount = store?.size ?: 0
                val usage = HashMap<String, Any>()
                usage["bytesUsed"] = bytesUsed
                usage["itemCount"] = itemCount
                callback.invoke(null, usage)
            }
        } catch (e: Exception) {
            val error = HashMap<String, Any>()
            error["code"] = "GET_USAGE_ERROR"
            error["message"] = e.message ?: "Failed to get usage"
            callback.invoke(error)
        }
    }
}