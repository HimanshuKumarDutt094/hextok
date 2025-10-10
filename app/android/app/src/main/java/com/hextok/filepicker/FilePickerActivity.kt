package com.hextok.filepicker

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.content.ContentResolver
import android.database.Cursor
import android.provider.OpenableColumns
import android.os.Build
import androidx.annotation.Nullable
import java.io.InputStream
import java.util.ArrayList
import java.util.HashMap

class FilePickerActivity : Activity() {

    companion object {
        private const val REQUEST_CODE = 0xF10
        private const val CACHE_SUBDIR = "DocumentPicker"
    }

    private var requestId: String? = null
    private var includeBase64: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Read extras from the Activity intent (not a newly created Intent)
    val multiple = intentFromExtrasBoolean("multiple", false)
    val accepts = intentFromExtrasString("accepts")
    includeBase64 = intentFromExtrasBoolean("includeBase64", false)
    requestId = intentFromExtrasString("requestId")

        val pickIntent = Intent(Intent.ACTION_OPEN_DOCUMENT)
        pickIntent.addCategory(Intent.CATEGORY_OPENABLE)

        if (!accepts.isNullOrEmpty()) {
            pickIntent.type = accepts
        } else {
            pickIntent.type = "*/*"
        }

        pickIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple)

        try {
            startActivityForResult(Intent.createChooser(pickIntent, "Select file(s)"), REQUEST_CODE)
        } catch (e: Exception) {
            try { android.util.Log.e("FilePickerActivity", "ERROR_STARTING_INTENT: " + e.message, e) } catch (ignored: Exception) {}
            finish()
        }
    }

    private fun intentFromExtrasBoolean(key: String, default: Boolean): Boolean {
        return try { intent.getBooleanExtra(key, default) } catch (e: Exception) { default }
    }

    private fun intentFromExtrasString(key: String): String? {
        return try { intent.getStringExtra(key) } catch (e: Exception) { null }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode != REQUEST_CODE) {
            finish()
            return
        }
    val requestId = try { intent.getStringExtra("requestId") } catch (e: Exception) { null }
    try { android.util.Log.d("FilePickerActivity", "onActivityResult requestId=$requestId resultCode=$resultCode dataPresent=${data != null}") } catch (ignored: Exception) {}

        if (resultCode != RESULT_OK || data == null) {
            try { android.util.Log.i("FilePickerActivity", "User cancelled file picker or no data") } catch (ignored: Exception) {}
            // Deliver null result to JS to indicate cancel
            try { FilePickerModule.deliverResult(requestId, null) } catch (ignored: Exception) {}
            finish()
            return
        }

        val out: MutableList<Map<String, Any>> = ArrayList()

        try {
            val clip: ClipData? = data.clipData
            if (clip != null) {
                for (i in 0 until clip.itemCount) {
                    val uri = clip.getItemAt(i).uri
                    persistUriIfPossible(uri, data)
                    val fi = uriToMap(uri, includeBase64, shouldCopyToCache())
                    out.add(fi)
                }
            } else {
                val uri: Uri? = data.data
                if (uri != null) {
                    persistUriIfPossible(uri, data)
                    val fi = uriToMap(uri, includeBase64, shouldCopyToCache())
                    out.add(fi)
                }
            }

            try { android.util.Log.d("FilePickerActivity", "Picked files: " + out.toString()) } catch (ignored: Exception) {}
        } catch (e: Exception) {
            try { android.util.Log.e("FilePickerActivity", "ERROR_READING_FILES: " + e.message, e) } catch (ignored: Exception) {}
        }

        // Deliver the result to the module which will call the stored callback
        try { FilePickerModule.deliverResult(requestId, out) } catch (ignored: Exception) {}
        finish()
    }

    private fun uriToMap(uri: Uri, includeBase64: Boolean, copyToCache: Boolean): MutableMap<String, Any> {
        val m: MutableMap<String, Any> = HashMap()
        try {
            var outUri = uri
            if (copyToCache) {
                try {
                    outUri = copyUriToCache(uri)
                } catch (e: Exception) {
                    outUri = uri
                }
            }
            m["uri"] = outUri.toString()

            var name: String? = null
            var size: Long = -1
            val cr: ContentResolver = contentResolver
            var cursor: Cursor? = null
            try {
                cursor = cr.query(uri, null, null, null, null)
                if (cursor != null && cursor.moveToFirst()) {
                    val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
                    if (nameIdx != -1) name = cursor.getString(nameIdx)
                    if (sizeIdx != -1) size = cursor.getLong(sizeIdx)
                }
            } catch (ignored: Exception) {
            } finally {
                cursor?.close()
            }

            if (name == null) name = uri.lastPathSegment
            if (name != null) m["name"] = name
            if (size >= 0) m["size"] = size

            try {
                val mime = cr.getType(uri)
                if (mime != null) m["mimeType"] = mime
            } catch (ignored: Exception) {}

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    val c = cr.query(uri, arrayOf("last_modified"), null, null, null)
                    if (c != null && c.moveToFirst()) {
                        val idx = c.getColumnIndex("last_modified")
                        if (idx != -1) {
                            val lm = c.getLong(idx)
                            m["lastModified"] = lm
                        }
                    }
                    c?.close()
                }
            } catch (ignored: Exception) {}

            if (includeBase64) {
                val `is`: InputStream? = contentResolver.openInputStream(outUri)
                if (`is` != null) {
                    val buf = ByteArray(4096)
                    var len: Int
                    val baos = java.io.ByteArrayOutputStream()
                    while (`is`.read(buf).also { len = it } != -1) baos.write(buf, 0, len)
                    `is`.close()
                    val all = baos.toByteArray()
                    val b64 = Base64.encodeToString(all, Base64.NO_WRAP)
                    m["base64"] = b64
                    m["size"] = all.size
                }
            }
        } catch (ignored: Exception) {}
        return m
    }

    private fun shouldCopyToCache(): Boolean {
        return try { intent.getBooleanExtra("copyToCacheDirectory", false) } catch (e: Exception) { false }
    }

    @Throws(java.io.IOException::class)
    private fun copyUriToCache(src: Uri): Uri {
        var name: String? = null
        val cr: ContentResolver = contentResolver
        var cursor: Cursor? = null
        try {
            cursor = cr.query(src, null, null, null, null)
            if (cursor != null && cursor.moveToFirst()) {
                val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (nameIdx != -1) name = cursor.getString(nameIdx)
            }
        } catch (ignored: Exception) {
        } finally {
            cursor?.close()
        }

        if (name == null) name = src.lastPathSegment
        if (name == null) name = "file"

        val cacheDir = java.io.File(cacheDir, CACHE_SUBDIR)
        if (!cacheDir.exists()) cacheDir.mkdirs()

        var outFile = java.io.File(cacheDir, name)
        if (outFile.exists()) {
            var base = name
            var ext = ""
            val dot = name.lastIndexOf('.')
            if (dot > 0) {
                base = name.substring(0, dot)
                ext = name.substring(dot)
            }
            var n = 1
            var candidate: java.io.File
            do {
                candidate = java.io.File(cacheDir, base + "-" + n + ext)
                n++
            } while (candidate.exists() && n < 1000)
            outFile = candidate
        }

        val input = cr.openInputStream(src) ?: throw java.io.FileNotFoundException("Unable to open input stream")
        val out = java.io.FileOutputStream(outFile)
        try {
            val buf = ByteArray(8192)
            var r: Int
            while (input.read(buf).also { r = it } != -1) out.write(buf, 0, r)
        } finally {
            try { input.close() } catch (ignored: Exception) {}
            try { out.close() } catch (ignored: Exception) {}
        }

        return Uri.fromFile(outFile)
    }

    @SuppressLint("WrongConstant")
    private fun persistUriIfPossible(uri: Uri, data: Intent) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                val takeFlags = data.flags and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                contentResolver.takePersistableUriPermission(uri, takeFlags)
            }
        } catch (ignored: Exception) {}
    }
}
