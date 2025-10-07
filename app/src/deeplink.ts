// Typed deep link helpers for the Hextok app

export const deepLinks = ['/oauth/verify', '/oauth/callback'] as const;

export type DeepLinkPath = (typeof deepLinks)[number];

/**
 * Get the last received deep link data from native storage
 */
export function getLastDeepLink(): Promise<{
  url: string;
  host: string;
  path: string;
  queryParams: Record<string, string | null>;
  timestamp: number;
} | null> {
  'background only';

  return new Promise((resolve, reject) => {
    if (typeof NativeModules === 'undefined' || !NativeModules.DeepLinkModule) {
      reject(new Error('DeepLinkModule not available'));
      return;
    }

    try {
      NativeModules.DeepLinkModule.getLastDeepLink((data: unknown) => {
        try {
          console.log(
            '🔍 [getLastDeepLink] native returned raw (expected JSON string):',
            data,
          );
        } catch {
          // ignore logging errors
        }

        if (!data) {
          resolve(null);
          return;
        }

        // Data should be a JSON string produced by native code
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            // Ensure queryParams exists and normalize types
            const qp: Record<string, string | null> = {};
            if (parsed.queryParams && typeof parsed.queryParams === 'object') {
              Object.keys(parsed.queryParams).forEach((k) => {
                const v = parsed.queryParams[k];
                qp[k] = v === null || v === undefined ? null : String(v);
              });
            }

            const out = {
              url: String(parsed.url || ''),
              host: String(parsed.host || ''),
              path: String(parsed.path || ''),
              queryParams: qp,
              timestamp: Number(parsed.timestamp || Date.now()),
            };
            resolve(out);
            return;
          } catch (e) {
            console.error(
              '❌ [getLastDeepLink] Failed to parse native JSON string:',
              e,
            );
            resolve(null);
            return;
          }
        }

        // If data is not a string, attempt best effort conversion
        try {
          console.warn(
            '� [getLastDeepLink] Unexpected non-string data from native, attempting to coerce',
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyData = data as any;
          const qp: Record<string, string | null> = {};
          if (anyData.queryParams) {
            Object.keys(anyData.queryParams).forEach((k) => {
              const v = anyData.queryParams[k];
              qp[k] = v === null || v === undefined ? null : String(v);
            });
          }
          resolve({
            url: String(anyData.url || ''),
            host: String(anyData.host || ''),
            path: String(anyData.path || ''),
            queryParams: qp,
            timestamp: Number(anyData.timestamp || Date.now()),
          });
        } catch (e) {
          console.error(
            '❌ [getLastDeepLink] Failed to coerce native data:',
            e,
          );
          resolve(null);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Clear the stored deep link data
 */
export function clearDeepLink(): void {
  'background only';

  if (typeof NativeModules === 'undefined' || !NativeModules.DeepLinkModule) {
    console.warn('DeepLinkModule not available');
    return;
  }

  try {
    NativeModules.DeepLinkModule.clearDeepLink();
  } catch (error) {
    console.error('Failed to clear deep link:', error);
  }
}

/**
 * Check if there is stored deep link data
 */
export function hasDeepLink(): Promise<boolean> {
  'background only';

  return new Promise((resolve, reject) => {
    if (typeof NativeModules === 'undefined' || !NativeModules.DeepLinkModule) {
      reject(new Error('DeepLinkModule not available'));
      return;
    }

    try {
      NativeModules.DeepLinkModule.hasDeepLink((hasData: boolean) => {
        resolve(hasData);
      });
    } catch (error) {
      reject(error);
    }
  });
}
