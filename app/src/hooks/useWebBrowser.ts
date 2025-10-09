// useWebBrowser.ts
// React hooks for LynxJS WebBrowser functionality
// Provides easy-to-use hooks for browser operations in React components

import { useState, useCallback, useRef, useEffect } from '@lynx-js/react';
import { registerOAuthCallback } from '../lynx-web-browser-api';
import type {
  WebBrowserOpenOptions,
  AuthSessionOpenOptions,
  WebBrowserResult,
  WebBrowserAuthSessionResult,
  WebBrowserCustomTabsResults,
  MobileOAuthResult,
  MobileTokenExchangeResponse,
} from '../rspeedy-env';

// LynxJS element ref type
type LynxElementRef = HTMLElement | null;

// LynxJS native module interface
interface LynxWebBrowserModuleInterface {
  openBrowserAsync: (
    url: string,
    options: WebBrowserOpenOptions,
    callback: (error: string | null, result?: WebBrowserResult) => void,
  ) => void;
  dismissBrowser: (
    callback: (error: string | null, result?: WebBrowserResult) => void,
  ) => void;
  openAuthSessionAsync: (
    authUrl: string,
    redirectUrl: string,
    options: AuthSessionOpenOptions,
    callback: (
      error: string | null,
      result?: WebBrowserAuthSessionResult,
    ) => void,
  ) => void;
  dismissAuthSession: () => void;
  getCustomTabsSupportingBrowsersAsync: (
    callback: (
      error: string | null,
      result?: WebBrowserCustomTabsResults,
    ) => void,
  ) => void;
  warmUpAsync: (browserPackage: string | null, callback: () => void) => void;
  coolDownAsync: (browserPackage: string | null, callback: () => void) => void;
  mayInitWithUrlAsync: (
    url: string,
    browserPackage: string | null,
    callback: () => void,
  ) => void;
}

// LynxJS selector query types
interface LynxSelectorQuery {
  select(selector: HTMLElement | string): LynxSelectorQuery;
  exec(callback: (results: LynxElementResult[]) => void): void;
}

interface LynxElementResult {
  goBack(params: Record<string, unknown>): void;
  goForward(params: Record<string, unknown>): void;
  reload(params: Record<string, unknown>): void;
  loadUrl(params: { url: string }): void;
  getCurrentUrl(
    params: Record<string, unknown>,
    callback: (url: string) => void,
  ): void;
}

interface LynxGlobal {
  createSelectorQuery(): LynxSelectorQuery;
  requireNativeModule?: (name: string) => LynxWebBrowserModuleInterface;
}

// Declare lynx global
declare const lynx: LynxGlobal;

// Helper: resolve the native LynxWebBrowser module in a safe way.
// Tries different access patterns for LynxJS native modules
function getLynxWebBrowserModule(): LynxWebBrowserModuleInterface | null {
  try {
    // Method 1: Use global NativeModules object (declared in rspeedy-env.d.ts)
    // This is the primary way to access native modules in LynxJS

    if (
      typeof NativeModules !== 'undefined' &&
      NativeModules?.LynxWebBrowserModule
    ) {
      return NativeModules.LynxWebBrowserModule as LynxWebBrowserModuleInterface;
    }

    // Method 2: Try lynx.requireNativeModule (background scripting environments)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((lynx as any)?.requireNativeModule) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const module = (lynx as any).requireNativeModule('LynxWebBrowserModule');
      if (module) return module as LynxWebBrowserModuleInterface;
    }

    // Method 3: Try via globalThis (some LynxJS environments)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalNM = (globalThis as any)?.NativeModules;
    if (globalNM && globalNM.LynxWebBrowserModule) {
      return globalNM.LynxWebBrowserModule as LynxWebBrowserModuleInterface;
    }

    // No native module found
    return null;
  } catch {
    return null;
  }
}

// Event detail interfaces for WebView
export interface WebViewLoadEvent {
  detail: {
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
    title?: string;
  };
}

export interface WebViewErrorEvent {
  detail: {
    url: string;
    code: number;
    description: string;
  };
}

export interface WebViewNavigationEvent {
  detail: {
    url: string;
    navigationType:
      | 'linkClicked'
      | 'formSubmitted'
      | 'backForward'
      | 'reload'
      | 'formResubmitted'
      | 'other';
  };
}

export interface WebViewRedirectEvent {
  detail: {
    url: string;
    type: 'success';
  };
}

