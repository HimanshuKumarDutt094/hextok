import { useState, useCallback, useEffect } from '@lynx-js/react';
import {
  logNativeModuleDebugInfo,
  logOAuthEnvironmentDebugInfo,
  getNativeModuleDebugInfo,
  type NativeModuleDebugInfo,
} from '../utils/debug-native-modules';
import {
  oauthCookieCapture,
  captureAndAnalyzeCookies,
  type CookieInfo,
  type CookieAnalysis,
} from '../utils/cookie-capture';
import type { WebBrowserAuthSessionResult } from '../rspeedy-env';
import { useWebBrowserAuth } from './useWebBrowser';

export interface OAuthCookieInfo {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  timestamp: number;
}

export interface OAuthFlowState {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  capturedCookies: {
    beforeAuth: CookieInfo[];
    afterAuth: CookieInfo[];
  };
  cookieAnalysis: CookieAnalysis | null;
  debugInfo: NativeModuleDebugInfo | null;
}

export interface OAuthFlowOptions {
  baseUrl: string;
  provider: 'github' | 'google' | 'discord';
  redirectScheme?: string;
  enableDebugLogging?: boolean;
}

/**
 * Hook for handling OAuth authentication flow with cookie capture
 *
 * This hook:
 * 1. Initiates OAuth flow by opening the start URL in browser
 * 2. Captures cookies before authentication
 * 3. Handles the OAuth redirect and callback
 * 4. Captures cookies after successful authentication
 * 5. Provides detailed debugging information
 *
 * @example
 * ```tsx
 * const { startOAuth, state, clearState } = useOAuthFlow({
 *   baseUrl: 'http://localhost:8080',
 *   provider: 'github',
 *   redirectScheme: 'hextok://auth'
 * });
 *
 * // Start OAuth flow
 * const handleLogin = () => {
 *   startOAuth();
 * };
 * ```
 */
