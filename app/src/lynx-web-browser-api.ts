// LynxWebBrowser.ts
// JavaScript API for LynxJS WebBrowser functionality
// Provides the same interface as Expo WebBrowser but uses LynxJS native modules

import type {
  WebBrowserOpenOptions,
  WebBrowserResult,
  WebBrowserAuthSessionResult,
  WebBrowserCustomTabsResults,
  WebBrowserWarmUpResult,
  WebBrowserMayInitWithUrlResult,
  WebBrowserCoolDownResult,
  AuthSessionOpenOptions,
  MobileOAuthStartOptions,
  MobileOAuthResult,
  MobileTokenExchangeRequest,
  MobileTokenExchangeResponse,
} from './rspeedy-env';

// The runtime file `rspeedy-env.d.ts` only provides types and no JS exports.
// Importing values from it causes bundler resolution errors. Inline the
// minimal runtime constants we need here and export them so consumers can
// still import them from this module.
export const WebBrowserResultType = {
  CANCEL: 'cancel' as const,
  DISMISS: 'dismiss' as const,
  OPENED: 'opened' as const,
  LOCKED: 'locked' as const,
} as const;

export const WebBrowserPresentationStyle = {
  FULL_SCREEN: 'fullScreen' as const,
  PAGE_SHEET: 'pageSheet' as const,
  FORM_SHEET: 'formSheet' as const,
  CURRENT_CONTEXT: 'currentContext' as const,
  OVER_FULL_SCREEN: 'overFullScreen' as const,
  OVER_CURRENT_CONTEXT: 'overCurrentContext' as const,
  POPOVER: 'popover' as const,
  AUTOMATIC: 'automatic' as const,
} as const;

/**
 * LynxJS WebBrowser API
 *
 * This module provides web browser functionality for LynxJS applications,
 * including opening URLs in system browsers, handling authentication flows,
 * and managing Custom Tabs on Android.
 */

// Export enums
// (exported above inline)

/**
 * Opens the url with Safari in a modal on iOS using SFSafariViewController,
 * and Chrome in a new custom tab on Android.
 */
export async function openBrowserAsync(
  url: string,
  browserParams: WebBrowserOpenOptions = {},
): Promise<WebBrowserResult> {
  'background only';

  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.openBrowserAsync(
      url,
      browserParams,
      (error: string | null, result?: WebBrowserResult) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result!);
        }
      },
    );
  });
}

/**
 * Dismisses the presented web browser.
 */
export async function dismissBrowser(): Promise<WebBrowserResult> {
  'background only';

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.dismissBrowser(
      (error: string | null, result?: WebBrowserResult) => {
        if (error) {
          reject(new Error(error));
        } else {
          // Resolve with the provided WebBrowserResult. If native returns
          // undefined, return a sensible default of dismiss.
          resolve(result ?? { type: WebBrowserResultType.DISMISS });
        }
      },
    );
  });
}

/**
 * Opens the url for authentication using ASWebAuthenticationSession on iOS
 * and Custom Tabs with AppState monitoring on Android.
 */
export async function openAuthSessionAsync(
  url: string,
  redirectUrl?: string | null,
  options: AuthSessionOpenOptions = {},
): Promise<WebBrowserAuthSessionResult> {
  'background only';

  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.openAuthSessionAsync(
      url,
      redirectUrl,
      options,
      (error: string | null, result?: WebBrowserAuthSessionResult) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result!);
        }
      },
    );
  });
}

/**
 * Dismisses the current authentication session.
 */
export function dismissAuthSession(): void {
  'background only';

  NativeModules.LynxWebBrowserModule.dismissAuthSession();
}

/**
 * Returns a list of applications package names supporting Custom Tabs on Android.
 */
export async function getCustomTabsSupportingBrowsersAsync(): Promise<WebBrowserCustomTabsResults> {
  'background only';

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.getCustomTabsSupportingBrowsersAsync(
      (error: string | null, result?: WebBrowserCustomTabsResults) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result!);
        }
      },
    );
  });
}

/**
 * Calls warmUp method on CustomTabsClient for specified package on Android.
 */
export async function warmUpAsync(
  browserPackage?: string,
): Promise<WebBrowserWarmUpResult> {
  'background only';

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.warmUpAsync(
      browserPackage ?? null,
      (error: string | null, result?: WebBrowserWarmUpResult) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result!);
        }
      },
    );
  });
}

/**
 * Initiates CustomTabsSession and calls mayLaunchUrl method for browser.
 */
