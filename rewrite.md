I'll create a short plan for the research and mark the first task in-progress, then run quick searches to find all login/OAuth related files in the repo so I can read them next. Expected outcome: a list of candidate files to read.

Created 4 todos

Why: I'm going to search the repo for login, oauth, auth, web browser hook names to locate relevant files; what: perform a grep search for common keywords; outcome: list of matching files and lines to inspect. I'll run several searches in parallel.

Searched text for `oauth|OAuth|login|auth|useWebBrowser|openBrowser|redirect_uri|redirectUri|hextok://oauth|github`, 200 results

Searched text for `useOAuthFlow|useMobileOAuth|useWebBrowser|useWebBrowser\(`, 200 results

Searched for files matching `**/login*.{ts,tsx,js,jsx}`, 2 matches

Why: I need the source for each file involved in the login/OAuth flow so I can extract each function, purpose, inputs/outputs and call relationships; what I'll run: read the key frontend files (hooks, API helpers, utils, components, routes) in parallel; expected outcome: full contents to analyze and produce the flow doc.

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/hooks/useWebBrowser.ts)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/lynx-web-browser-api.ts)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/hooks/useMobileOAuth.ts)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/hooks/useOAuthFlow.ts)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/deeplink.ts)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/routes/%28unauth%29/login/store.tsx)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/components/webview-test.tsx)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/utils/cookie-capture.ts)

