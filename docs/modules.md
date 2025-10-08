# LynxJS Native Modules Documentation

## Overview

Native Modules in LynxJS provide a bridge between JavaScript code and native platform functionality. They enable developers to access platform-specific APIs, reuse existing native code, and extend LynxJS capabilities beyond the built-in elements and APIs.

**Important**: Currently, native modules can only be used in Background Thread Scripting.

## Native Module Architecture

### Threading Model

Native modules operate within LynxJS's dual-threaded architecture:

- **Background Thread**: Where native modules are accessible and callable
- **Main Thread**: Where UI updates occur (modules cannot be directly called here)
- **Inter Thread Calls (ITC)**: Mechanism for cross-thread communication

### Module Registration

Native modules must be registered with the LynxJS runtime before they can be accessed from JavaScript.

## Creating Native Modules

### Step 1: Declare Typed Interface Specification

Create a TypeScript declaration file (`src/typing.d.ts`) in your LynxJS project:

```typescript
// src/typing.d.ts
declare let NativeModules: {
  // Local Storage Module Example
  NativeLocalStorageModule: {
    setStorageItem(key: string, value: string): void;
    getStorageItem(key: string, callback: (value: string) => void): void;
    clearStorage(): void;
  };

  // Network Module Example
  NetworkModule: {
    makeRequest(
      url: string,
      options: RequestOptions,
      callback: ResponseCallback
    ): void;
    uploadFile(
      filePath: string,
      endpoint: string,
      callback: UploadCallback
    ): void;
    downloadFile(
      url: string,
      destination: string,
      callback: DownloadCallback
    ): void;
  };

  // Device Info Module Example
  DeviceInfoModule: {
    getDeviceInfo(callback: (info: DeviceInfo) => void): void;
    getBatteryLevel(callback: (level: number) => void): void;
    getNetworkStatus(callback: (status: NetworkStatus) => void): void;
  };
};

// Type definitions
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface ResponseCallback {
  (
    error: Error | null,
    response?: {
      status: number;
      headers: Record<string, string>;
      body: string;
    }
  ): void;
}

interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer: string;
}
```

### Step 2: Implement JavaScript Usage

Use the native module in your application code:

```typescript
// src/App.tsx
import { useEffect, useState } from '@lynx-js/react';

export function App() {
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  // Storage operations
  const setStorage = () => {
    NativeModules.NativeLocalStorageModule.setStorageItem(
      'userPreference',
      'dark-mode'
    );
    getStorage();
  };

  const getStorage = () => {
    NativeModules.NativeLocalStorageModule.getStorageItem(
      'userPreference',
      (value) => {
        setStoredValue(value);
      }
    );
  };

  const clearStorage = () => {
    NativeModules.NativeLocalStorageModule.clearStorage();
    setStoredValue(null);
  };

  // Device info
  const fetchDeviceInfo = () => {
    NativeModules.DeviceInfoModule.getDeviceInfo((info) => {
      setDeviceInfo(info);
    });
  };

  // Network request
  const makeApiCall = () => {
    NativeModules.NetworkModule.makeRequest(
      'https://api.example.com/data',
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
      (error, response) => {
        if (error) {
          console.error('Request failed:', error);
        } else {
          console.log('Response:', response);
        }
      }
    );
  };

  useEffect(() => {
    getStorage();
    fetchDeviceInfo();
  }, []);

  return (
    <view style={{ padding: '20px' }}>
      <text>Stored Value: {storedValue || 'None'}</text>

      <view style={{ marginTop: '20px' }}>
        <view
          bindtap={setStorage}
          style={{ padding: '10px', backgroundColor: '#007AFF' }}
        >
          <text style={{ color: 'white' }}>Set Storage</text>
        </view>

        <view
          bindtap={clearStorage}
          style={{ padding: '10px', backgroundColor: '#FF3B30' }}
        >
          <text style={{ color: 'white' }}>Clear Storage</text>
        </view>

        <view
          bindtap={makeApiCall}
          style={{ padding: '10px', backgroundColor: '#34C759' }}
        >
          <text style={{ color: 'white' }}>Make API Call</text>
        </view>
      </view>

      {deviceInfo && (
        <view style={{ marginTop: '20px' }}>
          <text>
            Device: {deviceInfo.manufacturer} {deviceInfo.model}
          </text>
          <text>
            Platform: {deviceInfo.platform} {deviceInfo.version}
          </text>
        </view>
      )}
    </view>
  );
}
```

