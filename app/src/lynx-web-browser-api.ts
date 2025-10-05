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
} from './rspeedy-env';

import {
  WebBrowserResultType,
  WebBrowserPresentationStyle,
} from './rspeedy-env';

/**
 * LynxJS WebBrowser API
 *
 * This module provides web browser functionality for LynxJS applications,
 * including opening URLs in system browsers, handling authentication flows,
 * and managing Custom Tabs on Android.
 */

// Re-export types for convenience
export type {
  WebBrowserOpenOptions,
  WebBrowserResult,
  WebBrowserAuthSessionResult,
  WebBrowserCustomTabsResults,
  AuthSessionOpenOptions,
};

// Export enums
export { WebBrowserResultType, WebBrowserPresentationStyle };

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
export async function dismissBrowser(): Promise<{
  type: typeof WebBrowserResultType.DISMISS;
}> {
  'background only';

  return new Promise((resolve, reject) => {
    NativeModules.LynxWebBrowserModule.dismissBrowser(
      (
        error: string | null,
        result?: { type: typeof WebBrowserResultType.DISMISS },
      ) => {
        if (error) {
          reject(new Error(error));
        } else {
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
      browserPackage,
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
      browserPackage,
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
      browserPackage,
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

  // Constants
  WebBrowserResultType,
  WebBrowserPresentationStyle,
};

export default LynxWebBrowser;
