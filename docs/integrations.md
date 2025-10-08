# LynxJS Integrations Documentation

## Overview

LynxJS provides comprehensive integration capabilities that enable developers to build cross-platform applications using familiar web technologies. This documentation covers platform integrations, ReactLynx framework usage, development workflows, and best practices for building production-ready applications.

## ReactLynx Framework

### Introduction to ReactLynx

ReactLynx is the official React framework for LynxJS that allows developers to build native apps with a React mental model. It provides an "idiomatic" React experience while pioneering optimizations like dual-threaded React and JSX constant folding.

#### Key Features

- **Idiomatic React**: Based on Preact with the same API and behavior as React
- **Dual-threaded Architecture**: Utilizes main and background threads for optimal performance
- **JSX Constant Folding**: Compile-time optimization to reduce runtime calculations
- **Off-main-thread Reconciliation**: Moves React reconciliation logic to background thread

### Migration from React Web

#### Import Changes

```typescript
// Before (React Web)
import { useState, useEffect } from "react";

// After (ReactLynx)
import { useState, useEffect } from "@lynx-js/react";
```

#### Component Set Differences

```tsx
// React Web
<div className="container">
  <p>Hello World</p>
  <img src="image.jpg" alt="Image" />
  <button onClick={handleClick}>Click me</button>
</div>

// ReactLynx
<view className="container">
  <text>Hello World</text>
  <image src="image.jpg" auto-size />
  <view bindtap={handleClick}>
    <text>Click me</text>
  </view>
</view>
```

#### Event Handling Differences

```tsx
// React Web
<button
  onTouchStart={handleTouchStart}
  onClick={handleClick}
/>

// ReactLynx
<view
  bindtouchstart={handleTouchStart}
  bindtap={handleClick}
  catchtouchstart={handleTouchStartCapture}
/>
```

### Dual-Threaded Programming Model

#### Understanding Thread Execution

```tsx
const HelloComponent = () => {
  console.log("Hello"); // This prints twice - once on each thread
  return <text>Hello</text>;
};
```

Components render on both threads:

- **Main Thread**: Initial screen rendering and UI updates
- **Background Thread**: Complete React runtime with lifecycles and side effects

#### Background-Only Code Rules

**Rule 1: Code that is considered background-only**

```tsx
import { useEffect } from "@lynx-js/react";

function App() {
  // Event handlers are background-only
  const handleTap = (e) => {
    console.log("Event is background-only");
  };

  // Effects are background-only
  useEffect(() => {
    console.log("Effect is background-only");
  }, []);

  // Ref callbacks are background-only
  const refCallback = (ref) => {
    console.log("Ref is background-only");
  };

  return (
    <view bindtap={handleTap}>
      <text ref={refCallback}>Hello, ReactLynx!</text>
    </view>
  );
}

// Functions with 'background only' directive
function backgroundOnlyFunction() {
  "background only";
  console.log("Directive marked function is background-only");
}

// Modules with background-only directive
import "background-only";
export const env = NativeModules.env;
```

**Rule 2: Background-only code can only be used within other background-only code**

```tsx
import { useEffect } from "@lynx-js/react";

const fetchUserData = () => {
  "background only";
  return fetch("/api/user");
};

export function App() {
  // ❌ Error: calling background-only at render level
  // fetchUserData();

  // ✅ Correct: calling from background-only context
  useEffect(() => {
    fetchUserData().then((data) => console.log(data));
  }, []);

  const handleTap = () => {
    // ✅ Correct: event handlers are background-only
    fetchUserData();
  };

  return <view bindtap={handleTap} />;
}
```

**Rule 3: Code only used by background-only code becomes background-only**

```tsx
function App() {
  // This function becomes background-only automatically
  // because it's only used in useEffect
  function backgroundFunction() {
    console.log("Automatically background-only");
  }

  useEffect(() => {
    backgroundFunction();
  }, []);

  return <view />;
}
```

### Main Thread Script (MTS)

For immediate UI responsiveness, some code can be marked to run only on the main thread:

```tsx
function toRed(event) {
  "main thread";
  event.currentTarget.setStyleProperty("background-color", "red");
}

function App() {
  return (
    <view bindtap={toRed}>
      <text>Tap to turn red</text>
    </view>
  );
}
```

### Component Lifecycle in Dual-Threading

```tsx
import { useState, useEffect, useLayoutEffect } from "@lynx-js/react";

function MyComponent() {
  const [count, setCount] = useState(0);

  // Runs on background thread only
  useEffect(() => {
    console.log("Effect runs on background thread");

    // Network requests, timers, etc.
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Layout effects for immediate UI updates
  useLayoutEffect(() => {
    console.log("Layout effect for immediate updates");
  }, [count]);

  return (
    <view>
      <text>Count: {count}</text>
    </view>
  );
}
```

