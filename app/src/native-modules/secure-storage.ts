/* eslint-disable @typescript-eslint/no-unused-vars */
// TypeScript wrapper for SecureStorage native module
// This file provides a typed interface that matches docs/native-modules/secure-storage.md

export type StorageOptions = {
  name?: string;
  encrypt?: boolean;
  ttl?: number | null;
};

export interface ISecureStorage {
  open(options?: StorageOptions): Promise<string>;
  close(handle: string): Promise<void>;

  get(handle: string, key: string): Promise<string | null>;
  set(
    handle: string,
    key: string,
    value: string,
    options?: { ttl?: number | null },
  ): Promise<void>;
  remove(handle: string, key: string): Promise<void>;
  has(handle: string, key: string): Promise<boolean>;

  setBinary(handle: string, key: string, valueBase64: string): Promise<void>;
  getBinary(handle: string, key: string): Promise<string | null>;

  multiGet(
    handle: string,
    keys: string[],
  ): Promise<Array<[string, string | null]>>;
  multiSet(handle: string, pairs: Array<[string, string]>): Promise<void>;
  multiRemove(handle: string, keys: string[]): Promise<void>;

  transaction(
    handle: string,
    operations: Array<{ type: 'set' | 'remove'; key: string; value?: string }>,
  ): Promise<void>;

  clear(handle: string): Promise<void>;
  getKeys(handle: string): Promise<string[]>;
  getUsage(handle: string): Promise<{ bytesUsed: number; itemCount: number }>;

  migrateFromAsyncStorage(handle: string, adapterId?: string): Promise<void>;

  export(handle: string, options?: { includeMeta?: boolean }): Promise<string>;
  import(
    handle: string,
    blobBase64: string,
    options?: { overwrite?: boolean },
  ): Promise<void>;
}

// Updated interface for error-first callback pattern
interface NativeSecureStorageModule {
  open(
    options: Record<string, unknown> | null,
    callback: (
      error: { code: string; message: string } | null,
      result?: string,
    ) => void,
  ): void;
  close(
    handle: string,
    callback: (error: { code: string; message: string } | null) => void,
  ): void;
  get(
    handle: string,
    key: string,
    callback: (
      error: { code: string; message: string } | null,
      result?: string | null,
    ) => void,
  ): void;
  set(
    handle: string,
    key: string,
    value: string,
    options: Record<string, unknown> | null,
    callback: (error: { code: string; message: string } | null) => void,
  ): void;
  remove(
    handle: string,
    key: string,
    callback: (error: { code: string; message: string } | null) => void,
  ): void;
  has(
    handle: string,
    key: string,
    callback: (
      error: { code: string; message: string } | null,
      result?: boolean,
    ) => void,
  ): void;
  setBinary(
    handle: string,
    key: string,
    valueBase64: string,
    callback: (error: { code: string; message: string } | null) => void,
  ): void;
  getBinary(
    handle: string,
    key: string,
    callback: (
      error: { code: string; message: string } | null,
      result?: string | null,
    ) => void,
  ): void;
  clear(
    handle: string,
    callback: (error: { code: string; message: string } | null) => void,
  ): void;
  getKeys(
    handle: string,
    callback: (
      error: { code: string; message: string } | null,
      result?: string[],
    ) => void,
  ): void;
  getUsage(
    handle: string,
    callback: (
      error: { code: string; message: string } | null,
      result?: { bytesUsed: number; itemCount: number },
    ) => void,
  ): void;
}

// Bridge to native. We expect a global `NativeModules` object that exposes native modules.
const getNative = (): NativeSecureStorageModule => {
  const g = globalThis as unknown as {
    Lynx?: { modules?: Record<string, unknown> };
  };
  const lynx = g.Lynx;
  const mod =
    lynx?.modules?.SecureStorage ||
    (globalThis as unknown as { NativeModules?: Record<string, unknown> })
      .NativeModules?.SecureStorage;
  if (!mod) {
    throw new Error('Native module SecureStorage is not registered.');
  }
  return mod as NativeSecureStorageModule;
};

// Helper function to promisify the error-first callback pattern
function promisify<T>(
  fn: (
    callback: (
      error: { code: string; message: string } | null,
      result?: T,
    ) => void,
  ) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result as T);
      }
    });
  });
}

const SecureStorage: ISecureStorage = {
  open: (options?: StorageOptions) =>
    promisify<string>((callback) =>
      getNative().open(options || null, callback),
    ),

  close: (handle: string) =>
    promisify<void>((callback) => getNative().close(handle, callback)),

  get: (handle: string, key: string) =>
    promisify<string | null>((callback) =>
      getNative().get(handle, key, callback),
    ),

  set: (
    handle: string,
    key: string,
    value: string,
    options?: { ttl?: number | null },
  ) =>
    promisify<void>((callback) =>
      getNative().set(handle, key, value, options || null, callback),
    ),

  remove: (handle: string, key: string) =>
    promisify<void>((callback) => getNative().remove(handle, key, callback)),

  has: (handle: string, key: string) =>
    promisify<boolean>((callback) => getNative().has(handle, key, callback)),

  setBinary: (handle: string, key: string, valueBase64: string) =>
    promisify<void>((callback) =>
      getNative().setBinary(handle, key, valueBase64, callback),
    ),

  getBinary: (handle: string, key: string) =>
    promisify<string | null>((callback) =>
      getNative().getBinary(handle, key, callback),
    ),

  multiGet: async (handle: string, keys: string[]) => {
    // Not implemented in Android module yet, return empty result
    return keys.map((key) => [key, null] as [string, string | null]);
  },

  multiSet: async (handle: string, pairs: Array<[string, string]>) => {
    // Not implemented in Android module yet, use individual sets
    for (const [key, value] of pairs) {
      await SecureStorage.set(handle, key, value);
    }
  },

  multiRemove: async (handle: string, keys: string[]) => {
    // Not implemented in Android module yet, use individual removes
    for (const key of keys) {
      await SecureStorage.remove(handle, key);
    }
  },

  transaction: async (
    handle: string,
    operations: Array<{ type: 'set' | 'remove'; key: string; value?: string }>,
  ) => {
    // Not implemented in Android module yet, execute operations sequentially
    for (const op of operations) {
      if (op.type === 'set' && op.value !== undefined) {
        await SecureStorage.set(handle, op.key, op.value);
      } else if (op.type === 'remove') {
        await SecureStorage.remove(handle, op.key);
      }
    }
  },

  clear: (handle: string) =>
    promisify<void>((callback) => getNative().clear(handle, callback)),

  getKeys: (handle: string) =>
    promisify<string[]>((callback) => getNative().getKeys(handle, callback)),

  getUsage: (handle: string) =>
    promisify<{ bytesUsed: number; itemCount: number }>((callback) =>
      getNative().getUsage(handle, callback),
    ),

  migrateFromAsyncStorage: async (_handle: string, _adapterId?: string) => {
    // Not implemented in Android module yet, no-op
    return;
  },

  export: async (_handle: string, _options?: { includeMeta?: boolean }) => {
    // Not implemented in Android module yet, return empty export
    return '';
  },

  import: async (
    _handle: string,
    _blobBase64: string,
    _options?: { overwrite?: boolean },
  ) => {
    // Not implemented in Android module yet, no-op
    return;
  },
};

export default SecureStorage;
