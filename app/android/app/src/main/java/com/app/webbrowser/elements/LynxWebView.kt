// LynxWebView.kt  
// Custom Element for LynxJS providing embedded WebView functionality
// Based on Android WebView with Custom Tabs integration

package com.app.webbrowser.elements

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
    private var customTabsOptions: MutableMap<String, Any> = mutableMapOf()
    
    override fun createView(context: Context): WebView {
        return WebView(context).apply {
            // Configure WebView settings
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                loadWithOverviewMode = true
                useWideViewPort = true
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                allowFileAccess = false
                allowContentAccess = false
                allowFileAccessFromFileURLs = false
                allowUniversalAccessFromFileURLs = false
                
                // Security settings
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            }
            
            // Set WebView client
            webViewClient = LynxWebViewClient()
            webChromeClient = LynxWebChromeClient()
        }
    }
    
    override fun onLayoutUpdated() {
        super.onLayoutUpdated()
        // Apply any custom layout adjustments if needed
        // For WebView, we typically don't need special layout handling
        // but this ensures the element follows LynxJS layout patterns
    }
    
    // Property handlers
    @LynxProp(name = "src")
    fun setSrc(url: String) {
        if (url != currentUrl) {
            currentUrl = url
            loadUrl(url)
        }
    }
    
    @LynxProp(name = "url") 
    fun setUrl(url: String) {
        setSrc(url) // Alias for src
    }
    
    @LynxProp(name = "redirectUrl")
    fun setRedirectUrl(url: String) {
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
    fun setToolbarColor(color: String) {
        customTabsOptions["toolbarColor"] = color
    }
    
    @LynxProp(name = "toolbar-color")
    fun setToolbarColorHyphen(color: String) {
        setToolbarColor(color)
    }
    
    @LynxProp(name = "controlsColor")
    fun setControlsColor(color: String) {
        customTabsOptions["controlsColor"] = color
    }
    
    @LynxProp(name = "controls-color")
    fun setControlsColorHyphen(color: String) {
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
        val url = params.getString("url") ?: currentUrl
        if (url != null) {
            openUrlInCustomTabs(url)
            callback.invoke(LynxUIMethodConstants.SUCCESS)
        } else {
            callback.invoke(LynxUIMethodConstants.UNKNOWN, "No URL to open")
        }
    }
    
    @LynxUIMethod
    fun getCurrentUrl(params: ReadableMap, callback: Callback) {
        callback.invoke(LynxUIMethodConstants.SUCCESS, mView.url ?: "")
    }
    
    @LynxUIMethod
    fun getTitle(params: ReadableMap, callback: Callback) {
        callback.invoke(LynxUIMethodConstants.SUCCESS, mView.title ?: "")
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
            customTabsOptions["toolbarColor"]?.let { color ->
                try {
                    builder.setToolbarColor(Color.parseColor(color.toString()))
                } catch (e: Exception) {
                    // Invalid color, ignore
                }
            }
            
            customTabsOptions["showTitle"]?.let { show ->
                if (show as? Boolean == true) {
                    builder.setShowTitle(true)
                }
            }
            
            val customTabsIntent = builder.build()
            customTabsIntent.launchUrl(lynxContext.context, Uri.parse(url))
            
            // Emit navigation event
            emitEvent("navigation", mapOf(
                "url" to url,
                "navigationType" to "linkClicked"
            ))
            
        } catch (e: Exception) {
            // Fallback to WebView
            mView.loadUrl(url)
        }
    }
    
    private fun emitEvent(name: String, detail: Map<String, Any>) {
        val event = LynxCustomEvent(sign, name)
        detail.forEach { (key, value) ->
            event.addDetail(key, value)
        }
        lynxContext.eventEmitter.sendCustomEvent(event)
    }
    
    // Custom WebView client
    private inner class LynxWebViewClient : WebViewClient() {
        
        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
            super.onPageStarted(view, url, favicon)
            
            if (url != null) {
                emitEvent("load", mapOf(
                    "url" to url,
                    "title" to (view?.title ?: ""),
                    "canGoBack" to (view?.canGoBack() ?: false),
                    "canGoForward" to (view?.canGoForward() ?: false)
                ))
            }
        }
        
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            
            if (url != null) {
                emitEvent("load", mapOf(
                    "url" to url,
                    "title" to (view?.title ?: ""),
                    "canGoBack" to (view?.canGoBack() ?: false),
                    "canGoForward" to (view?.canGoForward() ?: false)
                ))
            }
        }
        
        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                emitEvent("error", mapOf(
                    "url" to (request?.url?.toString() ?: ""),
                    "code" to (error?.errorCode ?: -1),
                    "description" to (error?.description?.toString() ?: "Unknown error")
                ))
            }
        }
        
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            val url = request?.url?.toString()
            
            if (url != null) {
                // Check if this is a redirect URL match
                if (redirectUrl != null && url.startsWith(redirectUrl!!)) {
                    emitEvent("redirect", mapOf(
                        "url" to url,
                        "type" to "success"
                    ))
                    return true // Prevent loading in WebView
                }
                
                // Emit navigation event
                emitEvent("navigation", mapOf(
                    "url" to url,
                    "navigationType" to "linkClicked"
                ))
                
                // If using custom tabs for navigation, handle externally
                if (useCustomTabs) {
                    openUrlInCustomTabs(url)
                    return true
                }
            }
            
            return super.shouldOverrideUrlLoading(view, request)
        }
        
        @Deprecated("Deprecated in API level 24")
        override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
            if (url != null) {
                // Check if this is a redirect URL match  
                if (redirectUrl != null && url.startsWith(redirectUrl!!)) {
                    emitEvent("redirect", mapOf(
                        "url" to url,
                        "type" to "success"
                    ))
                    return true
                }
                
                emitEvent("navigation", mapOf(
                    "url" to url,
                    "navigationType" to "linkClicked"
                ))
                
                if (useCustomTabs) {
                    openUrlInCustomTabs(url)
                    return true
                }
            }
            
            return super.shouldOverrideUrlLoading(view, url)
        }
    }
    
    // Custom WebChrome client for additional features
    private inner class LynxWebChromeClient : WebChromeClient() {
        
        override fun onReceivedTitle(view: WebView?, title: String?) {
            super.onReceivedTitle(view, title)
            
            if (title != null && view != null) {
                emitEvent("load", mapOf(
                    "url" to (view.url ?: ""),
                    "title" to title,
                    "canGoBack" to view.canGoBack(),
                    "canGoForward" to view.canGoForward()
                ))
            }
        }
        
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            
            // Could emit progress events if needed
            // emitEvent("progress", mapOf("progress" to newProgress))
        }
    }
}