## Platform Integration

### Android Integration

#### Project Setup

```bash
# Add LynxJS dependencies to build.gradle
dependencies {
    implementation 'org.lynxsdk.lynx:lynx-android:3.4.1'
    implementation 'org.lynxsdk.lynx:lynx-react:3.4.1'

    // For custom elements
    kapt 'org.lynxsdk.lynx:lynx-processor:3.4.1'
    compileOnly 'org.lynxsdk.lynx:lynx-processor:3.4.1'
}
```

#### LynxView Integration

```kotlin
// MainActivity.kt
class MainActivity : AppCompatActivity() {
    private lateinit var lynxView: LynxView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize LynxView
        lynxView = LynxView(this)

        // Configure LynxView
        lynxView.setDebugMode(BuildConfig.DEBUG)
        lynxView.setUserAgent("MyApp/1.0")

        // Load your app
        lynxView.loadUrl("file:///android_asset/bundle/index.html")

        setContentView(lynxView)
    }

    override fun onDestroy() {
        super.onDestroy()
        lynxView.destroy()
    }

    override fun onBackPressed() {
        if (lynxView.canGoBack()) {
            lynxView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

#### Advanced Android Integration

```kotlin
// Custom LynxView with native integration
class CustomLynxActivity : AppCompatActivity() {
    private lateinit var lynxView: LynxView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lynxViewBuilder = LynxViewBuilder()
            .setContext(this)
            .setDebugMode(BuildConfig.DEBUG)
            .setUserAgent("CustomApp/1.0")
            .addJavaScriptInterface(AndroidBridge(), "AndroidBridge")

        // Register custom modules
        lynxViewBuilder.addNativeModule("Storage", StorageModule::class.java)
        lynxViewBuilder.addNativeModule("Camera", CameraModule::class.java)

        // Register custom elements
        lynxViewBuilder.addBehavior(object : Behavior("custom-input") {
            override fun createUI(context: LynxContext): CustomInputElement {
                return CustomInputElement(context)
            }
        })

        lynxView = lynxViewBuilder.build()

        // Set up event listeners
        lynxView.setOnPageFinishedListener { url ->
            Log.d("LynxView", "Page finished loading: $url")
        }

        lynxView.setOnErrorListener { error ->
            Log.e("LynxView", "Error occurred: $error")
        }

        // Load the app
        lynxView.loadUrl("file:///android_asset/app/index.html")
        setContentView(lynxView)
    }
}

// Native bridge for Android-specific functionality
class AndroidBridge {
    @JavascriptInterface
    fun showToast(message: String) {
        // This will be called from JavaScript
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun getDeviceInfo(): String {
        return JSONObject().apply {
            put("model", Build.MODEL)
            put("version", Build.VERSION.RELEASE)
            put("manufacturer", Build.MANUFACTURER)
        }.toString()
    }
}
```

### iOS Integration

#### Project Setup

```swift
// Add LynxJS to your iOS project via CocoaPods
// Podfile
pod 'LynxSDK', '~> 3.4.1'
pod 'LynxReact', '~> 3.4.1'
```

#### LynxView Integration

```swift
// ViewController.swift
import UIKit
import LynxSDK

class ViewController: UIViewController {
    private var lynxView: LynxView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Initialize LynxView
        lynxView = LynxView(frame: view.bounds)
        lynxView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        // Configure LynxView
        lynxView.isDebugMode = true
        lynxView.userAgent = "MyApp/1.0"

        // Set up delegates
        lynxView.delegate = self

        view.addSubview(lynxView)

        // Load your app
        if let bundlePath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "bundle") {
            let url = URL(fileURLWithPath: bundlePath)
            lynxView.loadRequest(URLRequest(url: url))
        }
    }

    deinit {
        lynxView.destroy()
    }
}

// LynxView delegate methods
extension ViewController: LynxViewDelegate {
    func lynxView(_ lynxView: LynxView, didFinishLoadingURL url: URL) {
        print("Page finished loading: \(url)")
    }

    func lynxView(_ lynxView: LynxView, didFailWithError error: Error) {
        print("Error occurred: \(error)")
    }

    func lynxView(_ lynxView: LynxView, shouldStartLoadWith request: URLRequest) -> Bool {
        // Handle navigation requests
        return true
    }
}
```

#### Advanced iOS Integration

```swift
// Custom integration with native modules
class CustomLynxViewController: UIViewController {
    private var lynxView: LynxView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Register native modules
        LynxModuleRegistry.shared.register("IOSBridge", IOSBridge.self)
        LynxModuleRegistry.shared.register("Camera", CameraModule.self)

        // Register custom elements
        LynxElementRegistry.shared.register("ios-picker", IOSPickerElement.self)

