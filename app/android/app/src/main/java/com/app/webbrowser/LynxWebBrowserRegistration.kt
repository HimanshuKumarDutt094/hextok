// LynxWebBrowserRegistration.kt
// Registration code for LynxJS WebBrowser native module and custom element

package com.app.webbrowser

import com.app.webbrowser.modules.LynxWebBrowserModule
import com.app.webbrowser.elements.LynxWebView
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.Behavior
import com.lynx.tasm.LynxEnv

/**
 * Registration helper for LynxJS WebBrowser functionality
 * 
 * This class provides methods to register both the native module and custom element
 * with the LynxJS runtime. Call these methods during application initialization.
 */
object LynxWebBrowserRegistration {
    
    /**
     * Register the WebBrowser native module globally
     * Call this method in your Application class or MainActivity
     */
    fun registerWebBrowserModule() {
        LynxEnv.inst().registerModule("LynxWebBrowserModule", LynxWebBrowserModule::class.java)
    }
    
    /**
     * Register the WebView custom element globally
     * Call this method in your Application class or MainActivity
     */
    fun registerWebViewElement() {
        LynxEnv.inst().addBehavior(object : Behavior("web-view") {
            override fun createUI(context: LynxContext): LynxWebView {
                return LynxWebView(context)
            }
        })
    }
    
    /**
     * Register both module and element in one call
     * Convenience method for complete setup
     */
    fun registerAll() {
        registerWebBrowserModule()
        registerWebViewElement()
    }
    
    /**
     * Register with a specific LynxView instance (local registration)
     * Use this if you want to register only for specific LynxView instances
     * 
     * @param lynxViewBuilder The LynxViewBuilder instance to register with
     */
    fun registerForLynxView(lynxViewBuilder: com.lynx.tasm.LynxViewBuilder) {
        // Register custom element behavior
        lynxViewBuilder.addBehavior(object : Behavior("web-view") {
            override fun createUI(context: LynxContext): LynxWebView {
                return LynxWebView(context)
            }
        })
        
        // Note: Native modules are typically registered globally, not per LynxView
        // If needed, you can add module registration here as well
    }
}

/**
 * Extension function for easy registration in MainActivity
 */
fun android.app.Activity.registerLynxWebBrowser() {
    LynxWebBrowserRegistration.registerAll()
}

/**
 * Example usage in MainActivity.kt:
 * 
 * class MainActivity : AppCompatActivity() {
 *     override fun onCreate(savedInstanceState: Bundle?) {
 *         super.onCreate(savedInstanceState)
 *         
 *         // Register LynxJS WebBrowser functionality
 *         registerLynxWebBrowser()
 *         
 *         // ... rest of your activity setup
 *     }
 * }
 */