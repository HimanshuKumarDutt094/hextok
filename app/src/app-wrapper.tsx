import { useEffect, useState } from '@lynx-js/react';
import { useAuth } from './hooks/auth';
import { getLastDeepLink, clearDeepLink } from './deeplink';
import { API_BASE } from './config';
import Router from './routes/router';
import { DebugModules } from './debug-modules';

/**
 * Main app wrapper that handles native deep links for OAuth callback
 * This replaces the need for React Router based OAuth callback handling
 */
export function AppWrapper() {
  const { storeToken, authToken } = useAuth();
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const processDeepLinkOnce = async () => {
      try {
        console.log(
          '🔵 [AppWrapper] Performing initial deep link check (blocking)',
        );

        // If we already have a valid auth token, skip deep link processing
        if (authToken) {
          console.log(
            '🔵 [AppWrapper] Already authenticated, skipping deep link processing',
          );
          return;
        }

        // Directly request the last deep link (avoid hasDeepLink race)
        const data = await getLastDeepLink();
        console.log('🔵 [DeepLink] Raw deep link payload from native:', data);

        if (!data) {
          console.log('🔵 [DeepLink] No deep link data returned (null)');
          return;
        }

        // Always log full URL and query params for debugging (user requested)
        try {
          console.log('🔵 [DeepLink] url:', data.url);
          console.log('🔵 [DeepLink] path:', data.path);
          console.log('🔵 [DeepLink] queryParams:', data.queryParams);
        } catch (e) {
          console.warn('� [DeepLink] Failed to log deep link details', e);
        }

        // Persist raw deep link into persistent storage from JS (so the rest of
        // app can pick it up after reload). The user insisted JS should write
        // local storage, not native code.
        try {
          if (
            typeof NativeModules !== 'undefined' &&
            NativeModules.LocalStorageModule
          ) {
            const payload = JSON.stringify(data);
            console.log(
              '🔵 [DeepLink] Persisting deep link JSON to LocalStorageModule:',
              payload,
            );
            NativeModules.LocalStorageModule.setStorageItem(
              'hextok_oauth_deeplink',
              payload,
            );
          } else {
            console.warn(
              '🔶 [DeepLink] LocalStorageModule not available; cannot persist deep link from JS',
            );
          }
        } catch (e) {
          console.error(
            '❌ [DeepLink] Failed to persist deep link to LocalStorageModule:',
            e,
          );
        }

        // Now process if this looks like an oauth callback
        console.log('🔍 [DeepLink] Checking if path matches /callback:', {
          actualPath: data.path,
          expectedPath: '/callback',
          actualHost: data.host,
          expectedHost: 'oauth',
          pathMatches: data.path === '/callback',
          hostMatches: data.host === 'oauth',
          isOAuthCallback: data.host === 'oauth' && data.path === '/callback',
        });

        if (data.host === 'oauth' && data.path === '/callback') {
          const params = data.queryParams || {};

          console.log(
            '🔍 [DeepLink] Processing OAuth callback with queryParams:',
            params,
          );
          console.log('🔍 [DeepLink] Type of queryParams:', typeof params);
          console.log(
            '🔍 [DeepLink] Object.keys(queryParams):',
            Object.keys(params),
          );

          const token = params.token;
          const userId = params.user_id;
          const error = params.error;
          const errorDescription = params.error_description;

          console.log('✅ [DeepLink] OAuth parameters preview:', {
            hasToken: !!token,
            tokenPreview: token ? `${String(token).substring(0, 20)}...` : null,
            userId,
            error,
            errorDescription,
          });

          if (error) {
            console.error('❌ [DeepLink] OAuth error in deep link params:', {
              error,
              errorDescription,
            });
            // Clear the deep link so we don't process it again
            clearDeepLink();
          } else if (!token || !userId) {
            console.error(
              '❌ [DeepLink] Missing required OAuth params in deep link:',
              { token, userId },
            );
            // Clear the deep link so we don't process it again
            clearDeepLink();
          } else {
            // Exchange token for session
            try {
              console.log('🌐 [DeepLink] Exchanging mobile token for session');
              const exchangeUrl = `${API_BASE}/api/v1/oauth/mobile/exchange`;
              const response = await fetch(exchangeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
              });

              console.log('🌐 [DeepLink] Token exchange response:', {
                status: response.status,
                ok: response.ok,
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [DeepLink] Token exchange failed:', {
                  status: response.status,
                  errorText,
                });
              } else {
                const exchangeResult = await response.json();
                console.log(
                  '✅ [DeepLink] Token exchange successful:',
                  exchangeResult,
                );

                // Wait for token to be stored before continuing
                await new Promise<void>((resolve, reject) => {
                  storeToken.mutate(exchangeResult, {
                    onSuccess: () => {
                      console.log(
                        '✅ [DeepLink] Auth token stored (storeToken.onSuccess)',
                      );
                      resolve();
                    },
                    onError: (e) => {
                      console.error(
                        '❌ [DeepLink] Failed to store auth token:',
                        e,
                      );
                      reject(e);
                    },
                  });
                });

                // Clear the deep link after successful processing
                console.log(
                  '🧹 [DeepLink] Clearing deep link after successful OAuth processing',
                );
                clearDeepLink();
              }
            } catch (e) {
              console.error('❌ [DeepLink] Error during token exchange:', e);
            }
          }
        }
      } catch (err) {
        console.error(
          '❌ [AppWrapper] Error during initial deep link processing:',
          err,
        );
      } finally {
        // mark initialization complete so Router can mount
        if (mounted) setInitialized(true);
      }
    };

    console.log('🔵 [AppWrapper] Starting initial deep link processing');
    processDeepLinkOnce();

    // Only poll for background deep links when the user is NOT authenticated.
    // If authToken becomes truthy, the effect will re-run and cleanup the interval.
    let interval: string | number | NodeJS.Timeout | null | undefined;
    if (!authToken) {
      interval = setInterval(async () => {
        try {
          const data = await getLastDeepLink();
          if (data) {
            console.log('🟢 [DeepLink] Background poll found deep link:', data);
            // persist to LocalStorageModule again and let registered listeners act
            if (
              typeof NativeModules !== 'undefined' &&
              NativeModules.LocalStorageModule
            ) {
              NativeModules.LocalStorageModule.setStorageItem(
                'hextok_oauth_deeplink',
                JSON.stringify(data),
              );
            }
            clearDeepLink();
          }
        } catch (e) {
          console.error('❌ [AppWrapper] Background deep link poll error:', e);
        }
      }, 2000);
    } else {
      console.log(
        '🔵 [AppWrapper] Skipping background deep-link polling because user is authenticated',
      );
    }

    return () => {
      mounted = false;
      console.log('🧹 [AppWrapper] Cleaning up deep link polling');
      if (interval != null) clearInterval(interval);
    };
  }, [storeToken, setInitialized, authToken]);

  // While initial deep-link processing hasn't completed, render a minimal
  // placeholder (prevents Router from rendering before we persist deep link)
  if (!initialized) {
    return (
      <>
        <DebugModules />
        <view>
          <text>Loading…</text>
        </view>
      </>
    );
  }

  return (
    <>
      <DebugModules />
      <Router />
    </>
  );
}