        lynxView = LynxView(frame: view.bounds)
        lynxView.delegate = self

        // Add native bridge
        lynxView.addScriptMessageHandler(self, name: "iOSBridge")

        view.addSubview(lynxView)

        loadLynxApp()
    }

    private func loadLynxApp() {
        guard let appPath = Bundle.main.path(forResource: "app", ofType: nil) else {
            return
        }

        let url = URL(fileURLWithPath: appPath + "/index.html")
        lynxView.loadRequest(URLRequest(url: url))
    }
}

// Native bridge implementation
@objc(IOSBridge)
class IOSBridge: NSObject, LynxModule {

    @objc
    func showAlert(_ title: String, message: String, callback: @escaping LynxCallback) {
        DispatchQueue.main.async {
            let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                callback([true])
            })

            if let topVC = UIApplication.shared.topViewController() {
                topVC.present(alert, animated: true)
            }
        }
    }

    @objc
    func getDeviceInfo(_ callback: @escaping LynxCallback) {
        let device = UIDevice.current
        let info: [String: Any] = [
            "model": device.model,
            "systemVersion": device.systemVersion,
            "name": device.name,
            "identifierForVendor": device.identifierForVendor?.uuidString ?? ""
        ]
        callback([info])
    }
}
```

### Web Integration

#### HTML Host Page

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LynxJS Web App</title>
    <style>
      body {
        margin: 0;
        padding: 0;
      }
      #lynx-container {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="lynx-container"></div>

    <!-- LynxJS Web Runtime -->
    <script src="./lynx-web-runtime.js"></script>
    <script>
      // Initialize LynxJS for web
      window.lynx = new LynxWebRuntime({
        container: document.getElementById("lynx-container"),
        bundleUrl: "./app-bundle.js",
        debug: true,
      });

      // Load the app
      lynx.start();
    </script>
  </body>
</html>
```

#### Progressive Web App Integration

```typescript
// service-worker.js for PWA support
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("lynx-app-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/app-bundle.js",
        "/lynx-web-runtime.js",
        "/assets/logo.png",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## Development Workflow

### Project Structure

```
my-lynx-app/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── UserProfile.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Settings.tsx
│   │   └── Profile.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useStorage.ts
│   │   └── useNetwork.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   └── auth.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── index.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── styles/
│   ├── global.css
│   └── components.css
├── native/
│   ├── android/
│   └── ios/
├── package.json
├── lynx.config.js
└── tsconfig.json
```

### Build Configuration

```javascript
// lynx.config.js
module.exports = {
  entry: "./src/index.ts",
  output: {
    path: "./dist",
    filename: "app-bundle.js",
  },

  // Platform-specific configurations
  platforms: {
    android: {
      output: "./android/app/src/main/assets/bundle/",
      minifyBundle: true,
    },
    ios: {
      output: "./ios/Bundle/",
      minifyBundle: true,
    },
    web: {
      output: "./web/dist/",
      generateServiceWorker: true,
    },
  },

  // Development server
  devServer: {
    port: 3000,
    host: "0.0.0.0",
    hot: true,
  },

  // Bundle optimization
  optimization: {
    splitChunks: true,
    treeshaking: true,
    constantFolding: true,
  },

  // Native modules
  nativeModules: [
    "./native/storage-module",
    "./native/camera-module",
    "./native/location-module",
  ],

  // Custom elements
  customElements: [
    "./native/custom-input",
    "./native/media-player",
    "./native/chart-view",
  ],
};
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "lynx dev",
    "build": "lynx build",
    "build:android": "lynx build --platform android",
    "build:ios": "lynx build --platform ios",
    "build:web": "lynx build --platform web",
    "start": "lynx start",
    "test": "jest",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@lynx-js/react": "^3.4.1",
    "@lynx-js/types": "^3.4.1"
  },
  "devDependencies": {
    "@lynx-js/cli": "^3.4.1",
    "@lynx-js/dev-server": "^3.4.1",
    "@types/react": "^18.0.0",
    "typescript": "^4.9.0"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "jsxImportSource": "@lynx-js/react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["@lynx-js/types"]
  },
  "include": ["src/**/*", "types/**/*"],
  "exclude": ["node_modules", "dist", "native"]
}
```

## State Management Integration

### Redux Integration

```typescript
// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import appSlice from "./appSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    app: appSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```tsx
// App.tsx with Redux
import { Provider } from "react-redux";
import { store } from "./store";
import MainApp from "./MainApp";

export function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}
```

### Context API Integration

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "@lynx-js/react";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    NativeModules.StorageModule.getItem("authToken", (token) => {
      if (token) {
        validateToken(token).then(setUser);
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await api.login(credentials);
      setUser(response.user);
      await NativeModules.StorageModule.setItem("authToken", response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    NativeModules.StorageModule.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

## Navigation Integration

### Router Implementation

```tsx
// router/Router.tsx
import { useState, useEffect } from "@lynx-js/react";

