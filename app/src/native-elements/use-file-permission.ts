'background only';
// Hook uses Lynx native module APIs and should be invoked from background-only code per docs.
import { useCallback, useState } from '@lynx-js/react';

// Updated types for error-first callback pattern
type PermModuleMethod = (
  callback: (
    error: { code: string; message: string } | null,
    result?: boolean,
  ) => void,
) => void;

type PermModule = {
  hasFilePermission?: PermModuleMethod;
  requestFilePermission?: PermModuleMethod;
};

function getPermModule(): PermModule | undefined {
  const g = globalThis as unknown as Record<string, unknown>;
  if ('Lynx' in g) {
    const lynx = g['Lynx'] as unknown as Record<string, unknown> | undefined;
    if (lynx && 'modules' in lynx) {
      const modules = lynx['modules'] as unknown as Record<string, unknown>;
      return modules['FilePermission'] as PermModule | undefined;
    }
  }

  if ('NativeModules' in g) {
    const nm = g['NativeModules'] as unknown as Record<string, unknown>;
    return nm['FilePermission'] as PermModule | undefined;
  }

  return undefined;
}

export function useFilePermission() {
  const [granted, setGranted] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    const m = getPermModule();
    if (!m || typeof m.hasFilePermission !== 'function') {
      setGranted(null);
      return null;
    }

    return new Promise<boolean | null>((resolve) => {
      m.hasFilePermission!((error, result) => {
        if (error) {
          setGranted(null);
          resolve(null);
        } else {
          const hasPermission = result ?? false;
          setGranted(hasPermission);
          resolve(hasPermission);
        }
      });
    });
  }, []);

  const request = useCallback(async () => {
    const m = getPermModule();
    if (!m || typeof m.requestFilePermission !== 'function') {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      m.requestFilePermission!((error, result) => {
        if (error) {
          setGranted(false);
          resolve(false);
        } else {
          const isGranted = result ?? false;
          setGranted(isGranted);
          resolve(isGranted);
        }
      });
    });
  }, []);

  return { granted, check, request };
}
