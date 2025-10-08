// LynxWebView.kt  
// Custom Element for LynxJS providing embedded WebView functionality (Java 11)
// Based on Android WebView with Custom Tabs integration

package com.hextok.webbrowser.elements

import android.content.Context
import android.graphics.Color
import android.net.Uri
import android.webkit.*
import androidx.browser.customtabs.CustomTabsIntent
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.event.LynxCustomEvent
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap

class LynxWebView(context: LynxContext) : LynxUI<WebView>(context) {

    private var currentUrl: String? = null
    private var redirectUrl: String? = null
    private var useCustomTabs: Boolean = false
    private val customTabsOptions: MutableMap<String, Any> = HashMap()
    
    override fun createView(context: Context): WebView {
        val view = WebView(context)
        
        // Configure WebView settings
        val settings = view.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.allowFileAccessFromFileURLs = false
        settings.allowUniversalAccessFromFileURLs = false
        
        // Security settings
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }
        
        // Set WebView client
        view.webViewClient = LynxWebViewClient()
        view.webChromeClient = LynxWebChromeClient()

        // Prevent parent containers (like scroll-view) from intercepting touch
        // events when user interacts with the WebView (scroll or pinch-to-zoom).
        view.setOnTouchListener { v, event ->
            var mDownX = 0f
            var mDownY = 0f
            when (event.actionMasked) {
                android.view.MotionEvent.ACTION_DOWN -> {
                    mDownX = event.x
                    mDownY = event.y
                    // Tell parent not to intercept so we can handle scrolls inside WebView
                    v.parent.requestDisallowInterceptTouchEvent(true)
                }
                android.view.MotionEvent.ACTION_MOVE -> {
                    // While moving, keep disallowing parent intercept
                    v.parent.requestDisallowInterceptTouchEvent(true)
                }
                android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL -> {
                    // Let parent resume intercepting once interaction finishes
                    v.parent.requestDisallowInterceptTouchEvent(false)
                }
            }
            // Let WebView handle the touch as usual
            false
        }
        
