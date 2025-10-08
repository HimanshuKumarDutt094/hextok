package com.hextok

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.hextok.custom.LynxButton
import com.hextok.providers.GenericResourceFetcher
import com.hextok.providers.TemplateProvider
import com.lynx.tasm.LynxBooleanOption
import com.lynx.tasm.LynxView
import com.lynx.tasm.LynxViewBuilder
import com.lynx.tasm.behavior.Behavior
import com.lynx.tasm.behavior.LynxContext
import com.lynx.xelement.XElementBehaviors
import java.net.NetworkInterface
import java.net.InetAddress

class MainActivity : Activity() {
    private lateinit var lynxView: LynxView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        var uri = ""
        uri = if (BuildConfig.DEBUG == true) {
            val devServerHost = getDevServerHost()
            "http://$devServerHost:3000/main.lynx.bundle?fullscreen=true"
        } else {
            "main.lynx.bundle"
        }

        lynxView = buildLynxView()
        setContentView(lynxView)

        lynxView.renderTemplateUrl(uri, "")
        
        // Handle deep link if this activity was launched by one
        handleDeepLink(intent)
        
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        // Handle deep link when app is already running
        intent?.let { handleDeepLink(it) }
    }

    private fun handleDeepLink(intent: Intent) {
        val data: Uri? = intent.data
        if (data != null && data.scheme == "hextok") {
            Log.d("MainActivity", "Deep link received: $data")
            // Store deep link data for JavaScript to retrieve
            try {
                com.hextok.deeplink.DeepLinkModule.storeDeepLink(data)
                Log.d("MainActivity", "Deep link stored successfully")
            } catch (e: Exception) {
                Log.e("MainActivity", "Failed to store deep link", e)
            }
        }
    }
    
    private fun getDevServerHost(): String {
        return try {
            // First, check if a build-time dev server host was provided
            if (BuildConfig.DEV_SERVER_HOST.isNotEmpty()) {
                Log.d("MainActivity", "Using build-time configured dev server host: ${BuildConfig.DEV_SERVER_HOST}")
                return BuildConfig.DEV_SERVER_HOST
            }
            
            when {
                isRunningOnEmulator() -> {
                    Log.d("MainActivity", "Running on emulator, using 10.0.2.2")
                    "10.0.2.2"
                }
                else -> {
                    val hostIp = getHostMachineIP()
                    Log.d("MainActivity", "Running on physical device, detected host IP: $hostIp")
                    hostIp ?: "192.168.1.100" // fallback IP
                }
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error detecting dev server host", e)
            "10.0.2.2" // fallback to emulator default
        }
    }

    private fun isRunningOnEmulator(): Boolean {
        return (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
                Build.FINGERPRINT.startsWith("generic") ||
                Build.FINGERPRINT.startsWith("unknown") ||
                Build.HARDWARE.contains("goldfish") ||
                Build.HARDWARE.contains("ranchu") ||
                Build.MODEL.contains("google_sdk") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK built for x86") ||
                Build.MANUFACTURER.contains("Genymotion") ||
                Build.PRODUCT.contains("sdk_google") ||
                Build.PRODUCT.contains("google_sdk") ||
                Build.PRODUCT.contains("sdk") ||
                Build.PRODUCT.contains("sdk_x86") ||
                Build.PRODUCT.contains("vbox86p") ||
                Build.PRODUCT.contains("emulator") ||
                Build.PRODUCT.contains("simulator")
    }

    private fun getHostMachineIP(): String? {
        return try {
            // Try to get the gateway IP by reading system files
            val gatewayIP = getGatewayIP()
            if (gatewayIP != null) {
                Log.d("MainActivity", "Found gateway IP: $gatewayIP")
                return gatewayIP
            }
            
            // Fallback: try to detect host IP from network interfaces
            val interfaces = NetworkInterface.getNetworkInterfaces()
            for (networkInterface in interfaces) {
                if (networkInterface.isLoopback || !networkInterface.isUp) continue
                
                val addresses = networkInterface.inetAddresses
                for (address in addresses) {
                    if (!address.isLoopbackAddress && 
                        address is InetAddress && 
                        address.hostAddress?.contains(":") == false) {
                        
                        val ip = address.hostAddress
                        // Check if it's a private network IP range
                        if (ip?.startsWith("192.168.") == true || 
                            ip?.startsWith("10.") == true || 
                            ip?.startsWith("172.") == true) {
                            
                            // Try to guess the host machine IP (usually gateway + 1 or similar pattern)
                            val hostIP = generatePossibleHostIPs(ip).firstOrNull()
                            Log.d("MainActivity", "Generated possible host IP: $hostIP from device IP: $ip")
                            return hostIP ?: ip.replaceAfterLast(".", "1") // fallback to .1
                        }
                    }
                }
            }
            null
        } catch (e: Exception) {
            Log.e("MainActivity", "Error getting host machine IP", e)
            null
        }
    }

    private fun getGatewayIP(): String? {
        return try {
            val process = Runtime.getRuntime().exec("ip route show default")
            val reader = process.inputStream.bufferedReader()
            val output = reader.readText()
            process.waitFor()
            
            // Parse output like: "default via 192.168.0.1 dev wlan0 proto dhcp metric 600"
            val regex = "default via ([0-9.]+)".toRegex()
            val matchResult = regex.find(output)
            matchResult?.groupValues?.get(1)
        } catch (e: Exception) {
            Log.e("MainActivity", "Error getting gateway IP", e)
            null
        }
    }

    private fun generatePossibleHostIPs(deviceIP: String): List<String> {
        val parts = deviceIP.split(".")
        if (parts.size != 4) return emptyList()
        
        val baseIP = "${parts[0]}.${parts[1]}.${parts[2]}"
        
        // Common host machine IPs in development
        return listOf(
            "$baseIP.1",   // Common gateway/router IP
            "$baseIP.100", // Common development machine IP
            "$baseIP.101", // Alternative development machine IP
            "$baseIP.2",   // Alternative gateway IP
            "$baseIP.254"  // Another common gateway IP
        )
    }
    
    private fun buildLynxView(): LynxView {
        val viewBuilder: LynxViewBuilder = LynxViewBuilder()
        viewBuilder.addBehaviors(XElementBehaviors().create())

        // Register custom button element
        viewBuilder.addBehavior(object : Behavior("button") {
            override fun createUI(context: LynxContext): LynxButton {
                return LynxButton(context)
            }
        })

        viewBuilder.setTemplateProvider(TemplateProvider(this))
        viewBuilder.isEnableGenericResourceFetcher = LynxBooleanOption.TRUE
        viewBuilder.setGenericResourceFetcher(GenericResourceFetcher())

        return viewBuilder.build(this)
    }
}