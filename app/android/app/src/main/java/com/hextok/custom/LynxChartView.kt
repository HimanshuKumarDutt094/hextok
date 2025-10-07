package com.hextok.custom

import android.content.Context
import android.graphics.Bitmap
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.event.LynxCustomEvent
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap
// Note: This file uses a simple Android View placeholder for charts so the project
// doesn't gain a hard dependency on MPAndroidChart. Replace with a real chart
// implementation if desired.

import android.view.View
import android.widget.FrameLayout

class LynxChartView(context: LynxContext) : LynxUI<FrameLayout>(context) {

  private var dataArray: ReadableArray? = null

  override fun createView(context: Context): FrameLayout {
    return FrameLayout(context)
  }

  @LynxProp(name = "data")
  fun setData(data: ReadableArray) {
    dataArray = data
    // No-op placeholder: a real chart implementation should map data -> view
    emitEvent("dataSet", mapOf("count" to data.size()))
  }

  @LynxProp(name = "animate")
  fun setAnimate(animate: Boolean) {
    if (animate) {
      // placeholder
    }
  }

  @LynxUIMethod
  fun exportChart(params: ReadableMap, callback: Callback) {
    try {
      // produce a tiny empty PNG as a placeholder
      val bmp = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
      callback.invoke(LynxUIMethodConstants.SUCCESS, "data:image/png;base64, ")
    } catch (e: Exception) {
      callback.invoke(LynxUIMethodConstants.UNKNOWN, e.message)
    }
  }

  private fun emitEvent(name: String, detail: Map<String, Any>) {
    try {
      val event = LynxCustomEvent(sign, name)
      detail.forEach { (k, v) -> event.addDetail(k, v) }
      lynxContext.eventEmitter.sendCustomEvent(event)
    } catch (_: Exception) { }
  }
}
