# WebView Module — Embedded Browser for LynxJS

Why this module

Mobile apps commonly need to display web content inside the app (payments, help pages, SSO, embedded widgets). A first-class WebView module lets LynxJS apps render web pages natively while keeping a secure JS bridge and full session control.

Design goals

- Standalone: no dependency on other native modules; easy to plug into any LynxJS project
- Background-thread compatible: safe to call from LynxJS worker thread where applicable
- Minimal surface area: clear methods for navigation, injection, cookies, and events
- Type-safe: TypeScript definitions for the public API

Capabilities

- Embedded web content rendering (native WebView on Android/iOS)
- Bidirectional JavaScript bridge between LynxJS and the page
- Cookie and session management API (get/set/clear)
- Custom user-agent and additional request headers
- Progress events, navigation controls (back/forward/reload/stop)
- File input support and limited file chooser bridge
- Safe evaluation of JS and promise-based results

Public TypeScript interface

export type WebViewNavigationState = {
url: string;
title?: string;
canGoBack: boolean;
canGoForward: boolean;
loading: boolean;
progress?: number; // 0-1
};

export type WebViewMessage = {
id?: string; // optional correlation id for request/response
type: string; // arbitrary message type
payload?: any;
error?: string;
};

export interface IWebViewModule {
// Mount a native WebView and return a handle id to reference it
create(options?: {
url?: string;
userAgent?: string;
headers?: Record<string,string>;
javaScriptEnabled?: boolean;
allowFileAccess?: boolean;
cacheEnabled?: boolean;
}): Promise<string>;

// Destroy the created WebView
destroy(handle: string): Promise<void>;

// Navigation
loadUrl(handle: string, url: string): Promise<void>;
reload(handle: string): Promise<void>;
stopLoading(handle: string): Promise<void>;
goBack(handle: string): Promise<void>;
goForward(handle: string): Promise<void>;

// Evaluate JS in page context and receive a JSON-serializable result
evaluateJavaScript(handle: string, script: string): Promise<any>;

// Send a structured message to page (via postMessage)
postMessage(handle: string, message: WebViewMessage): Promise<void>;

// Cookie / session management
getCookies(url: string): Promise<Record<string,string>>;
setCookie(url: string, name: string, value: string, options?: {expires?: number; path?: string; secure?: boolean; httpOnly?: boolean}): Promise<void>;
clearCookies(): Promise<void>;

// Event subscription (progress, navigation change, messages)
on(handle: string, event: 'navigationStateChange' | 'progress' | 'message' | 'error', callbackId: string): Promise<void>;
off(handle: string, event: string, callbackId: string): Promise<void>;

// Capture snapshot (screenshot) of the WebView
captureSnapshot(handle: string, options?: {format?: 'png' | 'jpg', quality?: number}): Promise<string>; // returns base64
}

Example usage (TypeScript)

const webviewId = await Lynx.modules.WebView.create({ url: 'https://example.com' });

Lynx.modules.WebView.on(webviewId, 'navigationStateChange', 'navCb1');

// elsewhere register a global callback by id that receives payloads from native
// ...existing code...

// Evaluate script
const title = await Lynx.modules.WebView.evaluateJavaScript(webviewId, 'document.title');

// Post a message to the page
await Lynx.modules.WebView.postMessage(webviewId, { type: 'AUTH_TOKEN', payload: { token: 'abc' } });

Integration notes

- On Android implement using AndroidX WebKit/WebView with custom WebViewClient/WebChromeClient for progress and file inputs.
- Use a serialized message envelope to go across the JS bridge. Correlate request/response with `id` when the caller expects a reply.
- Keep cookie store changes in sync with native CookieManager (Android) and WKHTTPCookieStore (iOS).
- Respect main-thread-only WebView operations. Provide the API to queue operations from background worker to main thread and broadcast results back via events.
- Carefully limit allowed origins and documented security practices for evaluateJavaScript and postMessage.

Sample Android notes (Kotlin)

- Provide a WebViewHost class that creates/destroys WebView on UI thread
- Use Handler/Coroutine to marshal calls from worker to UI thread
- Use evaluateJavascript for script evaluation and return results via Promise resolver
- Implement WebViewClient.shouldOverrideUrlLoading to allow the host app to intercept certain schemes (app://, lynx://)

Security considerations

- Avoid exposing sensitive native APIs via evaluateJavaScript
- Document explicit opt-in for file chooser and camera access
- Validate messages from web content and use origin checks

Testing

- Unit test the TypeScript stubs
- Android: instrumentation tests for navigation and JS bridge
- iOS: XCTest for message handling and WKWebView behaviors

Compatibility and fallbacks

- On platforms that don't support native webviews fully, provide a fallback to open in external browser with the same cookie sync APIs where possible.

Notes

- Keep the module small and focused on navigation and messaging. Advanced features (full chromium embed, service workers) should be opt-in and separated into plugins.

---

Next I'll create the Secure Storage module doc. After that I'll proceed to the rest.  
(Updating todo list: webview completed, moving to secure storage.)
