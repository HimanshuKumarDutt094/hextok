/// <reference types="@lynx-js/rspeedy/client" />

import * as Lynx from '@lynx-js/types';

// Storage options for secure storage module
export type StorageOptions = {
  name?: string;
  encrypt?: boolean;
  ttl?: number | null;
};

// WebBrowser types
export interface WebBrowserOpenOptions {
  // Color customization
  toolbarColor?: string;
  controlsColor?: string;
  secondaryToolbarColor?: string;

  // Android specific
  browserPackage?: string;
  enableBarCollapsing?: boolean;
  showTitle?: boolean;
  enableDefaultShareMenuItem?: boolean;
  showInRecents?: boolean;
  createTask?: boolean;

  // iOS specific
  dismissButtonStyle?: 'done' | 'close' | 'cancel';
  readerMode?: boolean;
  presentationStyle?:
    | 'fullScreen'
    | 'pageSheet'
    | 'formSheet'
    | 'currentContext'
    | 'overFullScreen'
    | 'overCurrentContext'
    | 'popover'
    | 'automatic';

  // Web specific
  windowName?: string;
  windowFeatures?: string | Record<string, unknown>;
}

export interface AuthSessionOpenOptions extends WebBrowserOpenOptions {
  preferEphemeralSession?: boolean;
}

export interface WebBrowserResult {
  type: 'cancel' | 'dismiss' | 'opened' | 'locked';
}

export interface WebBrowserRedirectResult {
  type: 'success';
  url: string;
}

export type WebBrowserAuthSessionResult =
  | WebBrowserRedirectResult
  | WebBrowserResult;

export interface WebBrowserCustomTabsResults {
  defaultBrowserPackage?: string;
  preferredBrowserPackage?: string;
  browserPackages: string[];
  servicePackages: string[];
}

export interface ServiceActionResult {
  servicePackage?: string;
}

export interface WebBrowserCompleteAuthSessionResult {
  type: 'success' | 'failed';
  message: string;
}

// WebBrowser constants
export const WebBrowserResultType = {
  CANCEL: 'cancel' as const,
  DISMISS: 'dismiss' as const,
  OPENED: 'opened' as const,
  LOCKED: 'locked' as const,
} as const;

export const WebBrowserPresentationStyle = {
  FULL_SCREEN: 'fullScreen' as const,
  PAGE_SHEET: 'pageSheet' as const,
  FORM_SHEET: 'formSheet' as const,
  CURRENT_CONTEXT: 'currentContext' as const,
  OVER_FULL_SCREEN: 'overFullScreen' as const,
  OVER_CURRENT_CONTEXT: 'overCurrentContext' as const,
  POPOVER: 'popover' as const,
  AUTOMATIC: 'automatic' as const,
} as const;

export const WebBrowserErrorCodes = {
  ERR_WEB_BROWSER_REDIRECT: 'ERR_WEB_BROWSER_REDIRECT',
  ERR_WEB_BROWSER_BLOCKED: 'ERR_WEB_BROWSER_BLOCKED',
  ERR_WEB_BROWSER_CRYPTO: 'ERR_WEB_BROWSER_CRYPTO',
} as const;

export type WebBrowserErrorCode =
  (typeof WebBrowserErrorCodes)[keyof typeof WebBrowserErrorCodes];

export type WebBrowserWindowFeatures = Record<
  string,
  number | boolean | string
>;
export type WebBrowserWarmUpResult = ServiceActionResult;
export type WebBrowserMayInitWithUrlResult = ServiceActionResult;
export type WebBrowserCoolDownResult = ServiceActionResult;

export interface LynxFileDescriptor {
  uri: string;
  name?: string;
  base64?: string;
  size?: number;
  mimeType?: string;
  lastModified?: number;
}

