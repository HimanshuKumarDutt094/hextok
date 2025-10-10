package com.hextok.custom.video

import android.app.Activity
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.MediaController
import android.widget.VideoView
import androidx.core.net.toUri

class FullscreenVideoActivity : Activity() {

  companion object {
    const val EXTRA_URI = "extra_uri"
    const val EXTRA_MUTED = "extra_muted"
    const val EXTRA_LOOP = "extra_loop"
  }

  private var videoView: VideoView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // fullscreen flags
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    window.decorView.systemUiVisibility = (
      View.SYSTEM_UI_FLAG_FULLSCREEN
        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
    )

    // lock orientation to sensor landscape for fullscreen playback initially
    requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE

    val container = FrameLayout(this)

    videoView = VideoView(this).apply {
      layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
    }

    val mc = MediaController(this)
    mc.setAnchorView(videoView)
    videoView?.setMediaController(mc)

    container.addView(videoView)
    setContentView(container)

    val uriString = intent.getStringExtra(EXTRA_URI)
    uriString?.let {
      val uri = it.toUri()
      videoView?.setVideoURI(uri)
      videoView?.setOnPreparedListener { mp ->
        val muted = intent.getBooleanExtra(EXTRA_MUTED, false)
        if (muted) mp.setVolume(0f, 0f)
        mp.isLooping = intent.getBooleanExtra(EXTRA_LOOP, false)
        videoView?.start()
      }
      videoView?.setOnCompletionListener {
        finish()
      }
      videoView?.setOnErrorListener { _, _, _ ->
        finish()
        true
      }
    } ?: run {
      finish()
    }
  }

  override fun onDestroy() {
    videoView?.stopPlayback()
    requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    super.onDestroy()
  }

}
