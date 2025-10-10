package com.hextok.custom

import android.content.Context
import android.net.Uri
import android.widget.MediaController
import android.widget.VideoView
import androidx.core.net.toUri // Import the KTX extension function
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.event.LynxCustomEvent
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap

class LynxMediaPlayer(context: LynxContext) : LynxUI<VideoView>(context) {

  private var mediaController: MediaController? = null
  private var currentUrl: String? = null

  override fun createView(context: Context): VideoView {
    return VideoView(context).apply {
      mediaController = MediaController(context)
      setMediaController(mediaController)

      setOnPreparedListener { mp ->
        emitEvent("prepared", mapOf(
          "duration" to mp.duration,
          "width" to mp.videoWidth,
          "height" to mp.videoHeight
        ))
      }

      setOnCompletionListener {
        emitEvent("ended", emptyMap())
      }

      setOnErrorListener { _, what, extra ->
        emitEvent("error", mapOf("what" to what, "extra" to extra))
        true
      }
    }
  }

  @LynxProp(name = "src")
  fun setSrc(url: String) {
    if (url != currentUrl) {
      currentUrl = url
      val uri = url.toUri() // Using the KTX extension function
      mView.setVideoURI(uri)
    }
  }

  @LynxProp(name = "autoplay")
  fun setAutoplay(autoplay: Boolean) {
    if (autoplay && currentUrl != null) {
      mView.start()
    }
  }

  @LynxUIMethod
  fun play(params: ReadableMap, callback: Callback) {
    mView.start()
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  @LynxUIMethod
  fun pause(params: ReadableMap, callback: Callback) {
    mView.pause()
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  @LynxUIMethod
  fun seekTo(params: ReadableMap, callback: Callback) {
    val position = params.getInt("position")
    mView.seekTo(position)
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  private fun emitEvent(name: String, detail: Map<String, Any>) {
    try {
      val event = LynxCustomEvent(sign, name)
      detail.forEach { (k, v) -> event.addDetail(k, v) }
      lynxContext.eventEmitter.sendCustomEvent(event)
    } catch (_: Exception) { }
  }
}
