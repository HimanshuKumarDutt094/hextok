import type { LynxFileDescriptor } from './rspeedy-env';

interface LynxSecureStorageModule {
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
    operations: Array<{
      type: 'set' | 'remove';
      key: string;
      value?: string;
    }>,
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

interface LynxWebBrowserModule {
  openBrowserAsync(
    url: string,
    options: WebBrowserOpenOptions,
    callback: (error: string | null, result?: WebBrowserResult) => void,
  ): void;
  dismissBrowser(
    callback: (error: string | null, result?: WebBrowserResult) => void,
  ): void;
  openAuthSessionAsync(
    url: string,
    redirectUrl?: string | null,
    options: AuthSessionOpenOptions,
    callback: (
      error: string | null,
      result?: WebBrowserAuthSessionResult,
    ) => void,
  ): void;
  dismissAuthSession(): void;
  getCustomTabsSupportingBrowsersAsync(
    callback: (
      error: string | null,
      result?: WebBrowserCustomTabsResults,
    ) => void,
  ): void;
  warmUpAsync(
    browserPackage: string | null,
    callback: (error: string | null, result?: ServiceActionResult) => void,
  ): void;
  mayInitWithUrlAsync(
    url: string,
    browserPackage: string | null,
    callback: (error: string | null, result?: ServiceActionResult) => void,
  ): void;
  coolDownAsync(
    browserPackage: string | null,
    callback: (error: string | null, result?: ServiceActionResult) => void,
  ): void;
  maybeCompleteAuthSession(
    options: Record<string, unknown>,
    callback: (
      error: string | null,
      result?: WebBrowserCompleteAuthSessionResult,
    ) => void,
  ): void;
}

interface FilePickerModule {
  open(options?: {
    multiple?: boolean;
    accepts?: string;
    includeBase64?: boolean;
    // If true the native side should copy selected documents into the app cache
    // and return a file:// URI pointing to the copied file. Mirrors Expo's
    // copyToCacheDirectory behaviour.
    copyToCacheDirectory?: boolean;
  }): Promise<LynxFileDescriptor[]>;

  open(
    options?: {
      multiple?: boolean;
      accepts?: string;
      includeBase64?: boolean;
    },
    callback?: (
      error: { code: string; message: string } | null,
      result?: LynxFileDescriptor[],
    ) => void,
  ): void;
}

interface FilePermissionModule {
  hasFilePermission(): Promise<boolean>;
  requestFilePermission(): Promise<boolean>;

  hasFilePermission(
    callback: (
      error: { code: string; message: string } | null,
      result?: boolean,
    ) => void,
  ): void;
  requestFilePermission(
    callback: (
      error: { code: string; message: string } | null,
      result?: boolean,
    ) => void,
  ): void;
}

interface LynxNativeAuthModule {
  openAuth(
    url: string,
    options?: { callbackScheme?: string },
  ): Promise<{
    success: boolean;
    redirectUrl: string;
    sessionCookie?: string;
  }>;
  cancelAuth(): Promise<void>;
}

interface LynxLocalStorageModule {
  setStorageItem(key: string, value: string): void;
  getStorageItem(key: string, callback: (value: string | null) => void): void;
  removeStorageItem(key: string): void;
  clearStorage(): void;
  getAllKeys(callback: (keys: string[]) => void): void;
}

interface LynxDeepLinkModuleSimple {
  testMethod(): void;

  getLastDeepLink(
    callback: (
      data: {
        url: string;
        host: string;
        path: string;
        queryParams: Record<string, string | null>;
        timestamp: number;
      } | null,
    ) => void,
  ): void;

  clearDeepLink(): void;

  hasDeepLink(callback: (hasData: boolean) => void): void;
}

// Augment the upstream @lynx-js/types package with a NativeLocalStorageModule
// as documented by Lynx.
declare module '@lynx-js/types' {
  interface NativeModules {
    SecureStorage: LynxSecureStorageModule;
    FilePickerModule: FilePickerModule;
    FilePermissionModule: FilePermissionModule;
    NativeAuthModule: LynxNativeAuthModule;
    LynxWebBrowserModule: LynxWebBrowserModule;
    LocalStorageModule: LynxLocalStorageModule;
    DeepLinkModuleSimple: LynxDeepLinkModuleSimple;
    DeepLinkModule: {
      getInitialDeepLink(callback: (jsonData: string | null) => void): void;
      addDeepLinkListener(listener: DeepLinkListener): void;
      removeDeepLinkListener(listener: DeepLinkListener): void;
      removeAllDeepLinkListeners(): void;
      canHandleScheme(
        scheme: string,
        callback: (canHandle: boolean) => void,
      ): void;
      simulateDeepLink(url: string): void;
    };

    // Added from Lynx docs
    NativeLocalStorageModule: {
      setStorageItem(key: string, value: string): void;
      getStorageItem(
        key: string,
        callback: (value: string | null) => void,
      ): void;
      clearStorage(): void;
    };
  }
}

export {};