export async function mayInitWithUrlAsync(
  url: string,
  browserPackage?: string,
): Promise<WebBrowserMayInitWithUrlResult> {
  'background only';

  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.mayInitWithUrlAsync(
      url,
      browserPackage ?? null,
      (error: string | null, result?: WebBrowserMayInitWithUrlResult) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result!);
        }
      },
    );
  });
}

/**
 * Removes all bindings to services created by warmUpAsync or mayInitWithUrlAsync.
 */
export async function coolDownAsync(
  browserPackage?: string,
): Promise<WebBrowserCoolDownResult> {
  'background only';

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.coolDownAsync(
      browserPackage ?? null,
      (error: string | null, result?: WebBrowserCoolDownResult) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result!);
        }
      },
    );
  });
}

// Convenience functions for common use cases

/**
 * Opens a URL for OAuth authentication with automatic redirect handling.
 */
export async function openOAuthAsync(
  authUrl: string,
  redirectUrl: string,
  options: AuthSessionOpenOptions = {},
): Promise<WebBrowserAuthSessionResult> {
  'background only';

  return openAuthSessionAsync(authUrl, redirectUrl, {
    ...options,
    preferEphemeralSession: options.preferEphemeralSession ?? true,
  });
}

/**
 * Opens a URL in a browser with optimal settings for content viewing.
 */
export async function openContentAsync(
  url: string,
  options: WebBrowserOpenOptions = {},
): Promise<WebBrowserResult> {
  'background only';

  return openBrowserAsync(url, {
    readerMode: true,
    showTitle: true,
    enableDefaultShareMenuItem: true,
    ...options,
  });
}

/**
 * Utility to check if Custom Tabs are supported on the current device.
 */
export async function isCustomTabsSupported(): Promise<boolean> {
  'background only';

  try {
    const result = await getCustomTabsSupportingBrowsersAsync();
    return result.browserPackages.length > 0;
  } catch {
    return false;
  }
}

/**
 * Starts a mobile OAuth flow by opening the backend's mobile OAuth start endpoint
 * This integrates with your mobile_handlers.go backend
 */
export async function startMobileOAuthFlow(
  options: MobileOAuthStartOptions,
): Promise<WebBrowserAuthSessionResult> {
  'background only';

  const {
    state,
    redirectUri = 'hextok://oauth/callback',
    baseUrl = '',
  } = options;

  if (!state || typeof state !== 'string' || state.trim() === '') {
    throw new Error(
      'State parameter is required and must be a non-empty string',
    );
  }

  // Construct the OAuth start URL for your backend
  const oauthStartUrl = `${baseUrl}/api/v1/oauth/mobile/start/github?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return openAuthSessionAsync(oauthStartUrl, redirectUri, {
    preferEphemeralSession: true,
    showTitle: true,
    toolbarColor: '#007AFF',
    controlsColor: '#FFFFFF',
  });
}

/**
 * Exchanges a mobile OAuth token for a session cookie
 * This calls your /api/v1/oauth/mobile/exchange endpoint
 */
export async function exchangeMobileToken(
  token: string,
  baseUrl: string = '',
): Promise<MobileTokenExchangeResponse> {
  'background only';

  if (!token || typeof token !== 'string') {
    throw new Error('Token is required and must be a string');
  }

  const exchangeUrl = `${baseUrl}/api/v1/oauth/mobile/exchange`;
  const request: MobileTokenExchangeRequest = { token };

  try {
    const response = await fetch(exchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const result: MobileTokenExchangeResponse = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to exchange mobile token: ${error.message}`);
    }
    throw new Error('Failed to exchange mobile token: Unknown error');
  }
}

/**
 * Helper function to generate a random state for OAuth flows
 */
