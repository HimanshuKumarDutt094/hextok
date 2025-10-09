package com.hextok.filepicker

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.content.pm.PackageManager
import android.Manifest
import androidx.core.content.ContextCompat
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.tasm.behavior.LynxContext
import android.util.Log
import java.util.HashMap
import java.util.concurrent.ConcurrentHashMap

class FilePermissionModule(context: Context) : LynxModule(context) {

    init {
        try {
            Log.d("FilePermissionModule", "constructed")
        } catch (ignored: Exception) {
        }
    }

    @LynxMethod
    fun hasFilePermission(callback: Callback) {
        var granted = false
        try {
            try { Log.d("FilePermissionModule", "hasFilePermission: SDK=" + Build.VERSION.SDK_INT) } catch (ignored: Exception) {}
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && android.os.Environment.isExternalStorageManager()) {
                granted = true
            } else {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                    granted = true
                } else {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        val img = ContextCompat.checkSelfPermission(mContext, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED
                        val vid = ContextCompat.checkSelfPermission(mContext, Manifest.permission.READ_MEDIA_VIDEO) == PackageManager.PERMISSION_GRANTED
                        try { Log.d("FilePermissionModule", "READ_MEDIA_IMAGES=$img READ_MEDIA_VIDEO=$vid") } catch (ignored: Exception) {}
                        granted = img || vid
                    } else {
                        val res = ContextCompat.checkSelfPermission(mContext, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
                        try { Log.d("FilePermissionModule", "READ_EXTERNAL_STORAGE=$res") } catch (ignored: Exception) {}
                        granted = res
                    }
                }
            }

            try { Log.d("FilePermissionModule", "hasFilePermission -> $granted") } catch (ignored: Exception) {}
            callback.invoke(null, granted)
        } catch (e: Exception) {
            val error: MutableMap<String, Any> = HashMap()
            error["code"] = "PERMISSION_CHECK_ERROR"
            error["message"] = e.message ?: "Failed to check permission"
            callback.invoke(error)
        }
    }

    @LynxMethod
    fun requestFilePermission(callback: Callback) {
        var act: Activity? = null
        try {
            if (mContext is Activity) act = mContext as Activity
            else if (mContext is LynxContext) {
                val real = (mContext as LynxContext).context
                if (real is Activity) act = real
            }
        } catch (ignored: Exception) {
        }

        if (act == null) {
            val error: MutableMap<String, Any> = HashMap()
            error["code"] = "NO_ACTIVITY"
            error["message"] = "Cannot find Activity to request permission"
            callback.invoke(error)
            return
        }

        val requestId = java.util.UUID.randomUUID().toString()
        pendingCallbacks[requestId] = callback
        try { Log.d("FilePermissionModule", "requestFilePermission started; requestId=$requestId") } catch (ignored: Exception) {}
        val it = Intent(act, PermissionRequestActivity::class.java)
        it.putExtra("requestId", requestId)
        act.startActivity(it)
    }

    companion object {
        private val pendingCallbacks: MutableMap<String, Callback> = ConcurrentHashMap()

        @JvmStatic
        fun deliverPermissionResult(requestId: String?, granted: Boolean) {
            try { Log.d("FilePermissionModule", "deliverPermissionResult [$requestId] -> $granted") } catch (ignored: Exception) {}
            try {
                val cb = if (requestId != null) pendingCallbacks.remove(requestId) else null
                if (cb != null) cb.invoke(null, granted)
            } catch (ignored: Exception) {
            }
        }
    }
}
