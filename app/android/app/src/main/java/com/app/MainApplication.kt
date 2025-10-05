package com.app

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
import com.lynx.service.image.LynxImageService
import com.lynx.service.log.LynxLogService
import com.lynx.tasm.LynxEnv
import com.lynx.tasm.service.LynxServiceCenter
import com.lynx.service.http.LynxHttpService
import com.app.webbrowser.LynxWebBrowserRegistration

class MainApplication : Application() {
    
    // Activity tracking for browser state management
    private val runningActivities = ArrayList<Class<*>>()
    
    // Activity lifecycle callbacks for tracking active activities
    private val lifecycleCallbacks = object : ActivityLifecycleCallbacks {
        override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
            if (!runningActivities.contains(activity::class.java)) {
                runningActivities.add(activity::class.java)
            }
        }
        
        override fun onActivityStarted(activity: Activity) = Unit
        override fun onActivityResumed(activity: Activity) = Unit
        override fun onActivityPaused(activity: Activity) = Unit
        override fun onActivityStopped(activity: Activity) = Unit
        override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
        
        override fun onActivityDestroyed(activity: Activity) {
            if (runningActivities.contains(activity::class.java)) {
                runningActivities.remove(activity::class.java)
            }
        }
    }
    
    /**
     * Check if a specific activity class is currently in the back stack
     */
    fun isActivityInBackStack(cls: Class<*>?): Boolean {
        return runningActivities.contains(cls)
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // Register activity lifecycle callbacks for browser state tracking
        registerActivityLifecycleCallbacks(lifecycleCallbacks)
        
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
                    DebugActivity::class.java
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                intent.putExtra("url", url)
                startActivity(intent)
            }
        }
        // Register our NativeAuthModule so Lynx frontend can call openAuth / cancelAuth
        try {
            LynxEnv.inst().registerModule("NativeAuthModule", com.app.nativeauth.NativeAuthModule::class.java)
        } catch (e: Exception) {
            // registration failure should not crash the app; log if needed
        }
        // Register SecureStorage native module
        try {
            LynxEnv.inst().registerModule("SecureStorage", com.app.securestorage.SecureStorageModule::class.java)
        } catch (e: Exception) {
            // registration failure should not crash the app; log if needed
        }
        // Register FilePicker native module
        try {
            LynxEnv.inst().registerModule("FilePicker", com.app.filepicker.FilePickerModule::class.java)
        } catch (e: Exception) {
            // ignore
        }
        // Register FilePermission native module
        try {
            LynxEnv.inst().registerModule("FilePermission", com.app.filepicker.FilePermissionModule::class.java)
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
                override fun createUI(context: com.lynx.tasm.behavior.LynxContext) = com.app.custom.LynxExplorerInput(context)
            })
        } catch (e: Exception) { }

        try {
            LynxEnv.inst().addBehavior(object : com.lynx.tasm.behavior.Behavior("media-player") {
                override fun createUI(context: com.lynx.tasm.behavior.LynxContext) = com.app.custom.LynxMediaPlayer(context)
            })
        } catch (e: Exception) { }

        try {
            LynxEnv.inst().addBehavior(object : com.lynx.tasm.behavior.Behavior("chart-view") {
                override fun createUI(context: com.lynx.tasm.behavior.LynxContext) = com.app.custom.LynxChartView(context)
            })
        } catch (e: Exception) { }
    }
    
    override fun onTerminate() {
        super.onTerminate()
        unregisterActivityLifecycleCallbacks(lifecycleCallbacks)
    }
}
