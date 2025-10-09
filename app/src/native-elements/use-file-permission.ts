'background only';
// Hook uses Lynx native module APIs and should be invoked from background-only code per docs.
import { useCallback, useState } from '@lynx-js/react';

export function useFilePermission() {
  const [granted, setGranted] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    const start = Date.now();
    const m = NativeModules.FilePermissionModule;
    console.debug(
      '[useFilePermission] check() called at',
      new Date(start).toISOString(),
      { grantedBefore: granted },
    );
    console.debug('[useFilePermission] native module present?', !!m, {
      moduleKeys: m ? Object.keys(m) : null,
    });

    return new Promise<boolean | null>((resolve) => {
      try {
        console.debug(
          '[useFilePermission] invoking native hasFilePermission at',
          Date.now(),
        );
        m.hasFilePermission((error, result) => {
          const ts = Date.now();
          if (error) {
            console.warn('[useFilePermission] hasFilePermission -> ERROR', {
              timestamp: new Date(ts).toISOString(),
              error,
              durationMs: ts - start,
            });
            setGranted(false);
            resolve(false);
          } else {
            const hasPermission = (result ?? false) as boolean;
            console.debug('[useFilePermission] hasFilePermission -> RESULT', {
              timestamp: new Date(ts).toISOString(),
              result: hasPermission,
              rawResult: result,
              durationMs: ts - start,
            });
            setGranted(hasPermission);
            resolve(hasPermission);
          }
        });
      } catch (e) {
        const ts = Date.now();
        console.warn('[useFilePermission] hasFilePermission threw exception', {
          timestamp: new Date(ts).toISOString(),
          exception: e,
          durationMs: ts - start,
        });
        setGranted(false);
        resolve(false);
      }
    });
  }, [granted]);

  const request = useCallback(async () => {
    const start = Date.now();
    const m = NativeModules.FilePermissionModule;
    console.debug(
      '[useFilePermission] request() called at',
      new Date(start).toISOString(),
    );
    console.debug('[useFilePermission] native module present?', !!m, {
      moduleKeys: m ? Object.keys(m) : null,
    });

    if (!m || typeof m.requestFilePermission !== 'function') {
      console.warn(
        '[useFilePermission] native requestFilePermission not available',
      );
      return false;
    }

    return new Promise<boolean>((resolve) => {
      try {
        console.debug(
          '[useFilePermission] invoking native requestFilePermission at',
          Date.now(),
        );
        m.requestFilePermission((error, result) => {
          const ts = Date.now();
          if (error) {
            console.warn('[useFilePermission] requestFilePermission -> ERROR', {
              timestamp: new Date(ts).toISOString(),
              error,
              durationMs: ts - start,
            });
            setGranted(false);
            resolve(false);
          } else {
            const isGranted = (result ?? false) as boolean;
            console.debug(
              '[useFilePermission] requestFilePermission -> RESULT',
              {
                timestamp: new Date(ts).toISOString(),
                result: isGranted,
                rawResult: result,
                durationMs: ts - start,
              },
            );
            setGranted(isGranted);
            resolve(isGranted);
          }
        });
      } catch (e) {
        const ts = Date.now();
        console.warn(
          '[useFilePermission] requestFilePermission threw exception',
          {
            timestamp: new Date(ts).toISOString(),
            exception: e,
            durationMs: ts - start,
          },
        );
        setGranted(false);
        resolve(false);
      }
    });
  }, []);

  return { granted, check, request };
}
