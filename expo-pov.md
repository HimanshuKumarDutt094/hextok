# WebBrowser

_A library that provides access to the system's web browser and supports handling redirects._

Available on platforms android, ios, web

`expo-web-browser` provides access to the system's web browser and supports handling redirects. On Android, it uses `ChromeCustomTabs` and on iOS, it uses `SFSafariViewController` or `ASWebAuthenticationSession`, depending on the method you call. As of iOS 11, `SFSafariViewController` no longer shares cookies with Safari, so if you are using `WebBrowser` for authentication you will want to use `WebBrowser.openAuthSessionAsync`, and if you just want to open a webpage (such as your app privacy policy), then use `WebBrowser.openBrowserAsync`.

## Installation

```bash
$ npx expo install expo-web-browser
```

If you are installing this in an existing React Native app, make sure to install `expo` in your project.

## Configuration in app config

You can configure `expo-web-browser` using its built-in [config plugin](https://docs.expo.dev/config-plugins/introduction/) if you use config plugins in your project ([EAS Build](https://docs.expo.dev/build/introduction) or `npx expo run:[android|ios]`). The plugin allows you to configure a property that cannot be set at runtime and require building a new app binary to take effect.

```json app.json
{
  "expo": {
    "plugins": [
      [
        "expo-web-browser",
        {
          "experimentalLauncherActivity": true
        }
      ]
    ]
  }
}
```

### Configurable properties

| Name                           | Default | Description                                                                                                                                |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `experimentalLauncherActivity` | `false` | Only for: android. A boolean that enables a launcher activity to persist the system's web browser state when the app is in the background. |

## Usage

```jsx
import { useState } from "react";
import { Button, Text, View, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
/* @hide */
import Constants from "expo-constants";
/* @end */

export default function App() {
  const [result, setResult] = useState(null);

  const _handlePressButtonAsync = async () => {
    let result = await WebBrowser.openBrowserAsync("https://expo.dev");
    setResult(result);
  };
  return (
    <View style={styles.container}>
      <Button title="Open WebBrowser" onPress={_handlePressButtonAsync} />
      <Text>{result && JSON.stringify(result)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#ecf0f1",
  },
});
```

### Handling deep links from the WebBrowser

<Tabs>

<Tab label="With Expo Router">

If your project uses Expo Router, deep links are handled automatically.

</Tab>

<Tab label="Without Expo Router">

If you use the `WebBrowser` window for authentication or another use case where you want to pass information back into your app through a deep link, add a handler with `Linking.addEventListener` before opening the browser. When the listener fires, you should call [`dismissBrowser`](#webbrowserdismissbrowser). It will not automatically be dismissed when a deep link is handled. Aside from that, redirects from `WebBrowser` work the same as other deep links. Read more about it in [Linking](https://docs.expo.dev/linking/into-your-app/#handle-urls).

</Tab>

</Tabs>

## API

```js
import * as WebBrowser from "expo-web-browser";
```

## API: expo-web-browser

### WebBrowser Methods

#### coolDownAsync (_Function_)

- `coolDownAsync(browserPackage?: string): Promise<WebBrowserCoolDownResult>`
  This methods removes all bindings to services created by [`warmUpAsync`](#webbrowserwarmupasyncbrowserpackage)
  or [`mayInitWithUrlAsync`](#webbrowsermayinitwithurlasyncurl-browserpackage). You should call
  this method once you don't need them to avoid potential memory leaks. However, those binding
  would be cleared once your application is destroyed, which might be sufficient in most cases.
  Available on platform: android
  | Parameter | Type | Description |
  | --- | --- | --- |
  | `browserPackage` _(optional)_ | string | Package of browser to be cooled. If not set, preferred browser will be used. |
  Returns: The promise which fulfils with ` WebBrowserCoolDownResult` when cooling is performed, or
  an empty object when there was no connection to be dismissed.

#### dismissAuthSession (_Function_)

- `dismissAuthSession()`
  Dismisses the current authentication session. On web, it will close the popup window associated with auth process.
  Available on platforms: ios, web
  Returns: The `void` on the successful attempt or throws an error if dismiss functionality is not available.

#### dismissBrowser (_Function_)

- `dismissBrowser(): Promise<{ type: WebBrowserResultType.DISMISS }>`
  Dismisses the presented web browser.
  Available on platform: ios
  Returns: The promise that resolves with `{ type: 'dismiss' }` on the successful attempt or throws an error if dismiss functionality is not available.

#### getCustomTabsSupportingBrowsersAsync (_Function_)

- `getCustomTabsSupportingBrowsersAsync(): Promise<WebBrowserCustomTabsResults>`
  Returns a list of applications package names supporting Custom Tabs, Custom Tabs
  service, user chosen and preferred one. This may not be fully reliable, since it uses
  `PackageManager.getResolvingActivities` under the hood. (For example, some browsers might not be
  present in browserPackages list once another browser is set to default.)
  Available on platform: android
  Returns: The promise which fulfils with [`WebBrowserCustomTabsResults`](#webbrowsercustomtabsresults) object.

#### maybeCompleteAuthSession (_Function_)

- `maybeCompleteAuthSession(options: WebBrowserCompleteAuthSessionOptions): WebBrowserCompleteAuthSessionResult`
  Possibly completes an authentication session on web in a window popup. The method
  should be invoked on the page that the window redirects to.
  Available on platform: web
  | Parameter | Type | Description |
  | --- | --- | --- |
  | `options` | WebBrowserCompleteAuthSessionOptions | - |
  Returns: Returns an object with message about why the redirect failed or succeeded:

  If `type` is set to `failed`, the reason depends on the message:

  - `Not supported on this platform`: If the platform doesn't support this method (Android, iOS).
  - `Cannot use expo-web-browser in a non-browser environment`: If the code was executed in an SSR
    or node environment.
  - `No auth session is currently in progress`: (the cached state wasn't found in local storage).
    This can happen if the window redirects to an origin (website) that is different to the initial
    website origin. If this happens in development, it may be because the auth started on localhost
    and finished on your computer port (Ex: `128.0.0.*`). This is controlled by the `redirectUrl`
    and `returnUrl`.
  - `Current URL "<URL>" and original redirect URL "<URL>" do not match`: This can occur when the
    redirect URL doesn't match what was initial defined as the `returnUrl`. You can skip this test
    in development by passing `{ skipRedirectCheck: true }` to the function.

  If `type` is set to `success`, the parent window will attempt to close the child window immediately.

  If the error `ERR_WEB_BROWSER_REDIRECT` was thrown, it may mean that the parent window was
  reloaded before the auth was completed. In this case you'll need to close the child window manually.

#### mayInitWithUrlAsync (_Function_)

- `mayInitWithUrlAsync(url: string, browserPackage?: string): Promise<WebBrowserMayInitWithUrlResult>`
  This method initiates (if needed) [CustomTabsSession](https://developer.android.com/reference/android/support/customtabs/CustomTabsSession.html#maylaunchurl)
  and calls its `mayLaunchUrl` method for browser specified by the package.
  Available on platform: android
  | Parameter | Type | Description |
  | --- | --- | --- |
  | `url` | string | The url of page that is likely to be loaded first when opening browser. |
  | `browserPackage` _(optional)_ | string | Package of browser to be informed. If not set, preferred<br>browser will be used. |
  Returns: A promise which fulfils with `WebBrowserMayInitWithUrlResult` object.

#### openAuthSessionAsync (_Function_)

- `openAuthSessionAsync(url: string, redirectUrl?: null | string, options: AuthSessionOpenOptions): Promise<WebBrowserAuthSessionResult>`

  # On Android:

  This will be done using a "custom Chrome tabs" browser, [AppState](https://reactnative.dev/docs/appstate),
  and [Linking](./linking/) APIs.

  # On iOS:

  Opens the url with Safari in a modal using `ASWebAuthenticationSession`. The user will be asked
  whether to allow the app to authenticate using the given url.
  To handle redirection back to the mobile application, the redirect URI set in the authentication server
  has to use the protocol provided as the scheme in **app.json** [`expo.scheme`](./../config/app/#scheme).
  For example, `demo://` not `https://` protocol.
  Using `Linking.addEventListener` is not needed and can have side effects.

  # On web:

  > This API can only be used in a secure environment (localhost/https).
  > to test this. Otherwise, an error with code [`ERR_WEB_BROWSER_CRYPTO`](#err_web_browser_crypto) will be thrown.
  > This will use the browser's [`window.open()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) API.

  - _Desktop_: This will create a new web popup window in the browser that can be closed later using `WebBrowser.maybeCompleteAuthSession()`.
  - _Mobile_: This will open a new tab in the browser which can be closed using `WebBrowser.maybeCompleteAuthSession()`.

  How this works on web:

  - A crypto state will be created for verifying the redirect.
    - This means you need to run with `npx expo start --https`
  - The state will be added to the window's `localstorage`. This ensures that auth cannot complete
    unless it's done from a page running with the same origin as it was started.
    Ex: if `openAuthSessionAsync` is invoked on `https://localhost:19006`, then `maybeCompleteAuthSession`
    must be invoked on a page hosted from the origin `https://localhost:19006`. Using a different
    website, or even a different host like `https://128.0.0.*:19006` for example will not work.
  - A timer will be started to check for every 1000 milliseconds (1 second) to detect if the window
    has been closed by the user. If this happens then a promise will resolve with `{ type: 'dismiss' }`.

  > On mobile web, Chrome and Safari will block any call to [`window.open()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
  > which takes too long to fire after a user interaction. This method must be invoked immediately
  > after a user interaction. If the event is blocked, an error with code [`ERR_WEB_BROWSER_BLOCKED`](#err_web_browser_blocked) will be thrown.
  > | Parameter | Type | Description |
  > | --- | --- | --- |
  > | `url` | string | The url to open in the web browser. This should be a login page. |
  > | `redirectUrl` _(optional)_ | null \| string | _Optional_ - The url to deep link back into your app.<br>On web, this defaults to the output of [`Linking.createURL("")`](./linking/#linkingcreateurlpath-namedparameters). |
  > | `options` | AuthSessionOpenOptions | _Optional_ - An object extending the [`WebBrowserOpenOptions`](#webbrowseropenoptions).<br>If there is no native AuthSession implementation available (which is the case on Android)<br>these params will be used in the browser polyfill. If there is a native AuthSession implementation,<br>these params will be ignored. |
  > Returns: - If the user does not permit the application to authenticate with the given url, the Promise fulfills with `{ type: 'cancel' }` object.

  - If the user closed the web browser, the Promise fulfills with `{ type: 'cancel' }` object.
  - If the browser is closed using [`dismissBrowser`](#webbrowserdismissbrowser),
    the Promise fulfills with `{ type: 'dismiss' }` object.

#### openBrowserAsync (_Function_)

- `openBrowserAsync(url: string, browserParams: WebBrowserOpenOptions): Promise<WebBrowserResult>`
  Opens the url with Safari in a modal on iOS using [`SFSafariViewController`](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller),
  and Chrome in a new [custom tab](https://developer.chrome.com/multidevice/android/customtabs)
  on Android. On iOS, the modal Safari will not share cookies with the system Safari. If you need
  this, use [`openAuthSessionAsync`](#webbrowseropenauthsessionasyncurl-redirecturl-options).
  | Parameter | Type | Description |
  | --- | --- | --- |
  | `url` | string | The url to open in the web browser. |
  | `browserParams` | WebBrowserOpenOptions | A dictionary of key-value pairs. |
  Returns: The promise behaves differently based on the platform.
  On Android promise resolves with `{ type: 'opened' }` if we were able to open browser.
  On iOS:
  - If the user closed the web browser, the Promise resolves with `{ type: 'cancel' }`.
  - If the browser is closed using [`dismissBrowser`](#webbrowserdismissbrowser), the Promise resolves with `{ type: 'dismiss' }`.

#### warmUpAsync (_Function_)

- `warmUpAsync(browserPackage?: string): Promise<WebBrowserWarmUpResult>`
  This method calls `warmUp` method on [CustomTabsClient](<https://developer.android.com/reference/android/support/customtabs/CustomTabsClient.html#warmup(long)>)
  for specified package.
  Available on platform: android
  | Parameter | Type | Description |
  | --- | --- | --- |
  | `browserPackage` _(optional)_ | string | Package of browser to be warmed up. If not set, preferred browser will be warmed. |
  Returns: A promise which fulfils with `WebBrowserWarmUpResult` object.

### Types

#### AuthSessionOpenOptions (_Type_)

If there is no native AuthSession implementation available (which is the case on Android) the params inherited from
[`WebBrowserOpenOptions`](#webbrowseropenoptions) will be used in the browser polyfill. Otherwise, the browser parameters will be ignored.
| Property | Type | Description |
| --- | --- | --- |
| `preferEphemeralSession` _(optional)_ | boolean | Determines whether the session should ask the browser for a private authentication session.<br>Set this to `true` to request that the browser doesn’t share cookies or other browsing data between the authentication session and the user’s normal browser session.<br>Whether the request is honored depends on the user’s default web browser. Default: `false` Available on platform: ios |

#### WebBrowserAuthSessionResult (_Type_)

Type: WebBrowserRedirectResult | WebBrowserResult

#### WebBrowserCompleteAuthSessionOptions (_Type_)

| Property                         | Type    | Description                                                                                               |
| -------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `skipRedirectCheck` _(optional)_ | boolean | Attempt to close the window without checking to see if the auth redirect matches the cached redirect URL. |

#### WebBrowserCompleteAuthSessionResult (_Type_)

| Property  | Type                  | Description                                        |
| --------- | --------------------- | -------------------------------------------------- |
| `message` | string                | Additional description or reasoning of the result. |
| `type`    | 'success' \| 'failed' | Type of the result.                                |

#### WebBrowserCoolDownResult (_Type_)

Type: ServiceActionResult

#### WebBrowserCustomTabsResults (_Type_)

| Property                               | Type     | Description                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `browserPackages`                      | string[] | All packages recognized by `PackageManager` as capable of handling Custom Tabs. Empty array<br>means there is no supporting browsers on device.                                                                                                                                                                                                                                                            |
| `defaultBrowserPackage` _(optional)_   | string   | Default package chosen by user, `null` if there is no such packages. Also `null` usually means,<br>that user will be prompted to choose from available packages.                                                                                                                                                                                                                                           |
| `preferredBrowserPackage` _(optional)_ | string   | Package preferred by `CustomTabsClient` to be used to handle Custom Tabs. It favors browser<br>chosen by user as default, as long as it is present on both `browserPackages` and<br>`servicePackages` lists. Only such browsers are considered as fully supporting Custom Tabs.<br>It might be `null` when there is no such browser installed or when default browser is not in<br>`servicePackages` list. |
| `servicePackages`                      | string[] | All packages recognized by `PackageManager` as capable of handling Custom Tabs Service.<br>This service is used by [`warmUpAsync`](#webbrowserwarmupasyncbrowserpackage), [`mayInitWithUrlAsync`](#webbrowsermayinitwithurlasyncurl-browserpackage)<br>and [`coolDownAsync`](#webbrowsercooldownasyncbrowserpackage).                                                                                      |

#### WebBrowserMayInitWithUrlResult (_Type_)

Type: ServiceActionResult

#### WebBrowserOpenOptions (_Type_)

| Property                                  | Type                               | Description                                                                                                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `browserPackage` _(optional)_             | string                             | Package name of a browser to be used to handle Custom Tabs. List of<br>available packages is to be queried by [`getCustomTabsSupportingBrowsers`](#webbrowsergetcustomtabssupportingbrowsersasync) method. Available on platform: android       |
| `controlsColor` _(optional)_              | string                             | Tint color for controls in SKSafariViewController. Supports React Native [color formats](https://reactnative.dev/docs/colors). Available on platform: ios                                                                                       |
| `createTask` _(optional)_                 | boolean                            | A boolean determining whether the browser should open in a new task or in<br>the same task as your app. Default: `true` Available on platform: android                                                                                          |
| `dismissButtonStyle` _(optional)_         | 'done' \| 'close' \| 'cancel'      | The style of the dismiss button. Should be one of: `done`, `close`, or `cancel`. Available on platform: ios                                                                                                                                     |
| `enableBarCollapsing` _(optional)_        | boolean                            | A boolean determining whether the toolbar should be hiding when a user scrolls the website.                                                                                                                                                     |
| `enableDefaultShareMenuItem` _(optional)_ | boolean                            | A boolean determining whether a default share item should be added to the menu. Available on platform: android                                                                                                                                  |
| `presentationStyle` _(optional)_          | WebBrowserPresentationStyle        | The [presentation style](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle)<br>of the browser window. Default: `WebBrowser.WebBrowserPresentationStyle.OverFullScreen` Available on platform: ios |
| `readerMode` _(optional)_                 | boolean                            | A boolean determining whether Safari should enter Reader mode, if it is available. Available on platform: ios                                                                                                                                   |
| `secondaryToolbarColor` _(optional)_      | string                             | Color of the secondary toolbar. Supports React Native [color formats](https://reactnative.dev/docs/colors). Available on platform: android                                                                                                      |
| `showInRecents` _(optional)_              | boolean                            | A boolean determining whether browsed website should be shown as separate<br>entry in Android recents/multitasking view. Requires `createTask` to be `true` (default). Default: `false` Available on platform: android                          |
| `showTitle` _(optional)_                  | boolean                            | A boolean determining whether the browser should show the title of website on the toolbar. Available on platform: android                                                                                                                       |
| `toolbarColor` _(optional)_               | string                             | Color of the toolbar. Supports React Native [color formats](https://reactnative.dev/docs/colors).                                                                                                                                               |
| `windowFeatures` _(optional)_             | string \| WebBrowserWindowFeatures | Features to use with `window.open()`. Available on platform: web                                                                                                                                                                                |
| `windowName` _(optional)_                 | string                             | Name to assign to the popup window. Available on platform: web                                                                                                                                                                                  |

#### WebBrowserRedirectResult (_Type_)

| Property | Type      | Description         |
| -------- | --------- | ------------------- |
| `type`   | 'success' | Type of the result. |
| `url`    | string    | -                   |

#### WebBrowserResult (_Type_)

| Property | Type                 | Description         |
| -------- | -------------------- | ------------------- |
| `type`   | WebBrowserResultType | Type of the result. |

#### WebBrowserWarmUpResult (_Type_)

Type: ServiceActionResult

#### WebBrowserWindowFeatures (_Type_)

Type: Record<string, number | boolean | string>

### Enums

#### WebBrowserPresentationStyle (_Enum_)

A browser presentation style. Its values are directly mapped to the [`UIModalPresentationStyle`](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle).
Available on platform: ios

#### Members

- `AUTOMATIC` — The default presentation style chosen by the system.
  On older iOS versions, falls back to `WebBrowserPresentationStyle.FullScreen`.
- `CURRENT_CONTEXT` — A presentation style where the browser is displayed over the app's content.
- `FORM_SHEET` — A presentation style that displays the browser centered in the screen.
- `FULL_SCREEN` — A presentation style in which the presented browser covers the screen.
- `OVER_CURRENT_CONTEXT` — A presentation style where the browser is displayed over the app's content.
- `OVER_FULL_SCREEN` — A presentation style in which the browser view covers the screen.
- `PAGE_SHEET` — A presentation style that partially covers the underlying content.
- `POPOVER` — A presentation style where the browser is displayed in a popover view.

#### WebBrowserResultType (_Enum_)

#### Members

- `CANCEL`
- `DISMISS`
- `LOCKED`
- `OPENED`

## Error codes

### `ERR_WEB_BROWSER_REDIRECT`

**Web only:** The window cannot complete the redirect request because the invoking window doesn't have a reference to its parent. This can happen if the parent window was reloaded.

### `ERR_WEB_BROWSER_BLOCKED`

**Web only:** The popup window was blocked by the browser or failed to open. This can happen in mobile browsers when the `window.open()` method was invoked too long after a user input was fired.

Mobile browsers do this to prevent malicious websites from opening many unwanted popups on mobile.

You're method can still run in an async function but there cannot be any long running tasks before it. You can use hooks to disable user-inputs until any other processes have finished loading.

### `ERR_WEB_BROWSER_CRYPTO`

**Web only:** The current environment doesn't support crypto. Ensure you are running from a secure origin (localhost/https).
