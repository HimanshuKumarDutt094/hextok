package com.hextok.filepicker

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.Manifest
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import android.util.Log
import androidx.annotation.Nullable

class PermissionRequestActivity : Activity() {

    companion object {
        private const val REQ_MANAGE = 0xF11
        private const val REQ_RUNTIME = 0xF12
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val requestId = try { intent.getStringExtra("requestId") } catch (e: Exception) { null }

        try {
            try { Log.d("PermissionRequestActivity", "onCreate entered, SDK=" + Build.VERSION.SDK_INT) } catch (ignored: Exception) {}
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    val img = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED
                    val vid = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) == PackageManager.PERMISSION_GRANTED
                    if (!img && !vid) {
                        try { Log.d("PermissionRequestActivity", "requesting READ_MEDIA_* runtime permissions") } catch (ignored: Exception) {}
                        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO), REQ_RUNTIME)
                        return
                    } else {
                        try { Log.d("PermissionRequestActivity", "media permissions already granted: " + (img || vid)) } catch (ignored: Exception) {}
                        FilePermissionModule.deliverPermissionResult(requestId, img || vid)
                        finish()
                        return
                    }
                }

                try {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
                        try { Log.d("PermissionRequestActivity", "READ_EXTERNAL_STORAGE already granted on R/S") } catch (ignored: Exception) {}
                        FilePermissionModule.deliverPermissionResult(requestId, true)
                        finish()
                        return
                    } else {
                        try { Log.d("PermissionRequestActivity", "requesting READ_EXTERNAL_STORAGE runtime permission on R/S") } catch (ignored: Exception) {}
                        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), REQ_RUNTIME)
                        return
                    }
                } catch (e: Exception) {
                    try { Log.e("PermissionRequestActivity", "exception while checking/requesting READ_EXTERNAL_STORAGE", e) } catch (ignored: Exception) {}
                    val it = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
                    it.data = Uri.parse("package:" + packageName)
                    it.putExtra("requestId", requestId)
                    startActivityForResult(it, REQ_MANAGE)
                    return
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    try { Log.d("PermissionRequestActivity", "requesting READ_EXTERNAL_STORAGE runtime permission") } catch (ignored: Exception) {}
                    ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), REQ_RUNTIME)
                    return
                } else {
                    try { Log.d("PermissionRequestActivity", "READ_EXTERNAL_STORAGE already granted") } catch (ignored: Exception) {}
                    FilePermissionModule.deliverPermissionResult(requestId, true)
                    finish()
                    return
                }
            } else {
                FilePermissionModule.deliverPermissionResult(requestId, true)
                finish()
                return
            }
        } catch (e: Exception) {
            try { Log.e("PermissionRequestActivity", "onCreate exception", e) } catch (ignored: Exception) {}
            FilePermissionModule.deliverPermissionResult(requestId, false)
            finish()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_MANAGE) {
            var granted = false
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    granted = android.os.Environment.isExternalStorageManager()
                }
            } catch (ignored: Exception) {}
            val requestId = try { intent.getStringExtra("requestId") } catch (e: Exception) { null }
            FilePermissionModule.deliverPermissionResult(requestId, granted)
        }
        if (requestCode != REQ_MANAGE) {
            finish()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_RUNTIME) {
            var granted = false
            try {
                for (i in grantResults.indices) {
                    val res = grantResults[i]
                    val perm = if (permissions != null && i < permissions.size) permissions[i] else "<unknown>"
                    try { Log.d("PermissionRequestActivity", "onRequestPermissionsResult: $perm => $res") } catch (ignored: Exception) {}
                    if (res == PackageManager.PERMISSION_GRANTED) {
                        granted = true
                    }
                }
            } catch (ignored: Exception) {}
            try { Log.d("PermissionRequestActivity", "permissions granted? $granted") } catch (ignored: Exception) {}
            val requestId = try { intent.getStringExtra("requestId") } catch (e: Exception) { null }
            FilePermissionModule.deliverPermissionResult(requestId, granted)
            finish()
        }
    }
}
