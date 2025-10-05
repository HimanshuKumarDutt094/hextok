'background only';
// This module calls Lynx native modules and must be used from background thread scripting.
export type FileDescriptor = {
  uri: string;
  name?: string;
  base64?: string;
  size?: number;
};

// Updated type for error-first callback pattern
type FilePickerOpenFn = (
  opts: {
    multiple?: boolean;
    accepts?: string;
    includeBase64?: boolean;
  },
  callback: (
    error: { code: string; message: string } | null,
    result?: FileDescriptor[],
  ) => void,
) => void;

type FilePermissionFn = (
  callback: (
    error: { code: string; message: string } | null,
    result?: boolean,
  ) => void,
) => void;

type PossibleGlobals = {
  Lynx?: { modules?: Record<string, unknown> };
  NativeModules?: Record<string, unknown>;
};

export async function openFilePicker(options?: {
  multiple?: boolean;
  accepts?: string;
  includeBase64?: boolean;
}): Promise<FileDescriptor[] | null> {
  try {
    const g = globalThis as unknown as PossibleGlobals;

    // Ask the FilePermission module first if available
    type PermModuleShape = {
      hasFilePermission?: FilePermissionFn;
      requestFilePermission?: FilePermissionFn;
    };
    const maybePerm = g.Lynx?.modules
      ? (g.Lynx!.modules!['FilePermission'] as unknown)
      : g.NativeModules?.FilePermission;
    const permModule = maybePerm as PermModuleShape | undefined;

    if (permModule && typeof permModule.hasFilePermission === 'function') {
      const hasPermission = await new Promise<boolean>((resolve) => {
        permModule.hasFilePermission!((error, result) => {
          if (error) {
            resolve(false);
          } else {
            resolve(result ?? false);
          }
        });
      });

      if (!hasPermission) {
        if (typeof permModule.requestFilePermission === 'function') {
          const granted = await new Promise<boolean>((resolve) => {
            permModule.requestFilePermission!((error, result) => {
              if (error) {
                resolve(false);
              } else {
                resolve(result ?? false);
              }
            });
          });
          if (!granted) return null;
        } else {
          return null;
        }
      }
    }

    // Try Lynx modules first
    const maybeModule = g.Lynx?.modules
      ? (g.Lynx!.modules!['FilePicker'] as unknown)
      : undefined;
    if (maybeModule) {
      const m = maybeModule as { open?: unknown };
      if (m.open && typeof m.open === 'function') {
        const fn = m.open as unknown as FilePickerOpenFn;
        return await new Promise<FileDescriptor[] | null>((resolve) => {
          fn(options || {}, (error, result) => {
            if (error) {
              console.warn('FilePicker open error', error);
              resolve(null);
            } else {
              resolve(result || null);
            }
          });
        });
      }
    }

    // Try NativeModules
    const maybeNative = g.NativeModules
      ? (g.NativeModules['FilePicker'] as unknown)
      : undefined;
    if (maybeNative) {
      const nm = maybeNative as { open?: unknown };
      if (nm.open && typeof nm.open === 'function') {
        const fn = nm.open as unknown as FilePickerOpenFn;
        return await new Promise<FileDescriptor[] | null>((resolve) => {
          fn(options || {}, (error, result) => {
            if (error) {
              console.warn('FilePicker open error', error);
              resolve(null);
            } else {
              resolve(result || null);
            }
          });
        });
      }
    }

    return null;
  } catch (err) {
    console.warn('FilePicker open error', err);
    return null;
  }
}