export function useOAuthFlow(options: OAuthFlowOptions) {
  const {
    openAuthSession,
    result,
    error: webBrowserError,
    isLoading: browserLoading,
  } = useWebBrowserAuth();

  const [state, setState] = useState<OAuthFlowState>({
    cookieAnalysis: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    capturedCookies: {
      beforeAuth: [],
      afterAuth: [],
    },
    debugInfo: null,
  });

  /**
   * Capture cookies using the enhanced cookie capture utility
   */
  const captureCookies = useCallback((): CookieInfo[] => {
    const cookies = oauthCookieCapture.captureCookies();

    if (options.enableDebugLogging) {
      oauthCookieCapture.logCookieInfo(
        cookies,
        '🍪 OAuth Flow - Captured Cookies',
      );
    }

    return cookies;
  }, [options.enableDebugLogging]); /**
   * Enhanced logging function that combines OAuth flow info with native module debug info
   */
  const logOAuthDebugInfo = useCallback(
    (
      phase: 'start' | 'success' | 'error' | 'manual',
      additionalInfo?: Record<string, unknown>,
    ) => {
      if (!options.enableDebugLogging) return;

      console.group(`🔐 OAuth Flow Debug - ${phase.toUpperCase()}`);

      // Log native module information
      const nativeDebugInfo = getNativeModuleDebugInfo();
      console.log('Native Module Info:', nativeDebugInfo);

      // Log OAuth specific information
      console.log('OAuth Provider:', options.provider);
      console.log('Base URL:', options.baseUrl);
      console.log('Redirect Scheme:', options.redirectScheme);

      if (additionalInfo) {
        console.log('Additional Info:', additionalInfo);
      }

      // Log current cookies
      const currentCookies = captureCookies();
      console.log('Current Cookies:', currentCookies);

      console.groupEnd();
    },
    [options, captureCookies],
  );

  /**
   * Start the OAuth authentication flow
   */
  const startOAuth = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        debugInfo: getNativeModuleDebugInfo(),
      }));

      // Log debug info at start
      logOAuthDebugInfo('start');

      // Capture cookies before authentication
      const beforeAuthCookies = captureCookies();

      setState((prev) => ({
        ...prev,
        capturedCookies: {
          ...prev.capturedCookies,
          beforeAuth: beforeAuthCookies,
        },
      }));

      // Construct OAuth start URL
      const authUrl = `${options.baseUrl}/api/v1/oauth/start/${options.provider}`;
      const redirectUrl = options.redirectScheme || `${options.baseUrl}/`;

      console.log('🚀 Starting OAuth flow...');
      console.log('Auth URL:', authUrl);
      console.log('Redirect URL:', redirectUrl);

      // Open OAuth session using WebBrowser
      await openAuthSession(authUrl, redirectUrl, {
        preferEphemeralSession: false, // We want to capture cookies
        showTitle: true,
        toolbarColor: '#007AFF',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('OAuth flow error:', error);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      logOAuthDebugInfo('error', { error: errorMessage });
    }
  }, [options, openAuthSession, captureCookies, logOAuthDebugInfo]);

  /**
   * Handle OAuth success/completion
   */
  const handleOAuthSuccess = useCallback(
    (result: WebBrowserAuthSessionResult) => {
      console.log('✅ OAuth flow completed:', result);

      // Capture cookies after authentication
      const afterAuthCookies = captureCookies();

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true,
        capturedCookies: {
          ...prev.capturedCookies,
          afterAuth: afterAuthCookies,
        },
      }));

      logOAuthDebugInfo('success', { result, cookiesAfter: afterAuthCookies });

      // Compare cookies before and after
      if (options.enableDebugLogging) {
        console.group('🔍 Cookie Comparison');
        console.log('Before Auth:', state.capturedCookies.beforeAuth);
        console.log('After Auth:', afterAuthCookies);

        // Look for specific OAuth cookies
        const oauthStateCookie = afterAuthCookies.find(
          (c) => c.name === 'hextok_oauth_state',
        );
        const sessionCookie = afterAuthCookies.find(
          (c) => c.name === 'hextok_session',
        );

        if (oauthStateCookie) {
          console.log('🎯 Found OAuth State Cookie:', oauthStateCookie);
        }
        if (sessionCookie) {
          console.log('🎯 Found Session Cookie:', sessionCookie);
        }

        console.groupEnd();
      }
    },
    [
      captureCookies,
      logOAuthDebugInfo,
      options.enableDebugLogging,
      state.capturedCookies.beforeAuth,
    ],
  );

  /**
   * Clear the OAuth state
   */
  const clearState = useCallback(() => {
    setState({
      cookieAnalysis: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      capturedCookies: {
        beforeAuth: [],
        afterAuth: [],
      },
      debugInfo: null,
    });
  }, []);

  /**
   * Handle WebBrowser auth result changes
   */
  useEffect(() => {
    if (result) {
      if (result.type === 'success') {
        handleOAuthSuccess(result);
      } else if (result.type === 'cancel') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Authentication was cancelled',
        }));
      }
    }
  }, [result, handleOAuthSuccess]);

  /**
   * Handle WebBrowser errors
   */
  useEffect(() => {
    if (webBrowserError) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: webBrowserError,
      }));
      logOAuthDebugInfo('error', { webBrowserError });
    }
  }, [webBrowserError, logOAuthDebugInfo]);

  /**
   * Initialize debug logging on mount
   */
  useEffect(() => {
    if (options.enableDebugLogging) {
      console.log('🔧 OAuth Flow Hook Initialized');
      logOAuthEnvironmentDebugInfo(); // Use enhanced OAuth debug logging
    }
  }, [options.enableDebugLogging]);

  return {
    startOAuth,
    state: {
      ...state,
      isLoading: state.isLoading || browserLoading,
    },
    clearState,
    webBrowserResult: result,
    webBrowserError,

    // Utility functions for advanced usage
    captureCookies,
    logDebugInfo: () => logOAuthDebugInfo('manual'),
  };
}

/**
 * Simplified hook for basic OAuth usage
 */
export function useGitHubOAuth(baseUrl: string, enableDebugLogging = true) {
  return useOAuthFlow({
    baseUrl,
    provider: 'github',
    redirectScheme: 'hextok://auth',
    enableDebugLogging,
  });
}
