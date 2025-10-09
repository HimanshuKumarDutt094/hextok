package com.hextok.filepicker

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import com.lynx.tasm.behavior.LynxContext

class FilePickerModule(context: Context) : LynxModule(context) {

    companion object {
        private const val MODULE_NAME = "FilePickerModule"
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
        if (options != null) {
            try {
                if (options.hasKey("multiple")) it.putExtra("multiple", options.getBoolean("multiple"))
            } catch (ignored: Exception) {}
            try {
                if (options.hasKey("accepts")) it.putExtra("accepts", options.getString("accepts"))
            } catch (ignored: Exception) {}
            try {
                if (options.hasKey("includeBase64")) it.putExtra("includeBase64", options.getBoolean("includeBase64"))
            } catch (ignored: Exception) {}
            try {
                if (options.hasKey("copyToCacheDirectory")) it.putExtra("copyToCacheDirectory", options.getBoolean("copyToCacheDirectory"))
            } catch (ignored: Exception) {}
        }
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        act.startActivity(it)

        // Invoke callback immediately (synchronous style)
        try {
            callback.invoke(null)
        } catch (e: Exception) {
            try {
                Log.e(MODULE_NAME, "Error invoking callback", e)
            } catch (ignored: Exception) {
            }
        }
    }
}
