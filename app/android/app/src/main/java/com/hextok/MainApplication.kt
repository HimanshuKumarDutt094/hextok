package com.hextok

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.core.ImagePipelineConfig
import com.facebook.imagepipeline.memory.PoolConfig
import com.facebook.imagepipeline.memory.PoolFactory
import com.lynx.devtoolwrapper.LynxDevtoolGlobalHelper
import com.lynx.service.devtool.LynxDevToolService
import com.lynx.service.image.LynxImageService
import com.lynx.service.log.LynxLogService
import com.lynx.tasm.LynxEnv
import com.lynx.tasm.service.LynxServiceCenter
import com.lynx.service.http.LynxHttpService
import com.hextok.webbrowser.LynxWebBrowserRegistration

class MainApplication : Application() {
    
    // Activity tracking for browser state management
    private val runningActivities = ArrayList<Class<*>>()
    
    // Activity lifecycle callbacks for tracking active activities

    /**
     * Check if a specific activity class is currently in the back stack
     */
    fun isActivityInBackStack(cls: Class<*>?): Boolean {
        return runningActivities.contains(cls)
    }
    
    override fun onCreate() {
        super.onCreate()
        initLynxService()
        initLynxEnv()
    }

    private fun initLynxService() {
        val factory = PoolFactory(PoolConfig.newBuilder().build())
        val builder =
            ImagePipelineConfig.newBuilder(applicationContext).setPoolFactory(factory)
        Fresco.initialize(applicationContext, builder.build())

        LynxServiceCenter.inst().registerService(LynxImageService.getInstance())
        LynxServiceCenter.inst().registerService(LynxLogService)
        LynxServiceCenter.inst().registerService(LynxHttpService)
        LynxServiceCenter.inst().registerService(LynxDevToolService.INSTANCE)
    }

    private fun initLynxEnv() {
        LynxEnv.inst().init(
            this,
            null,
            null,
            null
        )
        // Turn on Lynx Debug
        LynxEnv.inst().enableLynxDebug(true)
        // Turn on Lynx DevTool
        LynxEnv.inst().enableDevtool(true)
        // Turn on Lynx LogBox
        LynxEnv.inst().enableLogBox(true)
        // Create a Handler associated with the main thread's Looper
        val mainHandler = Handler(Looper.getMainLooper())
        // Register OpenCard for Lynx DevTool
        LynxDevtoolGlobalHelper.getInstance().registerCardListener { url ->
            mainHandler.post {
                val intent = Intent(
                    applicationContext,
                    com.hextok.DebugActivity::class.java
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                intent.putExtra("url", url)
                startActivity(intent)
            }
        }
        // Register our NativeAuthModule so Lynx frontend can call openAuth / cancelAuth
        try {
            LynxEnv.inst().registerModule("NativeAuthModule", com.hextok.nativeauth.NativeAuthModule::class.java)
        } catch (e: Exception) {
            // registration failure should not crash the app; log if needed
        }
        // Register SecureStorage native module
        try {
            LynxEnv.inst().registerModule("SecureStorage", com.hextok.securestorage.SecureStorageModule::class.java)
        } catch (e: Exception) {
            // registration failure should not crash the app; log if needed
        }
        // Register FilePicker native module
        try {
            LynxEnv.inst().registerModule("FilePicker", com.hextok.filepicker.FilePickerModule::class.java)
        } catch (e: Exception) {
            // ignore
        }
        // Register FilePermission native module
        try {
            LynxEnv.inst().registerModule("FilePermission", com.hextok.filepicker.FilePermissionModule::class.java)
        } catch (e: Exception) {
            // ignore
        }
      
        // Register DeepLink native module so JS can register callbacks
        try {
            android.util.Log.d("MainApplication", "Attempting to register DeepLinkModule...")
            LynxEnv.inst().registerModule("DeepLinkModule", com.hextok.deeplink.DeepLinkModule::class.java)
            android.util.Log.d("MainApplication", "DeepLinkModule registered successfully!")
        } catch (e: Exception) {
            android.util.Log.e("MainApplication", "Failed to register DeepLinkModule", e)
        }
        // Register Local Storage module for persistent storage
        try {
            LynxEnv.inst().registerModule("LocalStorageModule", com.hextok.localstorage.LocalStorageModule::class.java)
        } catch (e: Exception) {
            // ignore
        }
        // Register WebBrowser native module and custom element
        try {
            LynxWebBrowserRegistration.registerAll()
        } catch (e: Exception) {
            // ignore
        }
        // Register custom elements (behaviors)
        try {
            LynxEnv.inst().addBehavior(object : com.lynx.tasm.behavior.Behavior("explorer-input") {
                override fun createUI(context: com.lynx.tasm.behavior.LynxContext) = com.hextok.custom.LynxExplorerInput(context)
            })
        } catch (e: Exception) { }

        try {
            LynxEnv.inst().addBehavior(object : com.lynx.tasm.behavior.Behavior("media-player") {
                override fun createUI(context: com.lynx.tasm.behavior.LynxContext) = com.hextok.custom.LynxMediaPlayer(context)
            })
        } catch (e: Exception) { }

        try {
            LynxEnv.inst().addBehavior(object : com.lynx.tasm.behavior.Behavior("chart-view") {
                override fun createUI(context: com.lynx.tasm.behavior.LynxContext) = com.hextok.custom.LynxChartView(context)
            })
        } catch (e: Exception) { }
        try {
            LynxEnv.inst().addBehavior(object : com.lynx.tasm.behavior.Behavior("button") {
                override fun createUI(context: com.lynx.tasm.behavior.LynxContext) = com.hextok.custom.LynxButton(context)
            })
        } catch (e: Exception) { }
        try {
		com.hextok.lynxlinking.LynxLinkingAdapter().init(this)
	} catch (e: Exception) {
		// handle or log
	}
    }
    
    override fun onTerminate() {
        super.onTerminate()
    }
}