Read [](file:///home/himanshu77/Desktop/projects/hextok/app/src/routes/%28unauth%29/login/login-page.tsx)

I'll mark the first todo done and set the next todo (reading and extracting functions) to in-progress, then I'll produce the research output describing each function and the overall call flow. I'm updating the todo list: mark the file-discovery task completed and mark the "assemble call flow doc" task as in-progress next. Then I'll present the function-by-function research and the call flow.

Starting (3/4) _Assemble call flow doc_

I'll extract every function involved in the login/OAuth flow (frontend side), describe what each does, its inputs/outputs/side-effects, and then produce a concise "who calls who" flow. I read the key files: useWebBrowser.ts, lynx-web-browser-api.ts, useMobileOAuth.ts, useOAuthFlow.ts, deeplink.ts, store.tsx, webview-test.tsx, cookie-capture.ts, and the login-page.tsx you attached.

Below is the research (pure documentation — no code changes).

## Short contract (what I'm delivering)

- Input: repository frontend files I read (listed above).
- Output: per-function descriptions (purpose, inputs, outputs, side-effects, who calls it), and a final call-flow mapping that shows the end-to-end login/OAuth flow on the client.
- Success criteria: every function relevant to login/OAuth in the files read is described and mapped into a call graph.

## Files scanned

- useWebBrowser.ts
- lynx-web-browser-api.ts
- useMobileOAuth.ts
- useOAuthFlow.ts
- deeplink.ts
- store.tsx
- webview-test.tsx
- cookie-capture.ts
- login-page.tsx

---

## Function-by-function descriptions

Note: I use the file name + function name. For each function I include: short purpose, inputs, outputs (return), side-effects (network, native modules, storage), and who calls it (from the files we read).

### useWebBrowser.ts

- getLynxWebBrowserModule()

  - Purpose: Find and return the native LynxWebBrowserModule (various runtime access patterns).
  - Inputs: none
  - Output: LynxWebBrowserModuleInterface | null
  - Side-effects: none (safe checks); may access globals like NativeModules or lynx.requireNativeModule
  - Called by: openBrowser, dismissBrowser, openAuthSession, custom tabs helpers in same file; also used indirectly across hooks that call those.

- useWebBrowser()

  - Purpose: Hook exposing browser-opening utilities (openBrowser, dismissBrowser, openContent), status (isLoading, result, error).
  - Inputs: none (hook)
  - Output: { openBrowser(url, options), dismissBrowser(), openContent(url, options), isLoading, result, error, clearError }
  - Side-effects:
    - Calls native module method openBrowserAsync or dismissBrowser (via getLynxWebBrowserModule).
    - Sets local React state (isLoading, result, error).
  - Who calls it: UI components such as `LoginPage` (login-page.tsx), `WebViewTest`, other hooks that need browser (some higher-level OAuth hooks may call the WebAuth methods).
  - Important behavior: openBrowser uses native module callback which sets result/error; openContent wraps openBrowser with default viewer options.

- openBrowser(url, options)

  - Purpose: Open a URL in the system browser or in-app browser.
  - Inputs: url:string, options:WebBrowserOpenOptions
  - Output: Promise<void> (implemented as async function that sets state; native module uses callbacks)
  - Side-effects: calls native LynxWebBrowserModule.openBrowserAsync; updates state.

- dismissBrowser()

  - Purpose: Dismiss currently presented browser
  - Inputs: none
  - Output: Promise<void>
  - Side-effects: calls LynxWebBrowserModule.dismissBrowser; sets result/error accordingly.

- openContent(url, options)

  - Purpose: Open content with recommended options (readerMode etc.)
  - Inputs: url, options
  - Output: Promise<void> (calls openBrowser)
  - Side-effects: same as openBrowser

- useWebBrowserAuth()

  - Purpose: Hook for authentication flows (ASWebAuthenticationSession / Custom Tabs) — openAuthSession/openOAuth/dismissAuth
  - Inputs: none
  - Output: { openAuthSession(authUrl, redirectUrl, options), openOAuth(authUrl, redirectUrl, options), dismissAuth(), isLoading, result, error, clearError }
  - Side-effects: calls native openAuthSessionAsync/dismissAuthSession; sets state to reflect auth session results.
  - Called by: `useMobileOAuth`, `useOAuthFlow`, `useMobileGitHubOAuth` wrappers, and any UI code that directly opens auth sessions.

- openAuthSession(authUrl, redirectUrl, options)

  - Purpose: Start an authentication session using native auth session APIs.
  - Inputs: authUrl (string), redirectUrl (string), options (AuthSessionOpenOptions)
  - Output: Promise that resolves with WebBrowserAuthSessionResult via native callback; sets isLoading/result/error in hook state.
  - Side-effects: Calls LynxWebBrowserModule.openAuthSessionAsync.

- openOAuth(authUrl, redirectUrl, options)

  - Purpose: Wrapper around openAuthSession that applies preferEphemeralSession default.
  - Inputs: same as openAuthSession
  - Output: Promise of WebBrowserAuthSessionResult
  - Side-effects: calls openAuthSession.

- dismissAuth()

  - Purpose: Dismiss an active auth session.
  - Inputs: none
  - Output: none (synchronous)
  - Side-effects: calls LynxWebBrowserModule.dismissAuthSession(); clears result state.

- useCustomTabs()

  - Purpose: Android Custom Tabs support helpers (warmUp, coolDown, preloadUrl, getSupportedBrowsers, isSupported)
  - Inputs: none
  - Output: helpers and status flags
  - Side-effects: calls native methods getCustomTabsSupportingBrowsersAsync, warmUpAsync, coolDownAsync, mayInitWithUrlAsync
  - Called by: code that wants to prewarm browser for performance (not directly the login flow here, but helpful for performance).

- useWebView()

  - Purpose: Hook managing an embedded web-view (web-view element) — goes with the LynxJS web-view element API
  - Inputs: none
  - Output: ref, currentUrl, canGoBack, canGoForward, isLoading, goBack, goForward, reload, loadUrl, getCurrentUrl, event handlers handleLoad/handleError/handleNavigation
  - Side-effects: uses lynx.createSelectorQuery to send commands to web-view, updates state on events.
  - Called by: `WebViewTest` (component), and any embedded web-view usage.

- useMobileOAuth() (in same file; high-level wrapper I read)

  - Purpose: Hook that integrates the mobile OAuth flow with the web browser/auth session and token-exchange — older/in-file variant used by other modules.
  - Inputs: options: { baseUrl?, redirectUri?, onSuccess?, onError? }
  - Output: { startOAuth(customState?), cancelOAuth(), exchangeToken(), isLoading, result, error, currentState, clearError }
  - Side-effects:
    - Calls native openAuthSessionAsync directly (via getLynxWebBrowserModule) to open OAuth start URL.
    - Calls exchange endpoint (fetch) to exchange a mobile token for a session cookie (POST /api/v1/oauth/mobile/exchange).
    - Uses registerOAuthCallback (from lynx-web-browser-api.ts) and LocalStorageModule polling approach; sets state based on results.
  - Who calls it: In this repo likely used by higher-level hooks (but we have a separate files useMobileOAuth.ts and useOAuthFlow.ts which appear to be more authoritative). The login-page.tsx uses `useWebBrowser` directly; the more feature-rich flows (cookie capture / token exchange) are implemented in useMobileOAuth.ts or useOAuthFlow.ts.

- useOAuthListener()

  - Purpose: Manage a storage-based callback registration that polls LocalStorageModule via registerOAuthCallback to receive the stored result and expose it to components.
  - Inputs: none
  - Output: { result, error, clearResult }
  - Side-effects: calls registerOAuthCallback which polls `LocalStorageModule` under the `hextok_oauth_deeplink` key; sets result/error accordingly.
  - Who calls it: components or hooks that want to listen to OAuth results (not used directly in login-page.tsx)

- registerOAuthCallback() (exported here but implemented in lynx-web-browser-api.ts; see that file below)

  - Purpose: set up polling for deep link data in LocalStorageModule and call a callback with normalized MobileOAuthResult
  - Inputs: callback(result)
  - Output: returns cleanup function (stop polling)
  - Side-effects: reads NativeModules.LocalStorageModule, periodically polls the `OAUTH_DEEPLINK_KEY`; removes the key on delivery and calls callback.

- startMobileOAuthFlow() (in same file)

  - Purpose: convenience to construct oauth start URL and call openAuthSessionAsync (calls openAuthSessionAsync wrapper)
  - Inputs: options: { state, redirectUri, baseUrl }
  - Output: Promise<WebBrowserAuthSessionResult>
  - Side-effects: constructs the backend start URL with state and redirect_uri and opens auth session.

- exchangeMobileToken(token, baseUrl) (in same file)

  - Purpose: POST /api/v1/oauth/mobile/exchange to exchange mobile token for session.
  - Inputs: token string, baseUrl
  - Output: MobileTokenExchangeResponse (parsed JSON)
  - Side-effects: network fetch; throws on non-200.

- generateOAuthState()

  - Purpose: helper to generate random state string
  - Inputs: none
  - Output: string (32-char alnum)
  - Who calls it: used by many flows to generate state for CSRF protection.

- completeOAuthFlow(state, baseUrl, redirectUri)

  - Purpose: high-level convenience that registers a callback, starts mobile OAuth, waits for deep-link result, exchanges token.
  - Inputs: state, baseUrl, redirectUri
  - Output: Promise<MobileTokenExchangeResponse>
  - Side-effects: registers registerOAuthCallback, calls startMobileOAuthFlow, exchanges token on success.

- registerOAuthCallback (detailed implementation) (in lynx-web-browser-api.ts)
  - Purpose: poll LocalStorageModule for stored deep link under key `hextok_oauth_deeplink`, normalize the stored payload to MobileOAuthResult, remove the key, call provided callback and stop polling.
  - Inputs: callback (result: MobileOAuthResult) => void
  - Output: cleanup function to stop polling
  - Side-effects: uses NativeModules.LocalStorageModule.getStorageItem/removeStorageItem; runs interval timer every 500ms until delivered.
  - Who calls it: useMobileOAuth/useOAuthListener/completeOAuthFlow etc.

### lynx-web-browser-api.ts

This file is the central API wrapper (LynxWebBrowser). Many functions here map closely to the native module and to the higher-level flows.

- openBrowserAsync(url, browserParams)

  - Purpose: low-level wrapper that returns a Promise and calls NativeModules.LynxWebBrowserModule.openBrowserAsync, resolving or rejecting based on callback
  - Inputs: url string, browserParams (WebBrowserOpenOptions)
  - Output: Promise<WebBrowserResult>
  - Side-effects: calls native module.

- dismissBrowser()

  - Purpose: call NativeModules.LynxWebBrowserModule.dismissBrowser and return result
  - Inputs: none
  - Output: Promise<{ type: 'dismiss' }>
  - Side-effects: native call

- openAuthSessionAsync(url, redirectUrl, options)

  - Purpose: open an auth session via native openAuthSessionAsync and return Promise<WebBrowserAuthSessionResult>
  - Inputs: url, redirectUrl, options
  - Output: Promise<WebBrowserAuthSessionResult>
  - Side-effects: native call

- dismissAuthSession()

  - Purpose: call native dismissAuthSession (void)
  - Inputs: none
  - Output: void
  - Side-effects: native call

- getCustomTabsSupportingBrowsersAsync(), warmUpAsync(), mayInitWithUrlAsync(), coolDownAsync()

  - Purpose: custom tabs helpers that call native module and return Promise-based results
  - Called by: useCustomTabs hook and callers that want to warm up.

- openOAuthAsync(authUrl, redirectUrl, options)

  - Purpose: convenience wrapper that calls openAuthSessionAsync with preferEphemeralSession default; returns WebBrowserAuthSessionResult
  - Inputs: authUrl, redirectUrl, options
  - Output: Promise<WebBrowserAuthSessionResult>
  - Called by: useWebBrowser's completeOAuthFlow; higher-level convenience.

- openContentAsync(url, options)

  - Purpose: openBrowserAsync with readerMode and other defaults.

- isCustomTabsSupported()

  - Purpose: returns boolean by querying custom tabs result
  - Inputs: none
  - Output: Promise<boolean>

- startMobileOAuthFlow(options)

  - Purpose: constructs backend oauth start URL with state and redirect_uri and calls openAuthSessionAsync; (note: code does validation for state)
  - Inputs: options: { state, redirectUri?, baseUrl? }
  - Output: Promise<WebBrowserAuthSessionResult>
  - Side-effects: calls openAuthSessionAsync -> opens native auth session
  - Who calls it: completeOAuthFlow, useMobileOAuth variants.

- exchangeMobileToken(token, baseUrl)

  - Purpose: POST /api/v1/oauth/mobile/exchange to exchange token
  - Inputs: token, baseUrl
  - Output: MobileTokenExchangeResponse
  - Side-effects: network fetch

- generateOAuthState()

  - Purpose: random state generator (same as hooks)
  - Called by: many flows if they prefer the helper.

- registerOAuthCallback(callback)

  - Purpose: storage-polling-based callback registration described earlier. (Detailed above)
  - Input: callback
  - Output: cleanup function
  - Side-effects: polls NativeModules.LocalStorageModule.getStorageItem; removes key after delivery.

- completeOAuthFlow(state, baseUrl, redirectUri)
  - Purpose: sets up registerOAuthCallback, calls startMobileOAuthFlow, on callback success calls exchangeMobileToken and resolves with the exchange result (high-level full flow)
  - Inputs: state, baseUrl, redirectUri
  - Output: Promise<MobileTokenExchangeResponse>
  - Side-effects: poll, network calls, native openAuthSessionAsync

### useMobileOAuth.ts

This file is a feature-rich hook that appears to be the main client-side orchestrator for mobile OAuth in this repo (preferred over the inline useMobileOAuth in useWebBrowser), containing enhanced debug logging and cookie capture, token exchange, and handling the final session.

Key functions/exports:

- useMobileOAuth(options)

  - Purpose: high-level hook that starts OAuth, receives auth session result, parses callback URL, exchanges token for session, collects debug info and cookie capture for analysis.
  - Inputs: options: { baseUrl, provider, enableDebugLogging?, customScheme? }
  - Output: { startOAuth(), state, clearState(), parseOAuthCallback(), exchangeTokenForSession(), logDebugInfo() }
  - Side-effects:
    - calls openAuthSession (via useWebBrowserAuth) to open the provider auth page
    - listens for the auth session result (the `result` returned by useWebBrowserAuth); on success it parses the returned URL
    - calls exchangeTokenForSession(token) which POSTs to /api/v1/oauth/mobile/exchange
    - uses oauthCookieCapture for cookie captures (debug only)
    - logs debug info via debug-native-modules utilities
  - Who calls it: this is typically the main hook used by app code that wants a full mobile OAuth flow; not directly used by login-page.tsx (which uses useWebBrowser directly) but it's available in the codebase.

- parseOAuthCallback(url)

  - Purpose: parse redirect URL query params (token, user_id, error, etc.)
  - Input: url string (callback redirect)
  - Output: object { token?, userID?, error?, errorDescription? }
  - Side-effects: none

- exchangeTokenForSession(token)

  - Purpose: POST /api/v1/oauth/mobile/exchange to exchange token for session token
  - Input: token string
  - Output: { success: boolean, sessionToken?, userID?, error? }
  - Side-effects: network fetch, logging

- startOAuth()

  - Purpose: start the flow: openAuthSession(authUrl, customScheme) and sets up state for waiting
  - Inputs: none
  - Output: void (starts native auth session)
  - Side-effects: opens native auth session; uses `openAuthSession` from `useWebBrowserAuth`.

- handleOAuthCallback(result) (internal)

  - Purpose: handle the WebBrowserAuthSessionResult returned by openAuthSession; parse callback URL and proceed to token exchange, set hook state accordingly.
  - Input: result (WebBrowserAuthSessionResult)
  - Output: internal state updates
  - Side-effects: calls parseOAuthCallback, exchangeTokenForSession, sets state.isAuthenticated, session token etc.

- clearState()

  - Purpose: reset internal hook state and cookie capture
  - Input: none
  - Output: none

- useMobileGitHubOAuth(baseUrl, enableDebugLogging)
  - Purpose: convenience wrapper to useMobileOAuth preconfigured for GitHub provider and default redirect scheme
  - Input: baseUrl, enableDebugLogging
  - Output: same as useMobileOAuth

### useOAuthFlow.ts

This file implements an alternative/higher-level OAuth flow focusing on cookie capture and analysis (useful for debugging cookie-related flows). It includes:

- useOAuthFlow(options)

  - Purpose: Hook for handling OAuth flow with cookie capture before & after authentication; used in debugging and verifying cookie behavior.
  - Inputs: { baseUrl, provider, redirectScheme?, enableDebugLogging? }
  - Output: { startOAuth(), state, clearState(), captureCookies(), logDebugInfo() ...}
  - Side-effects:
    - captures cookies via oauthCookieCapture before opening auth session
    - calls openAuthSession(authUrl, redirectUrl) via useWebBrowserAuth
    - on result success captures cookies again and runs analysis
  - Who calls it: debug components or developers troubleshooting cookie/session issues; not the `LoginPage` in the repo but it provides the analysis utilities.

- captureCookies()

  - Purpose: uses oauthCookieCapture.captureCookies() to read current cookies (document.cookie fallback)
  - Input: none
  - Output: CookieInfo[]
  - Side-effects: console logging when debug enabled

- startOAuth()

  - Purpose: capture before cookies, open auth session, wait result for after capture
  - Side-effects: openAuthSession (native), cookie captures, set state.

- handleOAuthSuccess(result)

  - Purpose: invoked on auth session success; captures after cookies and runs comparisons
  - Inputs: WebBrowserAuthSessionResult
  - Output: sets internal state and logs

- useGitHubOAuth(baseUrl, enableDebugLogging)
  - Purpose: convenience wrapper that calls useOAuthFlow configured for GitHub.

### deeplink.ts

- deepLinks (constant)

  - Purpose: typed list of app deep link paths used by the app
  - Value: ['/oauth/verify', '/oauth/callback']
  - Who uses it: routing and deep link handling code.

- getLastDeepLink() / clearDeepLink() / hasDeepLink()
  - (These functions exist in lynx-web-browser-api.ts or deeplink.ts depending on file; in our read deeplink.ts exports typed helpers.)
  - Purpose: helpers to read/clear stored deep link data from native DeepLinkModule (LocalStorage or similar).
  - Inputs/Outputs: see the code; they interact with NativeModules.DeepLinkModule.

### store.tsx

- StorageTest component
  - Purpose: Example test UI to exercise `LocalStorageModule` (set/get/clear). Not part of core auth flow but shows how LocalStorageModule is used.
  - Inputs: none (UI)
  - Outputs: UI
  - Side-effects: uses NativeModules.LocalStorageModule.setStorageItem/getStorageItem/clearStorage
  - Who calls it: not directly in login flow, included in login page import (StorageTest) but not shown in LoginPage's rendered UI (it was imported in login-page.tsx but not visibly used except for reference).

### webview-test.tsx

Contains a rich set of demo/test components for web-view and browser functions.

Key items:

- WebViewTest (default export)
  - Purpose: component enabling manual testing of web browser and webview features (openBrowser, openContent, dismissBrowser, useWebView controls, debug info).
  - Important calls in flow:
    - uses `useWebBrowser()` (openBrowser, openContent, dismissBrowser).
    - uses `useWebView()` to show embedded web-view tests.

This component is a playground; it demonstrates how the hooks are used but is not part of the production login flow.

### cookie-capture.ts

- OAuthCookieCapture class

  - Purpose: capture cookies from available sources (document.cookie etc.), analyze changes (added/removed/modified), find OAuth-specific cookies, log details for debugging.
  - Methods:
    - captureCookies(): CookieInfo[] - collects cookie list (document.cookie fallback).
    - analyzeCookieChanges(currentCookies): CookieAnalysis - compare with previousCookies and return analysis.
    - captureAndAnalyze(): { cookies, analysis } - capture and compute analysis while updating previousCookies.
    - findOAuthCookies(cookies): splits cookies into state/session/other auth cookies by name heuristics.
    - logCookieInfo(cookies, title) - console.group logging of cookies with analysis.
    - logCookieAnalysis(analysis) - group logs about added/modified/removed.
    - reset() - clear previousCookies.
  - Side-effects: logging, reading document.cookie.
  - Who calls it: useMobileOAuth, useOAuthFlow, WebViewTest debug functions.

- oauthCookieCapture (singleton)

  - Purpose: single instance used across hooks and debug components.

- captureAndLogCookies / captureAndAnalyzeCookies
  - Convenience functions wrapping the class methods and logging.

### login-page.tsx

This is the UI used for login and is what the user attached. Key points:

- It imports useWebBrowser from hooks and API_BASE from config.
- Local state:
  - status: 'idle' | 'authenticating' | 'success' | 'error'
  - errorMessage: string
- It uses useWebBrowser(): const { openBrowser, isLoading, error: browserError }
  - This hook provides the openBrowser function used to start the flow.
- generateState()

  - Purpose: generate random 32-character state (same algorithm as generateOAuthState elsewhere).
  - Inputs: none; Output: string state
  - Called inside handleLogin

- handleLogin()

  - Purpose: start OAuth by generating state and opening browser to backend's mobile start endpoint.
  - Inputs: none
  - Output: void (initiates browser open)
  - Side-effects:
    - sets status to 'authenticating'
    - builds oauthUrl: `${API_BASE}/api/v1/oauth/mobile/start/github?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`
    - calls openBrowser(oauthUrl, { toolbarColor, showTitle })
    - logs the oauthUrl and state
  - Who calls it: button bindtap on the login UI and retry button.

- getStatusMessage(), getStatusColor()

  - Pure helpers for UI labeling

- isDisabled

  - Derived boolean to disable UI while loading or authenticating

- Browser error handling:
  - The hook `useWebBrowser` exposes `error: browserError`.
  - login-page listens to browser errors via the `browserError` variable (but it only renders `browserError` in the UI when `status === 'error'`).
  - Note: login-page doesn't currently call the token exchange or registerOAuthCallback itself; it relies on the app's deep link handling (AppWrapper or native code) and other hooks to perform exchange.

---

## High-level call flow (who calls who)

I'll produce two flows: "quick / default LoginPage flow" (how the UI triggers the OAuth start), and "complete mobile OAuth exchange flow" (how the pieces tie together across components & native).

1. Quick LoginPage -> open browser flow (what login-page.tsx implements)

- LoginPage (UI)
  - calls generateState() (local function) -> produces `state` string
  - constructs oauthUrl = `${API_BASE}/api/v1/oauth/mobile/start/github?state=...&redirect_uri=hextok://oauth/callback`
  - calls useWebBrowser().openBrowser(oauthUrl, options)
    - useWebBrowser.openBrowser -> getLynxWebBrowserModule() -> NativeModules.LynxWebBrowserModule.openBrowserAsync (native)
    - openBrowser sets isLoading, result, error in hook state
  - Result: Browser opens the URL. The OAuth provider flow runs in browser. On provider redirect back to the redirect_uri (custom scheme), native code receives deep link and stores result or routes to the app.

2. Complete Mobile OAuth flow (full client orchestration across hooks)

- LoginPage or other entrypoint generates state and calls openAuthSession/openBrowser to start. For the complete flow, typical orchestration can be:
  - App / LoginPage -> call LynxWebBrowser.startMobileOAuthFlow or useMobileOAuth.startOAuth
    - startMobileOAuthFlow (lynx-web-browser-api) constructs oauthStartUrl and calls openAuthSessionAsync (native)
    - OR useMobileOAuth.startOAuth calls openAuthSession (hook) which uses native module via useWebBrowserAuth
  - Native auth session opens hardware browser or custom tab; user authenticates on provider (GitHub)
  - Provider redirects to the redirect URI: hextok://oauth/callback?token=...&state=... (or native stores a JSON under LocalStorageModule key)
  - Native code handles deep link reception:
    - Strategy A (current repo approach): native code stores deep link data in LocalStorageModule under key `hextok_oauth_deeplink` (the `registerOAuthCallback` implementation polls LocalStorageModule for that key)
    - Strategy B: native code may call a JS native module callback (not used here)
  - JS side: registerOAuthCallback() polls LocalStorageModule for `hextok_oauth_deeplink`
    - When a value is found it:
      - parses JSON (or raw string) into MobileOAuthResult shape
      - calls provided callback(result) and removes stored key to avoid duplicate delivery
  - A listener/hook (useOAuthListener or useMobileOAuth or completeOAuthFlow) registered earlier receives the MobileOAuthResult:
    - If result.status === 'success' && result.token: call exchangeMobileToken(token, baseUrl)
      - exchangeMobileToken performs POST /api/v1/oauth/mobile/exchange -> returns MobileTokenExchangeResponse (session token, user info etc.)
    - On success, application stores session token (server likely sets cookie or returns a session token that app stores)
      - The code in useMobileOAuth or completeOAuthFlow will set isAuthenticated, sessionToken, possibly call onSuccess callback, or rely on server-set cookie/session handling
    - On error, hooks set appropriate error state and log.

3. registerOAuthCallback polling logic

- registerOAuthCallback(callback):
  - Polls NativeModules.LocalStorageModule.getStorageItem('hextok_oauth_deeplink') every 500ms
  - If key present:
    - Parses JSON or wraps raw string into normalized MobileOAuthResult shape
    - Calls callback(result)
    - Removes the key via LocalStorageModule.removeStorageItem('hextok_oauth_deeplink') to avoid repeated delivery
    - Stops polling and returns cleanup that clears interval
- Called by:
  - useOAuthListener (which exposes result to components)
  - completeOAuthFlow, which uses registerOAuthCallback then calls startMobileOAuthFlow

4. Token exchange endpoint and backend involvement

- exchangeMobileToken(token, baseUrl) calls POST `${baseUrl}/api/v1/oauth/mobile/exchange` with body { token }
  - Backend validates token, creates session, and returns session token or sets cookie
  - This step is done by hook (useMobileOAuth or completeOAuthFlow) after receiving the mobile token from deep-link result.

5. Cookie capture/analysis path (debug path)

- useOAuthFlow and useMobileOAuth use oauthCookieCapture to:
  - capture cookies before opening auth session
  - capture cookies after auth session completes
  - analyze added/modified/removed cookies for debugging (helps detect cookie isolation or missing session cookies)
- This is for troubleshooting (not required for functional flow).

6. Deep link helpers

- getLastDeepLink() / clearDeepLink() / hasDeepLink() exist to read/clear the last deep link stored by native modules (DeepLinkModule). They are utility helpers used by higher-level code or tests.

---

## Data shapes and key constants

- MobileOAuthResult (in typings):

  - status: 'success' | 'error'
  - token?: string (mobile temporary token)
  - userId?: number
  - state?: string
  - error?: string
  - errorDescription?: string

- MobileTokenExchangeRequest:

  - token: string

- MobileTokenExchangeResponse:

  - token (session token), user_id, session_id, etc. (exact shape depends on backend but code expects `token` and `user_id` at least)

- LocalStorage key: 'hextok_oauth_deeplink' used by `registerOAuthCallback` and native code.

- Redirect URI used in many places: 'hextok://oauth/callback' or custom scheme 'hextok://auth' (varies in hooks).

---

## Edge cases and notes (important for understanding behavior)

- Native module availability: getLynxWebBrowserModule() returns null if native module not found; hooks set errors accordingly. If missing, openBrowser/openAuthSession will set error and log guidance.

- Deep-link delivery model:

  - The repo uses a storage-polling strategy: native code stores deep link JSON in LocalStorageModule under a key. JS code polls LocalStorageModule to retrieve it (`registerOAuthCallback`). This is robust across reloads but depends on native code writing to that key.
  - If native code instead attempted to deliver an in-memory callback it could be lost during reload. The storage-based approach prevents that.

- CSRF state verification:

  - Hooks generate a `state` string and include it in the start URL. The code checks `result.state === state` in completeOAuthFlow before exchanging token for session. Some flows in repo show state being tracked in hook state.currentState — ensure actual verification occurs on exchange.

- Cancelled flows:

  - openAuthSession native callback may return a result.type not 'success' (cancel). Hooks detect that and set error message or consider flow cancelled.

- Token exchange network errors:

  - exchangeMobileToken throws on non-2xx; calling hooks catch and set error messages. Backend must return JSON with token.

- Cookie isolation:

  - On mobile, cookie isolation (custom tabs vs in-app webview) can cause session cookie not visible to app; repo includes cookie capture and token-exchange approach to work around this: exchange is done server-side with mobile token so app gets session token even if cookies are isolated.

- Storage API: registerOAuthCallback expects `LocalStorageModule.getStorageItem` to be available; if NativeModules.LocalStorageModule missing, registerOAuthCallback throws.

---

## Concise call-flow map (sequence)

1. User taps "Continue with GitHub" in `LoginPage` -> calls `handleLogin()`.
2. handleLogin:

   - generateState() -> stateString
   - oauthUrl built: `${API_BASE}/api/v1/oauth/mobile/start/github?state=...&redirect_uri=hextok://oauth/callback`
   - calls `openBrowser(oauthUrl, options)` (from `useWebBrowser()`)

3. useWebBrowser.openBrowser:

   - calls getLynxWebBrowserModule() -> native module -> openBrowserAsync(authUrl)
   - Browser opens; user authenticates on provider (GitHub).

4. Provider redirects to the custom scheme `hextok://oauth/callback?...` (or backend may redirect to an intermediate page that then issues a deep-link)

   - Native code intercepts the deep link and saves payload into `LocalStorageModule` under key `hextok_oauth_deeplink` (JSON or raw).

5. JS side (one of these listeners must be active):

   - registerOAuthCallback polling (used by `useOAuthListener`, `completeOAuthFlow`, or `useMobileOAuth`) reads LocalStorageModule.getStorageItem(OAUTH_DEEPLINK_KEY)
   - When data found, registerOAuthCallback parses into MobileOAuthResult and calls callback(result)

6. Listener callback (useMobileOAuth or completeOAuthFlow or useOAuthListener):

   - If result.status === 'success' && result.token present and (optionally) state matches:
     - call exchangeMobileToken(result.token, baseUrl) -> POST /api/v1/oauth/mobile/exchange
     - On success, backend returns session token -> client sets isAuthenticated/sessionToken or server sets cookie/session.
   - If error, set error state.

7. App now authenticated (session established via exchange or cookie).

---

## Where login-page.tsx sits in the graph

- `LoginPage` is minimal and triggers step 2 in the above call flow. It calls `useWebBrowser.openBrowser` (openBrowser that opens a URL but does not itself manage the exchange).
- The actual token-receive/exchange is implemented in `useMobileOAuth` / `completeOAuthFlow` / `registerOAuthCallback` / `exchangeMobileToken` — but `LoginPage` currently uses the simpler openBrowser path rather than the higher-level hook; the app includes the higher-level hooks which can be used to complete the flow in JS if desired.

---

## Recommendations (non-code, low-risk)

- If you want `LoginPage` to orchestrate the complete flow (and show success state), change `handleLogin` to:
  - generate state
  - call `completeOAuthFlow(state, API_BASE, 'hextok://oauth/callback')` (from lynx-web-browser-api.ts) which returns the exchange result promise and handles registerOAuthCallback internally. Or use `useMobileOAuth` hook in LoginPage to show progress and error/success states.
- Ensure native code writes deep-link payload into `LocalStorageModule` key `hextok_oauth_deeplink` (current JS expects that). If native uses a different key or direct callbacks, update `registerOAuthCallback` accordingly.
- Verify backend `/api/v1/oauth/mobile/exchange` returns JSON with `token`/`user_id` as expected by the client.
