// useMobileOAuth.ts
// Enhanced mobile OAuth hook that handles URL scheme redirects and token exchange
// Solves the cookie isolation problem in mobile OAuth flows

import { useState, useCallback, useEffect } from '@lynx-js/react';
import { useWebBrowserAuth } from './useWebBrowser';

import { oauthCookieCapture } from '../utils/cookie-capture';
import type { WebBrowserAuthSessionResult } from '../rspeedy-env';

export interface MobileOAuthState {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  userID: number | null;
}

export interface MobileOAuthOptions {
  baseUrl: string;
  provider: 'github' | 'google' | 'discord';
  enableDebugLogging?: boolean;
  customScheme?: string;
}

/**
 * Enhanced mobile OAuth hook that properly handles mobile authentication flows
 *
 * Key differences from web OAuth:
 * 1. Uses custom URL scheme redirects instead of cookies
 * 2. Handles deep link callbacks from OAuth provider
 * 3. Exchanges temporary tokens for session tokens
 * 4. Works around in-app browser cookie isolation
 *
 * Flow:
 * 1. Open OAuth URL in in-app browser
 * 2. User authenticates with provider
 * 3. Provider redirects to custom scheme (hextok://auth?token=...)
 * 4. App catches redirect and extracts token
 * 5. Exchange token for session via API call
 *
 * @example
 * ```tsx
 * const { startOAuth, state } = useMobileOAuth({
 *   baseUrl: 'https://api.myapp.com',
 *   provider: 'github'
 * });
 * ```
 */
