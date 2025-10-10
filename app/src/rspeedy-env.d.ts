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

// Deep Link types
export interface DeepLinkData {
  /** The complete URL that was opened (e.g., "hextok://profile/user123") */
  url: string;
  /** The path portion after the scheme (e.g., "/profile/user123") */
  path: string;
  /** Query parameters as key-value pairs */
  queryParams: Record<string, string>;
  /** The URL scheme used (e.g., "hextok") */
  scheme: string;
  /** Host portion if present (e.g., "app" in "hextok://app/home") */
  host?: string;
}

export type DeepLinkListener = (jsonData: string) => void;

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

    // Native 'video' element (custom Lynx behavior)
    video: {
      // id?: string;
      src: string;
      // 'video-src'?: string;
      // controls?: boolean;
      // autoplay?: boolean;
      // loop?: boolean;
      // muted?: boolean;
      // poster?: string;
      // // Event bindings
      // bindloadstart?: (
      //   e: Lynx.BaseEvent<'loadstart', Record<string, unknown>>,
      // ) => void;
      // bindloadeddata?: (
      //   e: Lynx.BaseEvent<'loadeddata', Record<string, unknown>>,
      // ) => void;
      // bindcanplay?: (
      //   e: Lynx.BaseEvent<'canplay', Record<string, unknown>>,
      // ) => void;
      // bindplay?: (e: Lynx.BaseEvent<'play', Record<string, unknown>>) => void;
      // bindpause?: (e: Lynx.BaseEvent<'pause', Record<string, unknown>>) => void;
      // bindended?: (e: Lynx.BaseEvent<'ended', Record<string, unknown>>) => void;
      // binderror?: (e: Lynx.BaseEvent<'error', Record<string, unknown>>) => void;
      // style?: string | Lynx.CSSProperties;
      // className?: string;
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

// Native module type declarations were moved to `typing.d.ts`.
// Keep intrinsic elements and other Lynx types in this file.

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
  DeepLinkData,
  DeepLinkListener,
};

// This export makes the file a module
export {};