export function generateOAuthState(): string {
  'background only';

  // Generate a random state for OAuth flows
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Registers for OAuth callback results from deep links
 * This sets up the listener for your OAuthResultModule
 */
export function registerOAuthCallback(
  callback: (result: MobileOAuthResult) => void,
): () => void {
  'background only';
  // New simple implementation: read stored deep link data from LocalStorageModule
  // Native code should store a JSON string under OAUTH_DEEPLINK_KEY when an OAuth
  // deep link is received. This avoids relying on ephemeral native modules or
  // in-memory callbacks which are lost when the JS router rehydrates.

  const OAUTH_DEEPLINK_KEY = 'hextok_oauth_deeplink';

  if (
    typeof NativeModules === 'undefined' ||
    !NativeModules.LocalStorageModule
  ) {
    throw new Error(
      'LocalStorageModule not available. Make sure it is registered in MainApplication.kt',
    );
  }

  let stopped = false;
  const interval = setInterval(() => {
    if (stopped) return;
    try {
      NativeModules.LocalStorageModule.getStorageItem(
        OAUTH_DEEPLINK_KEY,
        (value: string | null) => {
          try {
            if (!value) return;
            // Attempt to parse stored JSON; if parsing fails, deliver raw string
            let parsed: unknown = null;
            try {
              parsed = JSON.parse(value);
            } catch {
              parsed = { raw: value };
            }

            // Safely extract fields from parsed unknown without using `any`.
            const asRecord = (p: unknown): Record<string, unknown> =>
              typeof p === 'object' && p !== null
                ? (p as Record<string, unknown>)
                : {};

            const getStr = (
              p: Record<string, unknown>,
              k: string,
            ): string | undefined => {
              const v = p[k];
              return typeof v === 'string' ? v : undefined;
            };

            const pRec = asRecord(parsed);
            const status = ((): 'success' | 'error' => {
              const s = getStr(pRec, 'status');
              if (s === 'success' || s === 'error') return s;
              return getStr(pRec, 'raw') ? 'success' : 'error';
            })();

            const result: MobileOAuthResult = {
              status,
              token: getStr(pRec, 'token') ?? getStr(pRec, 'raw'),
              userId:
                getStr(pRec, 'user_id') ??
                getStr(pRec, 'userId') ??
                getStr(pRec, 'user'),
              state: getStr(pRec, 'state'),
              error: getStr(pRec, 'error'),
              errorDescription:
                getStr(pRec, 'error_description') ??
                getStr(pRec, 'errorDescription'),
            };

            // Remove item to ensure single delivery
            NativeModules.LocalStorageModule.removeStorageItem(
              OAUTH_DEEPLINK_KEY,
            );

            // Deliver to callback and stop polling
            callback(result);
            stopped = true;
            clearInterval(interval);
          } catch (e) {
            // ignore parse/delivery errors and continue polling
            console.error('registerOAuthCallback delivery error', e);
          }
        },
      );
    } catch (e) {
      console.error('registerOAuthCallback polling error', e);
    }
  }, 500);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

/**
 * Complete OAuth flow: start OAuth, handle callback, and exchange token
 * This is a high-level convenience function that handles the entire flow
 */
export async function completeOAuthFlow(
  state: string,
  baseUrl: string = '',
  redirectUri: string = 'hextok://oauth/callback',
): Promise<MobileTokenExchangeResponse> {
  'background only';

  return new Promise((resolve, reject) => {
    let cleanup: (() => void) | null = null;

    // Set up OAuth result listener
    try {
      cleanup = registerOAuthCallback(async (result) => {
        try {
          if (
            result.status === 'success' &&
            result.token &&
            result.state === state
          ) {
            // Exchange the mobile token for a session
            const exchangeResult = await exchangeMobileToken(
              result.token,
              baseUrl,
            );
            resolve(exchangeResult);
          } else if (result.status === 'error') {
            reject(
              new Error(
                `OAuth failed: ${result.error} - ${result.errorDescription}`,
              ),
            );
          } else {
            reject(new Error('OAuth completed but with invalid result'));
          }
        } catch (error) {
          reject(error);
        } finally {
          if (cleanup) cleanup();
        }
      });

      // Start the OAuth flow
      startMobileOAuthFlow({ state, redirectUri, baseUrl })
        .then((authResult) => {
          if (authResult.type !== 'success') {
            if (cleanup) cleanup();
            reject(new Error('OAuth flow was cancelled or failed'));
          }
          // If successful, we wait for the deep link callback
        })
        .catch((error) => {
          if (cleanup) cleanup();
          reject(error);
        });
    } catch (error) {
      if (cleanup) cleanup();
      reject(error);
    }
  });
}

// Default export for convenience
const LynxWebBrowser = {
  openBrowserAsync,
  dismissBrowser,
  openAuthSessionAsync,
  dismissAuthSession,
  getCustomTabsSupportingBrowsersAsync,
  warmUpAsync,
  mayInitWithUrlAsync,
  coolDownAsync,

  // Convenience functions
  openOAuthAsync,
  openContentAsync,
  isCustomTabsSupported,

  // Mobile OAuth functions
  startMobileOAuthFlow,
  exchangeMobileToken,
  generateOAuthState,
  registerOAuthCallback,
  completeOAuthFlow,

  // Constants
  WebBrowserResultType,
  WebBrowserPresentationStyle,
};

export default LynxWebBrowser;