// Global type extensions
declare module '@lynx-js/types' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface GlobalProps {
    /**
     * Define your global properties in this interface.
     * These types will be accessible through `lynx.__globalProps`.
     */
  }

  // Custom element definitions
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    'explorer-input': {
      id?: string;
      value?: string | undefined;
      placeholder?: string;
      maxLength?: number;
      type?: 'text' | 'password' | 'email' | 'number';
      disabled?: boolean;
      bindinput?: (
        e: Lynx.BaseEvent<'input', { value: string; cursor: number }>,
      ) => void;
      bindfocus?: (e: Lynx.BaseEvent<'focus', Record<string, unknown>>) => void;
      bindblur?: (e: Lynx.BaseEvent<'blur', Record<string, unknown>>) => void;
      bindchange?: (
        e: Lynx.BaseEvent<'change', Record<string, unknown>>,
      ) => void;
      style?: string | Lynx.CSSProperties;
      className?: string;
    };

    button: {
      id?: string;
      name?: string;

      // Content
      text?: string;

      // Behavior props
      disabled?: boolean;
      androidDisableSound?: boolean;
      unstablePressDelay?: number;
      delayLongPress?: number;

      // Ripple effect (Android)
      rippleColor?: string;
      rippleBorderless?: boolean;
      rippleRadius?: number;
      rippleForeground?: boolean;

      // Hit testing
      hitSlop?:
        | number
        | { top?: number; left?: number; right?: number; bottom?: number };
      pressRetentionOffset?:
        | number
        | { top?: number; left?: number; right?: number; bottom?: number };

      // Testing
      testOnlyPressed?: boolean;

      // Press event handlers
      bindpress?: (
        e: Lynx.BaseEvent<
          'press',
          {
            pressed: boolean;
            timestamp: number;
            locationX: number;
            locationY: number;
            pageX: number;
            pageY: number;
          }
        >,
      ) => void;

      bindpressIn?: (
        e: Lynx.BaseEvent<
          'pressIn',
          {
            pressed: boolean;
            timestamp: number;
            locationX: number;
            locationY: number;
            pageX: number;
            pageY: number;
          }
        >,
      ) => void;

      bindpressOut?: (
        e: Lynx.BaseEvent<
          'pressOut',
          {
            pressed: boolean;
            timestamp: number;
            locationX: number;
            locationY: number;
            pageX: number;
            pageY: number;
          }
        >,
      ) => void;

      bindpressMove?: (
        e: Lynx.BaseEvent<
          'pressMove',
          {
            pressed: boolean;
            timestamp: number;
            locationX: number;
            locationY: number;
            pageX: number;
            pageY: number;
          }
        >,
      ) => void;

      bindlongPress?: (
        e: Lynx.BaseEvent<
          'longPress',
          {
            pressed: boolean;
            timestamp: number;
            locationX: number;
            locationY: number;
            pageX: number;
            pageY: number;
          }
        >,
      ) => void;

      // Hover event handlers (for devices that support it)
      bindhoverIn?: (
        e: Lynx.BaseEvent<
          'hoverIn',
          {
            pressed: boolean;
            timestamp: number;
            locationX: number;
            locationY: number;
            pageX: number;
            pageY: number;
          }
        >,
      ) => void;

      bindhoverOut?: (
        e: Lynx.BaseEvent<
          'hoverOut',
          {
            pressed: boolean;
            timestamp: number;
            locationX: number;
            locationY: number;
            pageX: number;
            pageY: number;
          }
        >,
      ) => void;

      // Standard attributes
      style?: string | Lynx.CSSProperties;
      className?: string;

      // Accessibility
      'accessibility-element'?: boolean;
      'accessibility-label'?: string;
      'accessibility-trait'?: 'none' | 'button' | 'image' | 'text';

      // Children as function or elements
      children?:
        | React.ReactNode
        | ((state: { pressed: boolean }) => React.ReactNode);
    };

    'explorer-textarea': {
      id?: string;
      value?: string | undefined;
      placeholder?: string;
      maxLength?: number;
      rows?: number;
      disabled?: boolean;
      bindinput?: (
        e: Lynx.BaseEvent<'input', { value: string; cursor: number }>,
      ) => void;
      bindfocus?: (e: Lynx.BaseEvent<'focus', Record<string, unknown>>) => void;
      bindblur?: (e: Lynx.BaseEvent<'blur', Record<string, unknown>>) => void;
      bindchange?: (
        e: Lynx.BaseEvent<'change', Record<string, unknown>>,
      ) => void;
      style?: string | Lynx.CSSProperties;
      className?: string;
    };

    'media-player': {
      id?: string;
      src?: string;
      autoplay?: boolean;
      bindprepared?: (
        e: Lynx.BaseEvent<'prepared', Record<string, unknown>>,
      ) => void;
      bindended?: (e: Lynx.BaseEvent<'ended', Record<string, unknown>>) => void;
      binderror?: (e: Lynx.BaseEvent<'error', Record<string, unknown>>) => void;
      style?: string | Lynx.CSSProperties;
      className?: string;
    };

    'media-view': {
      id?: string;
      src?: string;
      controls?: boolean;
      autoplay?: boolean;
      loop?: boolean;
      muted?: boolean;
      poster?: string;
      bindloadstart?: (
        e: Lynx.BaseEvent<'loadstart', Record<string, unknown>>,
      ) => void;
      bindloadeddata?: (
        e: Lynx.BaseEvent<'loadeddata', Record<string, unknown>>,
      ) => void;
      bindcanplay?: (
        e: Lynx.BaseEvent<'canplay', Record<string, unknown>>,
      ) => void;
      bindplay?: (e: Lynx.BaseEvent<'play', Record<string, unknown>>) => void;
      bindpause?: (e: Lynx.BaseEvent<'pause', Record<string, unknown>>) => void;
      bindended?: (e: Lynx.BaseEvent<'ended', Record<string, unknown>>) => void;
      binderror?: (e: Lynx.BaseEvent<'error', Record<string, unknown>>) => void;
      style?: string | Lynx.CSSProperties;
      className?: string;
    };

    'chart-view': {
      id?: string;
      data?: Array<Record<string, unknown>>;
      animate?: boolean;
      bindpointSelect?: (
        e: Lynx.BaseEvent<'pointSelect', Record<string, unknown>>,
      ) => void;
      style?: string | Lynx.CSSProperties;
      className?: string;
    };

    'web-view': {
      id?: string;
      src?: string;
      url?: string;
      redirectUrl?: string;
      useCustomTabs?: boolean;
      'use-custom-tabs'?: boolean;
      toolbarColor?: string;
      'toolbar-color'?: string;
      controlsColor?: string;
      'controls-color'?: string;
      showTitle?: boolean;
      'show-title'?: boolean;
      enableBarCollapsing?: boolean;
      'enable-bar-collapsing'?: boolean;
      'enable-zoom'?: boolean;
      'javascript-enabled'?: boolean;
      bindload?: (
        e: Lynx.BaseEvent<
          'load',
          {
            url: string;
            canGoBack: boolean;
            canGoForward: boolean;
            title?: string;
          }
        >,
      ) => void;
      binderror?: (
        e: Lynx.BaseEvent<
          'error',
          { url: string; code: number; description: string }
        >,
      ) => void;
      bindnavigation?: (
        e: Lynx.BaseEvent<
          'navigation',
          { url: string; navigationType: string }
        >,
      ) => void;
      bindnavigationstatechange?: (
        e: Lynx.BaseEvent<
          'navigationstatechange',
          { url: string; navigationType: string }
        >,
      ) => void;
      bindredirect?: (
        e: Lynx.BaseEvent<'redirect', { url: string; type: string }>,
      ) => void;
      bindclose?: (e: Lynx.BaseEvent<'close', Record<string, unknown>>) => void;
      style?: string | Lynx.CSSProperties;
      className?: string;
      /**
       * Ref for the underlying web-view element. Accepts callback refs, RefObjects, or direct element.
       * This allows using React-style `useRef` or callback refs with `<web-view ref={...} />`.
       */
      ref?:
        | ((instance: HTMLElement | null) => void)
        | { current: HTMLElement | null }
        | HTMLElement
        | null;
    };
  }
}