export function useMobileOAuth(options: MobileOAuthOptions) {
  const {
    openAuthSession,
    result,
    error: webBrowserError,
    isLoading: browserLoading,
  } = useWebBrowserAuth();

  const [state, setState] = useState<MobileOAuthState>({
    isLoading: false,
    error: null,
    isAuthenticated: false,
    sessionToken: null,
    userID: null,
  });

  /**
   * Log debug information for mobile OAuth
   */
  const logMobileOAuthDebug = useCallback(
    (phase: string, info?: Record<string, unknown>) => {
      if (!options.enableDebugLogging) return;

      console.group(`📱 Mobile OAuth Debug - ${phase.toUpperCase()}`);
      console.log('Provider:', options.provider);
      console.log('Base URL:', options.baseUrl);
      console.log('Custom Scheme:', options.customScheme || 'hextok://auth');

      if (info) {
        console.log('Additional Info:', info);
      }

      // Log environment info

      console.groupEnd();
    },
    [options],
  );

  /**
   * Parse OAuth callback URL to extract tokens/errors
   */
  const parseOAuthCallback = useCallback(
    (
      url: string,
    ): {
      token?: string;
      userID?: number;
      error?: string;
      errorDescription?: string;
    } => {
      try {
        const parsedUrl = new URL(url);
        const params = new URLSearchParams(parsedUrl.search);

        return {
          token: params.get('token') || undefined,
          userID: params.get('user_id')
            ? parseInt(params.get('user_id')!)
            : undefined,
          error: params.get('error') || undefined,
          errorDescription: params.get('error_description') || undefined,
        };
      } catch (error) {
        console.error('Failed to parse OAuth callback URL:', error);
        return { error: 'invalid_callback_url' };
      }
    },
    [],
  );

  /**
   * Exchange mobile token for session token
   */
  const exchangeTokenForSession = useCallback(
    async (
      token: string,
    ): Promise<{
      success: boolean;
      sessionToken?: string;
      userID?: number;
      error?: string;
    }> => {
      try {
        logMobileOAuthDebug('token_exchange', { tokenLength: token.length });

        const response = await fetch(
          `${options.baseUrl}/api/v1/oauth/mobile/exchange`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Token exchange failed: ${response.status} ${errorText}`,
          );
        }

        const data = await response.json();

        logMobileOAuthDebug('token_exchange_success', {
          userID: data.user_id,
          sessionID: data.session_id,
        });

        return {
          success: true,
          sessionToken: data.token,
          userID: data.user_id,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logMobileOAuthDebug('token_exchange_error', { error: errorMessage });

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [options.baseUrl, logMobileOAuthDebug],
  );

  /**
   * Start the mobile OAuth flow
   */
  const startOAuth = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      logMobileOAuthDebug('start');

      // Reset cookie capture state
      oauthCookieCapture.reset();

      // Construct mobile OAuth URLs
      const customScheme = options.customScheme || 'hextok://oauth/callback';
      const authUrl = `${options.baseUrl}/api/v1/oauth/mobile/start/${options.provider}?redirect_uri=${encodeURIComponent(customScheme)}`;

      console.log('📱 Starting mobile OAuth flow...');
      console.log('Auth URL:', authUrl);
      console.log('Expected redirect:', customScheme);

      // Open OAuth session with custom redirect handling
      await openAuthSession(authUrl, customScheme, {
        preferEphemeralSession: true, // Use ephemeral session for security
        showTitle: true,
        toolbarColor: '#007AFF',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Mobile OAuth flow error:', error);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      logMobileOAuthDebug('error', { error: errorMessage });
    }
  }, [options, openAuthSession, logMobileOAuthDebug]);

  /**
   * Handle OAuth callback from URL scheme
   */
  const handleOAuthCallback = useCallback(
    async (result: WebBrowserAuthSessionResult) => {
      logMobileOAuthDebug('callback_received', { result });

      if (result.type === 'success' && result.url) {
        const callbackData = parseOAuthCallback(result.url);

        if (callbackData.error) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              callbackData.errorDescription ||
              callbackData.error ||
              'OAuth failed',
          }));
          logMobileOAuthDebug('callback_error', callbackData);
          return;
        }

        if (callbackData.token) {
          console.log(
            '🎯 Mobile OAuth token received, exchanging for session...',
          );

          // Exchange token for session
          const exchangeResult = await exchangeTokenForSession(
            callbackData.token,
          );

          if (exchangeResult.success) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isAuthenticated: true,
              sessionToken: exchangeResult.sessionToken!,
              userID: exchangeResult.userID!,
            }));

            console.log('✅ Mobile OAuth completed successfully!');
            logMobileOAuthDebug('success', {
              userID: exchangeResult.userID,
              hasSessionToken: !!exchangeResult.sessionToken,
            });
          } else {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: exchangeResult.error || 'Token exchange failed',
            }));
          }
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'No token received from OAuth callback',
          }));
        }
      } else if (result.type === 'cancel') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'OAuth was cancelled by user',
        }));
        logMobileOAuthDebug('cancelled');
      }
    },
    [parseOAuthCallback, exchangeTokenForSession, logMobileOAuthDebug],
  );

  /**
   * Clear OAuth state
   */
  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      isAuthenticated: false,
      sessionToken: null,
      userID: null,
    });
    oauthCookieCapture.reset();
    logMobileOAuthDebug('state_cleared');
  }, [logMobileOAuthDebug]);

  /**
   * Handle WebBrowser result changes
   */
  useEffect(() => {
    if (result) {
      handleOAuthCallback(result);
    }
  }, [result, handleOAuthCallback]);

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
      logMobileOAuthDebug('browser_error', { error: webBrowserError });
    }
  }, [webBrowserError, logMobileOAuthDebug]);

  /**
   * Initialize debug logging
   */

  return {
    startOAuth,
    state: {
      ...state,
      isLoading: state.isLoading || browserLoading,
    },
    clearState,

    // Utility functions
    parseOAuthCallback,
    exchangeTokenForSession,
    logDebugInfo: () => logMobileOAuthDebug('manual'),
  };
}

/**
 * Simplified hook for GitHub mobile OAuth
 */
export function useMobileGitHubOAuth(
  baseUrl: string,
  enableDebugLogging = true,
) {
  return useMobileOAuth({
    baseUrl,
    provider: 'github',
    enableDebugLogging,
    customScheme: 'hextok://oauth/callback',
  });
}
