package com.hextok.filepicker

import android.app.Application
import android.content.Context
import android.util.Log

class LynxFilePickerAdapter {
  private val TAG = "LynxFilePickerAdapter"

  fun init(context: Context) {
    try {
      com.lynx.tasm.LynxEnv.inst().registerModule(
        "FilePickerModule",
        com.hextok.filepicker.FilePickerModule::class.java,
      )
      Log.d(TAG, "FilePickerModule registered with LynxEnv")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to register FilePickerModule", e)
    }

    try {
      com.lynx.tasm.LynxEnv.inst().registerModule(
        "FilePermissionModule",
        com.hextok.filepicker.FilePermissionModule::class.java,
      )
      Log.d(TAG, "FilePermissionModule registered with LynxEnv")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to register FilePermissionModule", e)
    }

    if (context is Application) {
      // no-op for now, but we could register lifecycle callbacks if needed
    }
  }
}