        return view
    }
    
    override fun onLayoutUpdated() {
        super.onLayoutUpdated()
        // Apply any custom layout adjustments if needed
        // For WebView, we typically don't need special layout handling
        // but this ensures the element follows LynxJS layout patterns
    }
    
    // Property handlers
    @LynxProp(name = "src")
    fun setSrc(url: String?) {
        if (url != null && url != currentUrl) {
            currentUrl = url
            loadUrl(url)
        }
    }
    
    @LynxProp(name = "url") 
    fun setUrl(url: String?) {
        setSrc(url) // Alias for src
    }
    
    @LynxProp(name = "redirectUrl")
    fun setRedirectUrl(url: String?) {
        redirectUrl = url
    }
    
    @LynxProp(name = "useCustomTabs")
    fun setUseCustomTabs(enabled: Boolean) {
        useCustomTabs = enabled
    }
    
    @LynxProp(name = "use-custom-tabs")
    fun setUseCustomTabsHyphen(enabled: Boolean) {
        setUseCustomTabs(enabled)
    }
    
    @LynxProp(name = "toolbarColor")
    fun setToolbarColor(color: String?) {
        if (color != null) {
            customTabsOptions["toolbarColor"] = color
        }
    }
    
    @LynxProp(name = "toolbar-color")
    fun setToolbarColorHyphen(color: String?) {
        setToolbarColor(color)
    }
    
    @LynxProp(name = "controlsColor")
    fun setControlsColor(color: String?) {
        if (color != null) {
            customTabsOptions["controlsColor"] = color
        }
    }
    
    @LynxProp(name = "controls-color")
    fun setControlsColorHyphen(color: String?) {
        setControlsColor(color)
    }
    
    @LynxProp(name = "showTitle")
    fun setShowTitle(show: Boolean) {
        customTabsOptions["showTitle"] = show
    }
    
    @LynxProp(name = "show-title")
    fun setShowTitleHyphen(show: Boolean) {
        setShowTitle(show)
    }
    
    @LynxProp(name = "enableBarCollapsing")
    fun setEnableBarCollapsing(enabled: Boolean) {
        customTabsOptions["enableBarCollapsing"] = enabled
    }
    
    @LynxProp(name = "enable-bar-collapsing")
    fun setEnableBarCollapsingHyphen(enabled: Boolean) {
        setEnableBarCollapsing(enabled)
    }
    
    @LynxProp(name = "enable-zoom") 
    fun setEnableZoom(enabled: Boolean) {
        mView.settings.setSupportZoom(enabled)
        mView.settings.builtInZoomControls = enabled
        mView.settings.displayZoomControls = false // Keep controls hidden but enable zoom
    }
    
    @LynxProp(name = "javascript-enabled")
    fun setJavaScriptEnabled(enabled: Boolean) {
        mView.settings.javaScriptEnabled = enabled
    }
    
    // Imperative methods
    @LynxUIMethod
    fun loadUrl(params: ReadableMap, callback: Callback) {
        val url = params.getString("url")
        if (url != null) {
            loadUrl(url)
            callback.invoke(LynxUIMethodConstants.SUCCESS)
        } else {
            callback.invoke(LynxUIMethodConstants.UNKNOWN, "URL is required")
        }
    }
    
    @LynxUIMethod
    fun reload(params: ReadableMap, callback: Callback) {
        mView.reload()
        callback.invoke(LynxUIMethodConstants.SUCCESS)
    }
    
    @LynxUIMethod
    fun goBack(params: ReadableMap, callback: Callback) {
        if (mView.canGoBack()) {
            mView.goBack()
            callback.invoke(LynxUIMethodConstants.SUCCESS)
        } else {
            callback.invoke(LynxUIMethodConstants.UNKNOWN, "Cannot go back")
        }
    }
    
    @LynxUIMethod
    fun goForward(params: ReadableMap, callback: Callback) {
        if (mView.canGoForward()) {
            mView.goForward()
            callback.invoke(LynxUIMethodConstants.SUCCESS)
        } else {
            callback.invoke(LynxUIMethodConstants.UNKNOWN, "Cannot go forward")
        }
    }
    
    @LynxUIMethod
    fun openInCustomTabs(params: ReadableMap, callback: Callback) {
        val url = if (params.hasKey("url")) params.getString("url") else currentUrl
        if (url != null) {
            openUrlInCustomTabs(url)
            callback.invoke(LynxUIMethodConstants.SUCCESS)
        } else {
            callback.invoke(LynxUIMethodConstants.UNKNOWN, "No URL to open")
        }
    }
    
    @LynxUIMethod
    fun getCurrentUrl(params: ReadableMap, callback: Callback) {
        val url = mView.url
        callback.invoke(LynxUIMethodConstants.SUCCESS, url ?: "")
    }
    
    @LynxUIMethod
    fun getTitle(params: ReadableMap, callback: Callback) {
        val title = mView.title
        callback.invoke(LynxUIMethodConstants.SUCCESS, title ?: "")
    }
    
    @LynxUIMethod
    fun canGoBack(params: ReadableMap, callback: Callback) {
        callback.invoke(LynxUIMethodConstants.SUCCESS, mView.canGoBack())
    }
    
    @LynxUIMethod
    fun canGoForward(params: ReadableMap, callback: Callback) {
        callback.invoke(LynxUIMethodConstants.SUCCESS, mView.canGoForward())
    }
    
    // Helper methods
    private fun loadUrl(url: String) {
        if (useCustomTabs) {
            openUrlInCustomTabs(url)
        } else {
            mView.loadUrl(url)
        }
    }
    
    private fun openUrlInCustomTabs(url: String) {
        try {
            val builder = CustomTabsIntent.Builder()
            
            // Apply custom tabs options
            val toolbarColor = customTabsOptions["toolbarColor"]
            if (toolbarColor != null) {
                try {
                    builder.setToolbarColor(Color.parseColor(toolbarColor.toString()))
                } catch (e: Exception) {
                    // Invalid color, ignore
                }
            }
            
            val showTitle = customTabsOptions["showTitle"]
            if (showTitle is Boolean && showTitle) {
                builder.setShowTitle(true)
            }
            
            val customTabsIntent = builder.build()
            customTabsIntent.launchUrl(lynxContext.context, Uri.parse(url))
            
            // Emit navigation event
            val eventDetail = HashMap<String, Any>()
            eventDetail["url"] = url
            eventDetail["navigationType"] = "linkClicked"
            emitEvent("navigation", eventDetail)
            
        } catch (e: Exception) {
            // Fallback to WebView
            mView.loadUrl(url)
        }
    }
    
    private fun emitEvent(name: String, detail: Map<String, Any>?) {
        val event = LynxCustomEvent(sign, name)
        if (detail != null) {
            for ((key, value) in detail) {
                event.addDetail(key, value)
            }
        }
        lynxContext.eventEmitter.sendCustomEvent(event)
    }
    
    // Custom WebView client
    private inner class LynxWebViewClient : WebViewClient() {
        
        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
            super.onPageStarted(view, url, favicon)
            
            if (url != null) {
                val eventDetail = HashMap<String, Any>()
                eventDetail["url"] = url
                eventDetail["title"] = view?.title ?: ""
                eventDetail["canGoBack"] = view?.canGoBack() ?: false
                eventDetail["canGoForward"] = view?.canGoForward() ?: false
                emitEvent("load", eventDetail)
            }
        }
        
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            
            if (url != null) {
                val eventDetail = HashMap<String, Any>()
                eventDetail["url"] = url
                eventDetail["title"] = view?.title ?: ""
                eventDetail["canGoBack"] = view?.canGoBack() ?: false
                eventDetail["canGoForward"] = view?.canGoForward() ?: false
                emitEvent("load", eventDetail)
            }
        }
        
        override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
            super.onReceivedError(view, request, error)
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                val eventDetail = HashMap<String, Any>()
                eventDetail["url"] = request?.url?.toString() ?: ""
                eventDetail["code"] = error?.errorCode ?: -1
                eventDetail["description"] = error?.description?.toString() ?: ""
                emitEvent("error", eventDetail)
            }
        }
        
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                val url = request?.url?.toString()
                return handleUrlLoading(url)
            }
            return super.shouldOverrideUrlLoading(view, request)
        }
        
        override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
            return handleUrlLoading(url)
        }
        
        private fun handleUrlLoading(url: String?): Boolean {
            if (url != null) {
                // Check if this is a redirect URL match
                if (redirectUrl != null && url.startsWith(redirectUrl!!)) {
                    val eventDetail = HashMap<String, Any>()
                    eventDetail["url"] = url
                    eventDetail["type"] = "success"
                    emitEvent("redirect", eventDetail)
                    return true // Prevent loading in WebView
                }
                
                // Emit navigation event
                val eventDetail = HashMap<String, Any>()
                eventDetail["url"] = url
                eventDetail["navigationType"] = "linkClicked"
                emitEvent("navigation", eventDetail)
                
                // If using custom tabs for navigation, handle externally
                if (useCustomTabs) {
                    openUrlInCustomTabs(url)
                    return true
                }
            }
            
            return false
        }
    }
    
    // Custom WebChrome client for additional features
    private inner class LynxWebChromeClient : WebChromeClient() {
        
        override fun onReceivedTitle(view: WebView?, title: String?) {
            super.onReceivedTitle(view, title)
            
            if (title != null) {
                val eventDetail = HashMap<String, Any>()
                eventDetail["url"] = view?.url ?: ""
                eventDetail["title"] = title
                eventDetail["canGoBack"] = view?.canGoBack() ?: false
                eventDetail["canGoForward"] = view?.canGoForward() ?: false
                emitEvent("load", eventDetail)
            }
        }
        
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            
            // Could emit progress events if needed
            // val eventDetail = HashMap<String, Any>()
            // eventDetail["progress"] = newProgress
            // emitEvent("progress", eventDetail)
        }
    }
}