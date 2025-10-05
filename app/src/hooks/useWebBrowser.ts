// useWebBrowser.ts
// React hooks for LynxJS WebBrowser functionality
// Provides easy-to-use hooks for browser operations in React components

import { useState, useCallback, useRef, useEffect } from '@lynx-js/react';
import type {
  WebBrowserOpenOptions,
  AuthSessionOpenOptions,
  WebBrowserResult,
  WebBrowserAuthSessionResult,
  WebBrowserCustomTabsResults,
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

        const LynxWebBrowserModule = lynx.requireNativeModule?.(
          'LynxWebBrowserModule',
        );
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
              }
            },
          );
        } else {
          throw new Error('LynxWebBrowserModule not available');
        }
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [],
  );

  const dismissBrowser = useCallback(async () => {
    'background only';

    try {
      const LynxWebBrowserModule = lynx.requireNativeModule?.(
        'LynxWebBrowserModule',
      );
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
        throw new Error('LynxWebBrowserModule not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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

        const LynxWebBrowserModule = lynx.requireNativeModule?.(
          'LynxWebBrowserModule',
        );
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
          throw new Error('LynxWebBrowserModule not available');
        }
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
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
      const LynxWebBrowserModule = lynx.requireNativeModule?.(
        'LynxWebBrowserModule',
      );
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
      const LynxWebBrowserModule = lynx.requireNativeModule?.(
        'LynxWebBrowserModule',
      );
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
        throw new Error('LynxWebBrowserModule not available');
      }
    } catch {
      setIsLoading(false);
      setIsSupported(false);
    }
  }, []);

  const warmUp = useCallback(async (browserPackage?: string) => {
    'background only';
    const LynxWebBrowserModule = lynx.requireNativeModule?.(
      'LynxWebBrowserModule',
    );
    if (LynxWebBrowserModule) {
      LynxWebBrowserModule.warmUpAsync(browserPackage || null, () => {});
    }
  }, []);

  const coolDown = useCallback(async (browserPackage?: string) => {
    'background only';
    const LynxWebBrowserModule = lynx.requireNativeModule?.(
      'LynxWebBrowserModule',
    );
    if (LynxWebBrowserModule) {
      LynxWebBrowserModule.coolDownAsync(browserPackage || null, () => {});
    }
  }, []);

  const preloadUrl = useCallback(
    async (url: string, browserPackage?: string) => {
      'background only';
      const LynxWebBrowserModule = lynx.requireNativeModule?.(
        'LynxWebBrowserModule',
      );
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
