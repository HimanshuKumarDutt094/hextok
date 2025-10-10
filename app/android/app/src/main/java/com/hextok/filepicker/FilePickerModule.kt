package com.hextok.filepicker

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.lynx.react.bridge.JavaOnlyArray
import com.lynx.react.bridge.JavaOnlyMap
import com.lynx.tasm.behavior.LynxContext

class FilePickerModule(context: Context) : LynxModule(context) {

    companion object {
        private const val MODULE_NAME = "FilePickerModule"

        // Pending callbacks keyed by requestId. The Activity will call
        // FilePickerModule.deliverResult(requestId, result) when it finishes.
        private val pendingCallbacks: MutableMap<String, Callback> =
            java.util.concurrent.ConcurrentHashMap()

        @JvmStatic
        fun deliverResult(requestId: String?, result: Any?) {
            try {
                try {
                    android.util.Log.d(MODULE_NAME, "deliverResult called requestId=$requestId")
                } catch (ignored: Exception) {
                }
                val cb = if (requestId != null) pendingCallbacks.remove(requestId) else null
                try {
                    android.util.Log.d(
                        MODULE_NAME,
                        "deliverResult cbFound=${cb != null} resultClass=${result?.javaClass?.name} preview=${
                            result?.toString()?.take(200)
                        }"
                    )
                } catch (ignored: Exception) {
                }
                if (cb != null) {
                    // Convert result (if it's a List<Map<...>>) into JavaOnlyArray/JavaOnlyMap
                    var converted: Any? = null
                    try {
                        if (result is java.util.List<*>) {
                            val arr = JavaOnlyArray()
                            for (item in result) {
                                if (item is Map<*, *>) {
                                    val jm = JavaOnlyMap()
                                    for ((k, v) in item) {
                                        try {
                                            when (v) {
                                                is Number -> jm.putDouble(k as String, v.toDouble())
                                                is Boolean -> jm.putBoolean(k as String, v)
                                                is String -> jm.putString(k as String, v)
                                                else -> jm.putString(k as String, v?.toString())
                                            }
                                        } catch (ignored: Exception) {
                                        }
                                    }
                                    arr.pushMap(jm)
                                } else {
                                    // push stringified fallback
                                    arr.pushString(item?.toString())
                                }
                            }
                            converted = arr
                        } else if (result is Map<*, *>) {
                            val jm = JavaOnlyMap()
                            for ((k, v) in result) {
                                try {
                                    when (v) {
                                        is Number -> jm.putDouble(k as String, v.toDouble())
                                        is Boolean -> jm.putBoolean(k as String, v)
                                        is String -> jm.putString(k as String, v)
                                        else -> jm.putString(k as String, v?.toString())
                                    }
                                } catch (ignored: Exception) {
                                }
                            }
                            converted = jm
                        } else {
                            converted = result
                        }
                    } catch (ignored: Exception) {
                        converted = result
                    }

                    // Ensure callbacks are invoked on main thread
                    try {
                        val handler = android.os.Handler(android.os.Looper.getMainLooper())
                        handler.post {
                            try {
                                // error-first: first arg is null on success, second is result (may be null for cancel)
                                cb.invoke(null, converted)
                            } catch (e: Exception) {
                                try {
                                    android.util.Log.e(
                                        MODULE_NAME,
                                        "callback.invoke threw: " + e.message,
                                        e
                                    )
                                } catch (ignored: Exception) {
                                }
                            }
                        }
                    } catch (e: Exception) {
                        try {
                            android.util.Log.e(
                                MODULE_NAME,
                                "deliverResult handler error: " + e.message,
                                e
                            )
                        } catch (ignored: Exception) {
                        }
                        try {
                            cb.invoke(null, converted)
                        } catch (ignored: Exception) {
                        }
                    }
                }
            } catch (ignored: Exception) {
            }
        }
    }

    init {
        // Helpful log to confirm module construction at runtime
        try {
            Log.d(MODULE_NAME, "FilePickerModule constructed and registered")
        } catch (ignored: Exception) {
        }
    }

    @LynxMethod
    fun open(options: ReadableMap?, callback: Callback) {
        var act: Activity? = null
        try {
            val ctx = mContext
            when (ctx) {
                is Activity -> act = ctx
                is LynxContext -> {
                    val real = ctx.context
                    if (real is Activity) act = real
                }
            }
        } catch (ignored: Exception) {
        }

        if (act == null) {
            val error: MutableMap<String, Any> = HashMap()
            error["code"] = "NO_ACTIVITY"
            error["message"] = "Cannot find Activity to start file picker"
            callback.invoke(error)
            return
        }
        val it = Intent(act, FilePickerActivity::class.java)

        // Generate a requestId and store the callback so the Activity can
        // deliver the result later.
        val requestId = java.util.UUID.randomUUID().toString()
        try {
            android.util.Log.d(MODULE_NAME, "open() generating requestId=$requestId")
        } catch (ignored: Exception) {
        }
        pendingCallbacks[requestId] = callback

        if (options != null) {
            try {
                if (options.hasKey("multiple")) it.putExtra(
                    "multiple",
                    options.getBoolean("multiple")
                )
            } catch (ignored: Exception) {
            }
            try {
                if (options.hasKey("accepts")) it.putExtra("accepts", options.getString("accepts"))
            } catch (ignored: Exception) {
            }
            try {
                if (options.hasKey("includeBase64")) it.putExtra(
                    "includeBase64",
                    options.getBoolean("includeBase64")
                )
            } catch (ignored: Exception) {
            }
            try {
                if (options.hasKey("copyToCacheDirectory")) it.putExtra(
                    "copyToCacheDirectory",
                    options.getBoolean("copyToCacheDirectory")
                )
            } catch (ignored: Exception) {
            }
        }

        // Pass requestId to the Activity so it can call back when finished.
        it.putExtra("requestId", requestId)
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        act.startActivity(it)

        // Do NOT invoke the callback synchronously here. The callback will be
        // invoked from deliverResult(requestId, result) when the Activity finishes.
    }

    // Diagnostic method to test passing complex objects to JS
    @LynxMethod
    fun diagnosticReturnComplex(callback: Callback) {
        try {
            val item: MutableMap<String, Any> = HashMap()
            item["name"] = "diagnostic-file"
            item["size"] = 123
            val list: MutableList<Map<String, Any>> = ArrayList()
            list.add(item)

            // Convert to JavaOnlyArray/JavaOnlyMap for Lynx bridge
            val arr = JavaOnlyArray()
            val jm = JavaOnlyMap()
            jm.putString("name", "diagnostic-file")
            jm.putDouble("size", 123.0)
            arr.pushMap(jm)

            val handler = android.os.Handler(android.os.Looper.getMainLooper())
            handler.post { callback.invoke(null, arr) }
        } catch (e: Exception) {
            try {
                val error: MutableMap<String, Any> = HashMap()
                error["code"] = "DIAG_ERROR"
                error["message"] = e.message ?: "unknown"
                callback.invoke(error)
            } catch (ignored: Exception) {
            }
        }
    }
}
