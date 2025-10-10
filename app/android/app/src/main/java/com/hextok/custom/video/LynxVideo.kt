package com.hextok.custom.video

import android.content.Context
import android.net.Uri
import android.widget.VideoView
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.ui.LynxUI

class LynxVideo(context: LynxContext) : LynxUI<VideoView>(context) {


  override fun createView(context: Context): VideoView {
    return VideoView(context)
  }

  @LynxProp(name = "src")
  fun setSrc(src: String) {
          mView.setVideoURI(Uri.parse(src))
          mView.start()

  }
}