### Step 3: Android Implementation

#### Module Implementation

```kotlin
// android/lynx_explorer/src/main/java/com/lynx/explorer/modules/NativeLocalStorageModule.kt
package com.lynx.explorer.modules

import android.content.Context
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback

class NativeLocalStorageModule(context: Context) : LynxModule(context) {
  private val PREF_NAME = "LynxLocalStorage"

  private fun getContext(): Context {
    val lynxContext = mContext as LynxContext
    return lynxContext.getContext()
  }

  @LynxMethod
  fun setStorageItem(key: String, value: String) {
    val sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    val editor = sharedPreferences.edit()
    editor.putString(key, value)
    editor.apply()
  }

  @LynxMethod
  fun getStorageItem(key: String, callback: Callback) {
    val sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    val value = sharedPreferences.getString(key, null)
    callback.invoke(value)
  }

  @LynxMethod
  fun clearStorage() {
    val sharedPreferences = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    val editor = sharedPreferences.edit()
    editor.clear()
    editor.apply()
  }
}
```

#### Network Module Example

```kotlin
// NetworkModule.kt
package com.lynx.explorer.modules

import android.content.Context
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class NetworkModule(context: Context) : LynxModule(context) {
  private val client = OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

  @LynxMethod
  fun makeRequest(url: String, options: ReadableMap, callback: Callback) {
    val method = options.getString("method") ?: "GET"
    val headers = options.getMap("headers")
    val body = options.getString("body")
    val timeout = options.getInt("timeout")

    val requestBuilder = Request.Builder().url(url)

    // Add headers
    headers?.entryIterator?.forEach { entry ->
      requestBuilder.addHeader(entry.key, entry.value.toString())
    }

    // Add body for POST/PUT requests
    if (body != null && (method == "POST" || method == "PUT")) {
      val mediaType = "application/json".toMediaTypeOrNull()
      requestBuilder.method(method, body.toRequestBody(mediaType))
    } else {
      requestBuilder.method(method, null)
    }

    val request = requestBuilder.build()

    client.newCall(request).enqueue(object : okhttp3.Callback {
      override fun onFailure(call: Call, e: IOException) {
        callback.invoke(e.message, null)
      }

      override fun onResponse(call: Call, response: Response) {
        val responseMap = mapOf(
          "status" to response.code,
          "headers" to response.headers.toMultimap(),
          "body" to response.body?.string()
        )
        callback.invoke(null, responseMap)
      }
    })
  }

  @LynxMethod
  fun uploadFile(filePath: String, endpoint: String, callback: Callback) {
    // Implementation for file upload
    // Using multipart/form-data
  }

  @LynxMethod
  fun downloadFile(url: String, destination: String, callback: Callback) {
    // Implementation for file download
    // With progress tracking
  }
}
```

#### Device Info Module

```kotlin
// DeviceInfoModule.kt
package com.lynx.explorer.modules

import android.content.Context
import android.os.Build
import android.content.IntentFilter
import android.os.BatteryManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.react.bridge.Callback

class DeviceInfoModule(context: Context) : LynxModule(context) {

  @LynxMethod
  fun getDeviceInfo(callback: Callback) {
    val deviceInfo = mapOf(
      "platform" to "android",
      "version" to Build.VERSION.RELEASE,
      "model" to Build.MODEL,
      "manufacturer" to Build.MANUFACTURER,
      "brand" to Build.BRAND,
      "apiLevel" to Build.VERSION.SDK_INT,
      "device" to Build.DEVICE
    )
    callback.invoke(deviceInfo)
  }

  @LynxMethod
  fun getBatteryLevel(callback: Callback) {
    val batteryIntent = mContext.getContext().registerReceiver(
      null,
      IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    )

    val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
    val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1

    val batteryPercent = if (level != -1 && scale != -1) {
      (level * 100 / scale.toFloat()).toInt()
    } else {
      -1
    }

    callback.invoke(batteryPercent)
  }

  @LynxMethod
  fun getNetworkStatus(callback: Callback) {
    val connectivityManager = mContext.getContext()
      .getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    val network = connectivityManager.activeNetwork
    val capabilities = connectivityManager.getNetworkCapabilities(network)

    val networkInfo = mapOf(
      "isConnected" to (network != null),
      "type" to when {
        capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "wifi"
        capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "cellular"
        capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "ethernet"
        else -> "unknown"
      },
      "isMetered" to (connectivityManager.isActiveNetworkMetered)
    )

    callback.invoke(networkInfo)
  }
}
```

