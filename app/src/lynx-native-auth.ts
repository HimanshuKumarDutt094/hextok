// Lynx frontend wrapper for the NativeAuthModule exposed by the Android host
// Usage:
// import { openAuth } from './lynx-native-auth';
// openAuth('https://github.com/login/oauth/authorize?client_id=...', { callbackScheme: 'myapp://callback' })
//   .then(res => console.log('redirect', res.redirectUrl))
//   .catch(err => console.error('auth failed', err));

type OpenAuthOptions = {
  callbackScheme?: string;
  useCustomTab?: boolean;
  title?: string;
};

// Updated interfaces for error-first callback pattern
interface NativeAuthModuleShape {
  openAuth(
    url: string,
    options: Record<string, unknown>,
    callback: (
      error: { code: string; message: string } | null,
      result?: {
        success: boolean;
        redirectUrl: string;
        sessionCookie?: string;
      },
    ) => void,
  ): void;
  cancelAuth(callback: (error: null) => void): void;
}

interface NativeModulesShape {
  NativeAuthModule?: NativeAuthModuleShape;
  [k: string]: unknown;
}

interface LynxNative {
  nativeModules?: NativeModulesShape;
}

export function openAuth(
  url: string,
  options: OpenAuthOptions = {},
): Promise<{ redirectUrl: string; sessionCookie?: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Prefer the documented Lynx `NativeModules` global. Fall back to `lynx.nativeModules` for compatibility.
      const nativeModules =
        (globalThis as unknown as { NativeModules?: NativeModulesShape })
          .NativeModules ??
        (globalThis as unknown as { lynx?: LynxNative }).lynx?.nativeModules;

      const nm = nativeModules as NativeModulesShape | undefined;
      if (!nm || !nm.NativeAuthModule) {
        return reject({
          code: 'MODULE_MISSING',
          message: 'NativeAuthModule is not available',
        });
      }

      nm.NativeAuthModule.openAuth(
        url,
        options as Record<string, unknown>,
        async (
          error: { code: string; message: string } | null,
          result?: {
            success: boolean;
            redirectUrl: string;
            sessionCookie?: string;
          },
        ) => {
          if (error) {
            reject(error);
            return;
          }

          if (result && result.redirectUrl) {
            // Persist session cookie if present using SecureStorage (following docs pattern)
            try {
              if (result.sessionCookie) {
                // Use SecureStorage module if available
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const secureStorage = (nm as any)
                  ?.SecureStorage as typeof globalThis.NativeModules.SecureStorage;
                if (secureStorage && typeof secureStorage.open === 'function') {
                  // Open default storage and store session cookie
                  secureStorage.open(
                    null,
                    (openError: Error | null, handle: string) => {
                      if (!openError && handle) {
                        secureStorage.set(
                          handle,
                          'hextok_session',
                          result.sessionCookie,
                          null,
                          () => {
                            // Ignore storage errors, don't fail the auth flow
                          },
                        );
                      }
                    },
                  );
                }
              }
            } catch {
              // ignore storage errors
            }
            resolve({
              redirectUrl: result.redirectUrl,
              sessionCookie: result.sessionCookie,
            });
          } else {
            reject({
              code: 'INVALID_RESULT',
              message: 'Missing redirectUrl',
            });
          }
        },
      );
    } catch (err) {
      const msg =
        err && (err as Error).message ? (err as Error).message : String(err);
      reject({ code: 'EXCEPTION', message: msg });
    }
  });
}

export function cancelAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const nativeModules =
        (globalThis as unknown as { NativeModules?: NativeModulesShape })
          .NativeModules ??
        (globalThis as unknown as { lynx?: LynxNative }).lynx?.nativeModules;
      const nm = nativeModules as NativeModulesShape | undefined;
      if (nm && nm.NativeAuthModule) {
        nm.NativeAuthModule.cancelAuth(() => {
          resolve();
        });
      } else {
        reject({
          code: 'MODULE_MISSING',
          message: 'NativeAuthModule is not available',
        });
      }
    } catch (err) {
      const msg =
        err && (err as Error).message ? (err as Error).message : String(err);
      reject({ code: 'EXCEPTION', message: msg });
    }
  });
}