// Native Module declarations
declare global {
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
    export(
      handle: string,
      options?: { includeMeta?: boolean },
    ): Promise<string>;
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

  interface LynxFilePickerModule {
    open(options?: {
      multiple?: boolean;
      accepts?: string;
      includeBase64?: boolean;
    }): Promise<LynxFileDescriptor[]>;
  }

  interface LynxFilePermissionModule {
    hasFilePermission(): Promise<boolean>;
    requestFilePermission(): Promise<boolean>;
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

  // Local Storage Module for persistent storage
  interface LynxLocalStorageModule {
    setStorageItem(key: string, value: string): void;
    getStorageItem(key: string, callback: (value: string | null) => void): void;
    removeStorageItem(key: string): void;
    clearStorage(): void;
    getAllKeys(callback: (keys: string[]) => void): void;
  }

  // Mobile OAuth flow types
  interface MobileOAuthStartOptions {
    redirectUri?: string;
    state: string;
    baseUrl?: string;
  }

  interface MobileOAuthResult {
    status: 'success' | 'error';
    token?: string;
    userId?: string;
    expiresIn?: number;
    state?: string;
    error?: string;
    errorDescription?: string;
  }

  interface MobileTokenExchangeRequest {
    token: string;
  }

  interface MobileTokenExchangeResponse {
    token: string;
    expiresIn: number;
    userId: number;
    sessionId: number;
  }

  // Deep link native module interface
  interface LynxDeepLinkModule {
    /** Test method to verify module is working */
    testMethod(): void;

    /** Get the last received deep link data */
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

    /** Clear the stored deep link data */
    clearDeepLink(): void;

    /** Check if there is stored deep link data */
    hasDeepLink(callback: (hasData: boolean) => void): void;
  } // NativeModules declaration following LynxJS pattern
  declare let NativeModules: {
    SecureStorage: LynxSecureStorageModule;
    FilePicker: LynxFilePickerModule;
    FilePermission: LynxFilePermissionModule;
    NativeAuthModule: LynxNativeAuthModule;
    LynxWebBrowserModule: LynxWebBrowserModule;
    LocalStorageModule: LynxLocalStorageModule;
    /** Deep link module added for hextok:// handling */
    DeepLinkModule: LynxDeepLinkModule;
  };
}

// Re-export types for convenience
export type {
  StorageOptions,
  WebBrowserOpenOptions,
  AuthSessionOpenOptions,
  WebBrowserResult,
  WebBrowserRedirectResult,
  WebBrowserAuthSessionResult,
  WebBrowserCustomTabsResults,
  ServiceActionResult,
  WebBrowserCompleteAuthSessionResult,
  WebBrowserWindowFeatures,
  WebBrowserWarmUpResult,
  WebBrowserMayInitWithUrlResult,
  WebBrowserCoolDownResult,
  WebBrowserErrorCode,
  LynxFileDescriptor,
  MobileOAuthStartOptions,
  MobileOAuthResult,
  MobileTokenExchangeRequest,
  MobileTokenExchangeResponse,
};

// This export makes the file a module
export {};