#### Module Registration

```java
// android/lynx_explorer/src/main/java/com/lynx/explorer/modules/LynxModuleAdapter.java
public class LynxModuleAdapter {
  public void Init(Context context) {
    // Register all native modules
    LynxEnv.inst().registerModule("NativeLocalStorageModule", NativeLocalStorageModule.class);
    LynxEnv.inst().registerModule("NetworkModule", NetworkModule.class);
    LynxEnv.inst().registerModule("DeviceInfoModule", DeviceInfoModule.class);

    // Register other modules...
  }
}
```

## iOS Implementation

### Module Interface

```swift
// iOS/LynxExplorer/Modules/NativeLocalStorageModule.swift
import Foundation

@objc(NativeLocalStorageModule)
class NativeLocalStorageModule: NSObject, LynxModule {

  @objc
  func setStorageItem(_ key: String, value: String) {
    UserDefaults.standard.set(value, forKey: key)
    UserDefaults.standard.synchronize()
  }

  @objc
  func getStorageItem(_ key: String, callback: @escaping LynxCallback) {
    let value = UserDefaults.standard.string(forKey: key)
    callback([value as Any])
  }

  @objc
  func clearStorage() {
    let defaults = UserDefaults.standard
    let dictionary = defaults.dictionaryRepresentation()
    dictionary.keys.forEach { key in
      defaults.removeObject(forKey: key)
    }
    defaults.synchronize()
  }
}
```

### Network Module (iOS)

```swift
// NetworkModule.swift
import Foundation

@objc(NetworkModule)
class NetworkModule: NSObject, LynxModule {

  @objc
  func makeRequest(_ url: String,
                   options: [String: Any],
                   callback: @escaping LynxCallback) {

    guard let requestUrl = URL(string: url) else {
      callback([["error": "Invalid URL"]])
      return
    }

    var request = URLRequest(url: requestUrl)

    // Set method
    if let method = options["method"] as? String {
      request.httpMethod = method
    }

    // Set headers
    if let headers = options["headers"] as? [String: String] {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }

    // Set body
    if let body = options["body"] as? String {
      request.httpBody = body.data(using: .utf8)
    }

    // Set timeout
    if let timeout = options["timeout"] as? TimeInterval {
      request.timeoutInterval = timeout
    }

    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
        callback([["error": error.localizedDescription]])
        return
      }

      guard let httpResponse = response as? HTTPURLResponse else {
        callback([["error": "Invalid response"]])
        return
      }

      let responseData: [String: Any] = [
        "status": httpResponse.statusCode,
        "headers": httpResponse.allHeaderFields,
        "body": data != nil ? String(data: data!, encoding: .utf8) ?? "" : ""
      ]

      callback([NSNull(), responseData])
    }.resume()
  }
}
```

### iOS Module Registration

```swift
// iOS/LynxExplorer/AppDelegate.swift
import Foundation

class AppDelegate: UIResponder, UIApplicationDelegate {

  func application(_ application: UIApplication,
                  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    // Register native modules
    LynxModuleRegistry.shared.register("NativeLocalStorageModule", NativeLocalStorageModule.self)
    LynxModuleRegistry.shared.register("NetworkModule", NetworkModule.self)
    LynxModuleRegistry.shared.register("DeviceInfoModule", DeviceInfoModule.self)

    return true
  }
}
```

## Advanced Module Patterns

### Async/Promise Support

```typescript
// Enhanced module interface with Promise support
declare let NativeModules: {
  AsyncStorageModule: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<Array<[string, string | null]>>;
    multiSet(keyValuePairs: Array<[string, string]>): Promise<void>;
  };
};

// Usage with async/await
async function handleStorage() {
  try {
    await NativeModules.AsyncStorageModule.setItem(
      'user',
      JSON.stringify(userData)
    );
    const user = await NativeModules.AsyncStorageModule.getItem('user');
    console.log('Retrieved user:', JSON.parse(user || '{}'));
  } catch (error) {
    console.error('Storage error:', error);
  }
}
```

### Event Emitter Modules