interface Route {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
}

interface RouterProps {
  routes: Route[];
  initialPath?: string;
}

export function Router({ routes, initialPath = "/" }: RouterProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);

  useEffect(() => {
    // Listen for navigation events
    const handleNavigation = (event: any) => {
      setCurrentPath(event.detail.path);
    };

    lynx.addEventListener("navigate", handleNavigation);
    return () => lynx.removeEventListener("navigate", handleNavigation);
  }, []);

  const currentRoute = routes.find((route) => {
    if (route.exact) {
      return route.path === currentPath;
    }
    return currentPath.startsWith(route.path);
  });

  if (!currentRoute) {
    return <text>404 - Page not found</text>;
  }

  const Component = currentRoute.component;
  return <Component />;
}

// Navigation functions
export const navigate = (path: string) => {
  lynx.emit("navigate", { path });
};

export const goBack = () => {
  lynx.emit("navigate:back");
};
```

### Usage with Navigation

```tsx
// App.tsx with routing
import { Router, navigate } from "./router/Router";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

const routes = [
  { path: "/", component: Home, exact: true },
  { path: "/profile", component: Profile },
  { path: "/settings", component: Settings },
];

export function App() {
  return (
    <view>
      <Router routes={routes} />

      {/* Navigation */}
      <view style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <view bindtap={() => navigate("/")}>
          <text>Home</text>
        </view>
        <view bindtap={() => navigate("/profile")}>
          <text>Profile</text>
        </view>
        <view bindtap={() => navigate("/settings")}>
          <text>Settings</text>
        </view>
      </view>
    </view>
  );
}
```

## Testing Integration

### Unit Testing with Jest

```typescript
// __tests__/components/UserProfile.test.tsx
import { render, fireEvent } from "@testing-library/lynx";
import UserProfile from "../components/UserProfile";

describe("UserProfile", () => {
  it("renders user information", () => {
    const user = { name: "John Doe", email: "john@example.com" };
    const { getByText } = render(<UserProfile user={user} />);

    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("john@example.com")).toBeTruthy();
  });

  it("handles edit button tap", () => {
    const onEdit = jest.fn();
    const user = { name: "John Doe", email: "john@example.com" };
    const { getByTestId } = render(<UserProfile user={user} onEdit={onEdit} />);

    fireEvent.tap(getByTestId("edit-button"));
    expect(onEdit).toHaveBeenCalledWith(user);
  });
});
```

### E2E Testing

```typescript
// e2e/app.e2e.ts
import { LynxTestDriver } from "@lynx-js/test-driver";

describe("App E2E", () => {
  let driver: LynxTestDriver;

  beforeAll(async () => {
    driver = new LynxTestDriver();
    await driver.start();
  });

  afterAll(async () => {
    await driver.stop();
  });

  it("should navigate through app", async () => {
    // Navigate to profile
    await driver.tap("profile-button");
    await driver.waitForElement("profile-header");

    // Check profile content
    const profileName = await driver.getText("profile-name");
    expect(profileName).toBe("John Doe");

    // Navigate back
    await driver.tap("back-button");
    await driver.waitForElement("home-header");
  });
});
```

## Performance Optimization

### Bundle Optimization

```typescript
// Lazy loading components
import { lazy, Suspense } from "@lynx-js/react";

const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
      </Suspense>
    </Router>
  );
}
```

### Memory Management

```tsx
// Proper cleanup in components
function DataComponent() {
  useEffect(() => {
    const subscription = dataService.subscribe(handleData);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(fetchData, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return <view>...</view>;
}
```

### Image Optimization

```tsx
// Optimized image loading
function OptimizedImage({ src, ...props }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <view>
      {!loaded && <LoadingPlaceholder />}
      <image
        src={src}
        bindload={() => setLoaded(true)}
        binderror={() => console.error("Image failed to load")}
        lazy={true}
        style={{ opacity: loaded ? 1 : 0 }}
        {...props}
      />
    </view>
  );
}
```

## Deployment and Distribution

### Android APK Build

```bash
# Build for Android
npm run build:android

# Generate APK
cd android
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

### iOS App Store Build

```bash
# Build for iOS
npm run build:ios

# Open Xcode project
open ios/MyLynxApp.xcworkspace

# Archive and upload via Xcode
```

### Web Deployment

```bash
# Build for web
npm run build:web

# Deploy to hosting service
npm run deploy
```

This comprehensive integration guide provides the foundation for building production-ready LynxJS applications across all supported platforms while leveraging the full power of the React ecosystem and native capabilities.