/**
 * Hook for opening URLs in the system browser
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { openBrowser, isLoading, result, error } = useWebBrowser();
 *
 *   const handlePress = () => {
 *     openBrowser('https://example.com', {
 *       toolbarColor: '#007AFF',
 *       showTitle: true
 *     });
 *   };
 *
 *   return (
 *     <view bindtap={handlePress}>
 *       <text>{isLoading ? 'Opening...' : 'Open Browser'}</text>
 *       {error && <text>Error: {error}</text>}
 *     </view>
 *   );
 * }
 * ```
 */
export function useWebBrowser() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WebBrowserResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openBrowser = useCallback(
    async (url: string, options: WebBrowserOpenOptions = {}) => {
      'background only';

      try {
        setIsLoading(true);
        setError(null);

        const LynxWebBrowserModule = getLynxWebBrowserModule();
        if (LynxWebBrowserModule) {
          LynxWebBrowserModule.openBrowserAsync(
            url,
            options,
            (error: string | null, result?: WebBrowserResult) => {
              'background only';
              setIsLoading(false);
              if (error) {
                setError(error);
              } else if (result) {
                setResult(result);
                // Handle browser dismissal/cancellation as an error state
                if (result.type === 'cancel' || result.type === 'dismiss') {
                  setError('Browser was closed');
                }
              }
            },
          );
        } else {
          setIsLoading(false);
          setError(
            'LynxWebBrowserModule not available. Make sure the native module is registered in MainApplication.kt',
          );
          console.error('LynxWebBrowserModule not found. Check:', {
            NativeModules:
              typeof NativeModules !== 'undefined'
                ? Object.keys(NativeModules)
                : 'undefined',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lynxRequireNativeModule: typeof (lynx as any)?.requireNativeModule,
          });
        }
      } catch {
        setIsLoading(false);
        setError('Unknown error');
      }
    },
    [],
  );

  const dismissBrowser = useCallback(async () => {
    'background only';

    try {
      const LynxWebBrowserModule = getLynxWebBrowserModule();
      if (LynxWebBrowserModule) {
        LynxWebBrowserModule.dismissBrowser(
          (error: string | null, result?: WebBrowserResult) => {
            'background only';
            if (error) {
              setError(error);
            } else if (result) {
              setResult(result);
            }
          },
        );
      } else {
        setError(
          'LynxWebBrowserModule not available. Make sure the native module is registered in MainApplication.kt',
        );
      }
    } catch {
      setError('Unknown error');
    }
  }, []);

  const openContent = useCallback(
    async (url: string, options: WebBrowserOpenOptions = {}) => {
      'background only';

      return openBrowser(url, {
        showTitle: true,
        enableDefaultShareMenuItem: true,
        ...options,
      });
    },
    [openBrowser],
  );

  return {
    openBrowser,
    dismissBrowser,
    openContent,
    isLoading,
    result,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for OAuth authentication flows
 *
 * @example
 * ```tsx
 * function AuthComponent() {
 *   const { openAuthSession, isLoading, result, error } = useWebBrowserAuth();
 *
 *   const handleLogin = () => {
 *     openAuthSession(
 *       'https://auth.example.com/login',
 *       'myapp://callback',
 *       { preferEphemeralSession: true }
 *     );
 *   };
 *
 *   return (
 *     <view bindtap={handleLogin}>
 *       <text>{isLoading ? 'Authenticating...' : 'Login'}</text>
 *       {result?.type === 'success' && (
 *         <text>Success! Redirect URL: {result.url}</text>
 *       )}
 *     </view>
 *   );
 * }
 * ```
 */
export function useWebBrowserAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WebBrowserAuthSessionResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const openAuthSession = useCallback(
    async (
      authUrl: string,
      redirectUrl: string,
      options: AuthSessionOpenOptions = {},
    ) => {
      'background only';

      try {
        setIsLoading(true);
        setError(null);

        const LynxWebBrowserModule = getLynxWebBrowserModule();
        if (LynxWebBrowserModule) {
          LynxWebBrowserModule.openAuthSessionAsync(
            authUrl,
            redirectUrl,
            options,
            (error: string | null, result?: WebBrowserAuthSessionResult) => {
              'background only';
              setIsLoading(false);
              if (error) {
                setError(error);
              } else if (result) {
                setResult(result);
              }
            },
          );
        } else {
          setIsLoading(false);
          setError(
            'LynxWebBrowserModule not available. Make sure the native module is registered in MainApplication.kt',
          );
        }
      } catch {
        setIsLoading(false);
        setError('Unknown error');
      }
    },
    [],
  );

  const openOAuth = useCallback(
    async (
      authUrl: string,
      redirectUrl: string,
      options: AuthSessionOpenOptions = {},
    ) => {
      'background only';

      return openAuthSession(authUrl, redirectUrl, {
        preferEphemeralSession: true,
        ...options,
      });
    },
    [openAuthSession],
  );

  const dismissAuth = useCallback(() => {
    'background only';

    try {
      const LynxWebBrowserModule = getLynxWebBrowserModule();
      if (LynxWebBrowserModule) {
        LynxWebBrowserModule.dismissAuthSession();
        setResult(null);
      } else {
        throw new Error('LynxWebBrowserModule not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return {
    openAuthSession,
    openOAuth,
    dismissAuth,
    isLoading,
    result,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for managing Custom Tabs (Android-specific functionality)
 *
 * @example
 * ```tsx
 * function CustomTabsComponent() {
 *   const {
 *     warmUp,
 *     coolDown,
 *     preloadUrl,
 *     getSupportedBrowsers,
 *     isSupported
 *   } = useCustomTabs();
 *
 *   const optimizedBrowse = async () => {
 *     await warmUp();
 *     await preloadUrl('https://example.com');
 *     // Browser will open faster now
 *   };
 *
 *   return (
 *     <view>
 *       <text>Custom Tabs Supported: {isSupported ? 'Yes' : 'No'}</text>
 *       <view bindtap={optimizedBrowse}>
 *         <text>Optimized Browse</text>
 *       </view>
 *     </view>
 *   );
 * }
 * ```
 */
export function useCustomTabs() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [supportedBrowsers, setSupportedBrowsers] =
    useState<WebBrowserCustomTabsResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSupportedBrowsers = useCallback(async () => {
    'background only';

    try {
      setIsLoading(true);
      const LynxWebBrowserModule = getLynxWebBrowserModule();
      if (LynxWebBrowserModule) {
        LynxWebBrowserModule.getCustomTabsSupportingBrowsersAsync(
          (error: string | null, result?: WebBrowserCustomTabsResults) => {
            'background only';
            setIsLoading(false);
            if (!error && result) {
              setSupportedBrowsers(result);
              setIsSupported(result.servicePackages.length > 0);
            } else {
              setIsSupported(false);
            }
          },
        );
      } else {
        setIsLoading(false);
        setIsSupported(false);
      }
    } catch {
      setIsLoading(false);
      setIsSupported(false);
    }
  }, []);

  const warmUp = useCallback(async (browserPackage?: string) => {
    'background only';
    const LynxWebBrowserModule = getLynxWebBrowserModule();
    if (LynxWebBrowserModule) {
      LynxWebBrowserModule.warmUpAsync(browserPackage || null, () => {});
    }
  }, []);

  const coolDown = useCallback(async (browserPackage?: string) => {
    'background only';
    const LynxWebBrowserModule = getLynxWebBrowserModule();
    if (LynxWebBrowserModule) {
      LynxWebBrowserModule.coolDownAsync(browserPackage || null, () => {});
    }
  }, []);

  const preloadUrl = useCallback(
    async (url: string, browserPackage?: string) => {
      'background only';
      const LynxWebBrowserModule = getLynxWebBrowserModule();
      if (LynxWebBrowserModule) {
        LynxWebBrowserModule.mayInitWithUrlAsync(
          url,
          browserPackage || null,
          () => {},
        );
      }
    },
    [],
  );

  // Check support on mount
  useEffect(() => {
    getSupportedBrowsers().catch(() => {
      // Ignore errors, just mark as not supported
      setIsSupported(false);
    });
  }, [getSupportedBrowsers]);

  return {
    warmUp,
    coolDown,
    preloadUrl,
    getSupportedBrowsers,
    isSupported,
    supportedBrowsers,
    isLoading,
  };
}

/**
 * Hook for managing embedded WebView state
 *
 * @example
 * ```tsx
 * function WebViewComponent() {
 *   const {
 *     webViewRef,
 *     currentUrl,
 *     canGoBack,
 *     canGoForward,
 *     goBack,
 *     goForward,
 *     reload
 *   } = useWebView();
 *
 *   return (
 *     <view>
 *       <web-view
 *         ref={webViewRef}
 *         src="https://example.com"
 *         bindload={handleLoad}
 *         binderror={handleError}
 *       />
 *       <view style={{ flexDirection: 'row' }}>
 *         <view bindtap={goBack} style={{ opacity: canGoBack ? 1 : 0.5 }}>
 *           <text>← Back</text>
 *         </view>
 *         <view bindtap={goForward} style={{ opacity: canGoForward ? 1 : 0.5 }}>
 *           <text>Forward →</text>
 *         </view>
 *         <view bindtap={reload}>
 *           <text>⟳ Reload</text>
 *         </view>
 *       </view>
 *     </view>
 *   );
 * }
 * ```
 */
export function useWebView() {
  const webViewRef = useRef<LynxElementRef>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const goBack = useCallback(() => {
    'background only';

    if (webViewRef.current && canGoBack) {
      // Use LynxJS selector query pattern
      lynx
        .createSelectorQuery()
        .select(webViewRef.current)
        .exec((res: LynxElementResult[]) => {
          if (res[0]) {
            res[0].goBack({});
          }
        });
    }
  }, [canGoBack]);

  const goForward = useCallback(() => {
    'background only';

    if (webViewRef.current && canGoForward) {
      lynx
        .createSelectorQuery()
        .select(webViewRef.current)
        .exec((res: LynxElementResult[]) => {
          if (res[0]) {
            res[0].goForward({});
          }
        });
    }
  }, [canGoForward]);

  const reload = useCallback(() => {
    'background only';

    if (webViewRef.current) {
      lynx
        .createSelectorQuery()
        .select(webViewRef.current)
        .exec((res: LynxElementResult[]) => {
          if (res[0]) {
            res[0].reload({});
          }
        });
    }
  }, []);

  const loadUrl = useCallback((url: string) => {
    'background only';

    if (webViewRef.current) {
      lynx
        .createSelectorQuery()
        .select(webViewRef.current)
        .exec((res: LynxElementResult[]) => {
          if (res[0]) {
            res[0].loadUrl({ url });
          }
        });
    }
  }, []);

  const getCurrentUrl = useCallback(() => {
    'background only';

    if (webViewRef.current) {
      lynx
        .createSelectorQuery()
        .select(webViewRef.current)
        .exec((res: LynxElementResult[]) => {
          if (res[0]) {
            res[0].getCurrentUrl({}, (result: string) => {
              setCurrentUrl(result);
            });
          }
        });
    }
  }, []);

  const handleLoad = useCallback((event: WebViewLoadEvent) => {
    'background only';

    const { url, canGoBack: back, canGoForward: forward } = event.detail;
    setCurrentUrl(url);
    setCanGoBack(back);
    setCanGoForward(forward);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((event: WebViewErrorEvent) => {
    'background only';

    console.error('WebView error:', event.detail);
    setIsLoading(false);
  }, []);

  const handleNavigation = useCallback(() => {
    'background only';

    setIsLoading(true);
  }, []);

  return {
    webViewRef,
    currentUrl,
    canGoBack,
    canGoForward,
    isLoading,
    goBack,
    goForward,
    reload,
    loadUrl,
    getCurrentUrl,
    // Event handlers to bind to web-view
    handleLoad,
    handleError,
    handleNavigation,
  };
}

/**
 * Hook for managing mobile OAuth flows
 * Integrates with your mobile_handlers.go backend
 *
 * @example
 * ```tsx
 * function OAuth() {
 *   const {
 *     startOAuth,
 *     isLoading,
 *     result,
 *     error,
 *     exchangeToken
 *   } = useMobileOAuth({
 *     baseUrl: 'https://your-backend.com',
 *     onSuccess: (exchangeResult) => {
 *       console.log('OAuth successful:', exchangeResult);
 *       // User is now authenticated
 *     },
 *     onError: (error) => {
 *       console.error('OAuth failed:', error);
 *     }
 *   });
 *
 *   const handleLogin = () => {
 *     startOAuth(); // Generates state automatically
 *   };
 *
 *   return (
 *     <view bindtap={handleLogin}>
 *       <text>{isLoading ? 'Authenticating...' : 'Login with GitHub'}</text>
 *       {error && <text>Error: {error}</text>}
 *     </view>
 *   );
 * }
 * ```
 */
export function useMobileOAuth(
  options: {
    baseUrl?: string;
    redirectUri?: string;
    onSuccess?: (result: MobileTokenExchangeResponse) => void;
    onError?: (error: string) => void;
  } = {},
) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MobileOAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<string | null>(null);

  const {
    baseUrl = '',
    redirectUri = 'hextok://oauth/callback',
    onError,
  } = options;

  // Generate a random state for OAuth security
  const generateState = useCallback(() => {
    'background only';

    // Simple random string generator for OAuth state
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // We no longer rely on a native OAuthResultModule.
  // OAuth deep link data is stored to LocalStorageModule under the key
  // 'hextok_oauth_deeplink' by native code when the app receives a deep link.
  // useWebBrowser's OAuth flow will rely on higher-level helpers (e.g. registerOAuthCallback)
  // exported from `lynx-web-browser-api.ts` to consume that stored data.

  // Exchange mobile token for session
  const exchangeToken = useCallback(
    async (token: string): Promise<MobileTokenExchangeResponse> => {
      'background only';

      const exchangeUrl = `${baseUrl}/api/v1/oauth/mobile/exchange`;

      try {
        const response = await fetch(exchangeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Token exchange failed: ${response.status} ${errorText}`,
          );
        }

        const exchangeResult: MobileTokenExchangeResponse =
          await response.json();
        return exchangeResult;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error exchanging token';
        throw new Error(`Failed to exchange mobile token: ${errorMsg}`);
      }
    },
    [baseUrl],
  );

  // Start the OAuth flow
  const startOAuth = useCallback(
    async (customState?: string) => {
      'background only';

      try {
        setIsLoading(true);
        setError(null);
        setResult(null);

        const state = customState || generateState();
        setCurrentState(state);

        // We no longer register a native callback here. Native code stores the
        // deep link payload in `LocalStorageModule` under the key
        // 'hextok_oauth_deeplink'. A separate listener (e.g. registerOAuthCallback)
        // will poll storage and handle token exchange. Here we only open the
        // auth session and wait for that external flow to complete.

        // Start the OAuth flow by opening the browser
        const LynxWebBrowserModule = getLynxWebBrowserModule();
        if (!LynxWebBrowserModule) {
          throw new Error('LynxWebBrowserModule not available');
        }

        const oauthStartUrl = `${baseUrl}/api/v1/oauth/mobile/start/github?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

        LynxWebBrowserModule.openAuthSessionAsync(
          oauthStartUrl,
          redirectUri,
          {
            preferEphemeralSession: true,
            showTitle: true,
            toolbarColor: '#007AFF',
            controlsColor: '#FFFFFF',
          },
          (
            browserError: string | null,
            browserResult?: WebBrowserAuthSessionResult,
          ) => {
            'background only';

            if (browserError) {
              setError(browserError);
              setIsLoading(false);
              onError?.(browserError);
            } else if (browserResult && browserResult.type !== 'success') {
              const errorMsg = 'OAuth flow was cancelled or failed';
              setError(errorMsg);
              setIsLoading(false);
              onError?.(errorMsg);
            }
            // If successful, we wait for the deep link callback which will be
            // stored to LocalStorageModule by native code and handled elsewhere
          },
        );
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error starting OAuth';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    },
    [baseUrl, redirectUri, generateState, onError],
  );

  // Cancel the current OAuth flow
  const cancelOAuth = useCallback(() => {
    'background only';

    try {
      const LynxWebBrowserModule = getLynxWebBrowserModule();
      if (LynxWebBrowserModule) {
        LynxWebBrowserModule.dismissAuthSession();
      }
      setIsLoading(false);
      setResult(null);
      setCurrentState(null);
    } catch (err) {
      console.warn('Failed to cancel OAuth flow:', err);
    }
  }, []);

  return {
    startOAuth,
    cancelOAuth,
    exchangeToken,
    isLoading,
    result,
    error,
    currentState,
    clearError: () => setError(null),
  };
}

/**
 * Hook for listening to OAuth results from deep links
 * Use this if you want to handle OAuth results manually
 *
 * @example
 * ```tsx
 * function OAuthListener() {
 *   const { result, error, clearResult } = useOAuthListener();
 *
 *   useEffect(() => {
 *     if (result) {
 *       if (result.status === 'success') {
 *         console.log('OAuth successful:', result);
 *         // Handle success
 *       } else {
 *         console.error('OAuth failed:', result.error);
 *         // Handle error
 *       }
 *       clearResult(); // Clear after handling
 *     }
 *   }, [result, clearResult]);
 *
 *   return null; // This is just a listener component
 * }
 * ```
 */
export function useOAuthListener() {
  const [result, setResult] = useState<MobileOAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    'background only';

    try {
      // Use storage-based registerOAuthCallback which polls LocalStorageModule
      const cleanup = registerOAuthCallback((res) => {
        if (res.status === 'error') {
          setError(`${res.error}: ${res.errorDescription}`);
          setResult({
            status: 'error',
            error: res.error,
            errorDescription: res.errorDescription,
          });
        } else {
          setResult(res);
        }
      });

      return () => cleanup();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to set up OAuth listener',
      );
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    error,
    clearResult,
  };
}