```typescript
// Event-based module interface
declare let NativeModules: {
  LocationModule: {
    startLocationUpdates(options: LocationOptions): void;
    stopLocationUpdates(): void;
    getCurrentLocation(callback: (location: LocationData) => void): void;

    // Event subscription
    addListener(
      event: 'locationUpdate',
      callback: (location: LocationData) => void
    ): void;
    removeListener(event: 'locationUpdate', callback: Function): void;
  };
};

// Usage
useEffect(() => {
  const handleLocationUpdate = (location: LocationData) => {
    console.log('Location updated:', location);
  };

  NativeModules.LocationModule.addListener(
    'locationUpdate',
    handleLocationUpdate
  );
  NativeModules.LocationModule.startLocationUpdates({
    accuracy: 'high',
    interval: 5000,
  });

  return () => {
    NativeModules.LocationModule.removeListener(
      'locationUpdate',
      handleLocationUpdate
    );
    NativeModules.LocationModule.stopLocationUpdates();
  };
}, []);
```

### Module with Complex Data Types

```typescript
// Rich data type support
interface CameraOptions {
  quality: number;
  targetWidth?: number;
  targetHeight?: number;
  sourceType: 'camera' | 'gallery';
  encodingType: 'jpeg' | 'png';
  allowEdit?: boolean;
}

interface CameraResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  type: string;
  isVertical: boolean;
}

declare let NativeModules: {
  CameraModule: {
    takePicture(
      options: CameraOptions,
      callback: (result: CameraResult | null, error?: string) => void
    ): void;
    hasCamera(): Promise<boolean>;
    requestPermissions(): Promise<boolean>;
  };
};
```

## Best Practices

### 1. Error Handling

Always implement proper error handling in native modules:

```kotlin
@LynxMethod
fun riskyOperation(callback: Callback) {
  try {
    val result = performOperation()
    callback.invoke(null, result)
  } catch (e: Exception) {
    callback.invoke(e.message, null)
  }
}
```

### 2. Thread Safety

Ensure thread-safe operations, especially when dealing with shared resources:

```kotlin
@LynxMethod
fun threadSafeOperation(callback: Callback) {
  GlobalScope.launch(Dispatchers.IO) {
    try {
      val result = performBackgroundOperation()
      withContext(Dispatchers.Main) {
        callback.invoke(null, result)
      }
    } catch (e: Exception) {
      withContext(Dispatchers.Main) {
        callback.invoke(e.message, null)
      }
    }
  }
}
```

### 3. Resource Management

Properly manage resources and cleanup:

```kotlin
class ResourceModule(context: Context) : LynxModule(context) {
  private var activeConnections = mutableListOf<Connection>()

  @LynxMethod
  fun createConnection(callback: Callback) {
    val connection = Connection()
    activeConnections.add(connection)
    callback.invoke(null, connection.id)
  }

  @LynxMethod
  fun cleanup() {
    activeConnections.forEach { it.close() }
    activeConnections.clear()
  }
}
```

### 4. Performance Optimization

Use appropriate data structures and algorithms:

```kotlin
@LynxMethod
fun processLargeDataset(data: ReadableArray, callback: Callback) {
  // Use streaming or chunked processing for large datasets
  val chunkSize = 1000
  val results = mutableListOf<Any>()

  for (i in 0 until data.size() step chunkSize) {
    val chunk = data.toArrayList().subList(
      i,
      minOf(i + chunkSize, data.size())
    )
    results.addAll(processChunk(chunk))
  }

  callback.invoke(null, results)
}
```

## Testing Native Modules

### Unit Testing (Android)

```kotlin
@RunWith(AndroidJUnit4::class)
class NativeLocalStorageModuleTest {

  @Test
  fun testSetAndGetStorageItem() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val module = NativeLocalStorageModule(context)

    val testKey = "testKey"
    val testValue = "testValue"

    module.setStorageItem(testKey, testValue)

    var retrievedValue: String? = null
    module.getStorageItem(testKey) { value ->
      retrievedValue = value as? String
    }

    assertEquals(testValue, retrievedValue)
  }
}
```

### Integration Testing

```typescript
// JavaScript integration tests
describe('NativeLocalStorageModule', () => {
  it('should store and retrieve values', async () => {
    const testKey = 'integrationTestKey';
    const testValue = 'integrationTestValue';

    NativeModules.NativeLocalStorageModule.setStorageItem(testKey, testValue);

    return new Promise((resolve) => {
      NativeModules.NativeLocalStorageModule.getStorageItem(
        testKey,
        (value) => {
          expect(value).toBe(testValue);
          resolve();
        }
      );
    });
  });
});
```

Native modules provide the essential bridge between LynxJS applications and native platform capabilities, enabling developers to build feature-rich cross-platform applications while maintaining the familiar web development experience.
