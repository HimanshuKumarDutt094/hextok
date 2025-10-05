// WebView.tsx
// React component wrapper for LynxJS WebView custom element
// Provides a React-friendly interface to the web-view element

// React component wrapper for LynxJS WebView custom element
// Provides a React-friendly interface to the web-view element

import { useWebView } from '../hooks/useWebBrowser';
import type { ReactElement } from '@lynx-js/react';
import * as Lynx from '@lynx-js/types';

/**
 * Event type aliases using Lynx.BaseEvent for type safety
 */
export type WebViewLoadEvent = Lynx.BaseEvent<
  'load',
  {
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
    title?: string;
  }
>;

export type WebViewErrorEvent = Lynx.BaseEvent<
  'error',
  {
    url: string;
    code: number;
    description: string;
  }
>;

export type WebViewNavigationEvent = Lynx.BaseEvent<
  'navigation',
  {
    url: string;
    navigationType: string;
  }
>;

export type WebViewNavigationStateChangeEvent = Lynx.BaseEvent<
  'navigationstatechange',
  {
    url: string;
    navigationType: string;
  }
>;

export type WebViewRedirectEvent = Lynx.BaseEvent<
  'redirect',
  {
    url: string;
    type: string;
  }
>;

/**
 * Props for the WebView component
 */
export interface WebViewProps {
  /** URL to load in the WebView */
  src: string;
  /** Optional URL alias (same as src) */
  url?: string;
  /** Redirect URL for auth flows */
  redirectUrl?: string;
  /** Whether to use Custom Tabs for better performance (Android only) */
  useCustomTabs?: boolean;
  /** Toolbar color for Custom Tabs (hex color) */
  toolbarColor?: string;
  /** Controls color for Custom Tabs (hex color) */
  controlsColor?: string;
  /** Whether to show the page title */
  showTitle?: boolean;
  /** Whether to enable bar collapsing (Android Custom Tabs) */
  enableBarCollapsing?: boolean;
  /** Additional CSS styles */
  style?: Lynx.CSSProperties;
  /** Class name for styling */
  className?: string;
  /** Called when the page finishes loading */
  onLoad?: (event: WebViewLoadEvent) => void;
  /** Called when an error occurs */
  onError?: (event: WebViewErrorEvent) => void;
  /** Called when navigation starts */
  onNavigation?: (event: WebViewNavigationEvent) => void;
  /** Called when navigation state changes */
  onNavigationStateChange?: (event: WebViewNavigationStateChangeEvent) => void;
  /** Called when a redirect is detected */
  onRedirect?: (event: WebViewRedirectEvent) => void;
  /** Called when the page URL changes */
  onUrlChange?: (url: string) => void;
  /** Children elements (optional overlay content) */
  children?: ReactElement | ReactElement[];
}

/**
 * WebView component for embedding web content
 *
 * @example
 * ```tsx
 * import { WebView } from '../components/WebView';
 *
 * function MyComponent() {
 *   const handleLoad = (event) => {
 *     console.log('Page loaded:', event.detail.url);
 *   };
 *
 *   return (
 *     <WebView
 *       src="https://example.com"
 *       useCustomTabs={true}
 *       toolbarColor="#007AFF"
 *       showTitle={true}
 *       onLoad={handleLoad}
 *       style={{ height: '400px' }}
 *     />
 *   );
 * }
 * ```
 */
export function WebView({
  src,
  url,
  redirectUrl,
  useCustomTabs = false,
  toolbarColor,
  controlsColor,
  showTitle = true,
  enableBarCollapsing = true,
  style,
  className,
  onLoad,
  onError,
  onNavigation,
  onNavigationStateChange,
  onRedirect,
  onUrlChange,
  children,
}: WebViewProps): ReactElement {
  const { handleLoad, handleError, handleNavigation } = useWebView();

  // Enhanced load handler that calls user's onLoad
  const enhancedLoadHandler = (event: WebViewLoadEvent) => {
    'background only';
    handleLoad(event);
    onLoad?.(event);
    onUrlChange?.(event.detail.url);
  };

  // Enhanced error handler that calls user's onError
  const enhancedErrorHandler = (event: WebViewErrorEvent) => {
    'background only';
    handleError(event);
    onError?.(event);
  };

  // Enhanced navigation handler that calls user's onNavigation/onNavigationStateChange
  const enhancedNavigationHandler = (event: WebViewNavigationEvent) => {
    'background only';
    handleNavigation();
    onNavigation?.(event);
  };

  const enhancedNavigationStateChangeHandler = (
    event: WebViewNavigationStateChangeEvent,
  ) => {
    'background only';
    handleNavigation();
    onNavigationStateChange?.(event);
  };

  // Enhanced redirect handler
  const enhancedRedirectHandler = (event: WebViewRedirectEvent) => {
    'background only';
    onRedirect?.(event);
  };

  const webViewStyle: Lynx.CSSProperties = {
    width: '100%',
    height: '100%',
    ...style,
  };

  // Use the provided URL or fallback to src
  const webViewUrl = url || src;

  return (
    <view className={className}>
      <web-view
        id="webview-instance"
        src={webViewUrl}
        url={webViewUrl}
        redirectUrl={redirectUrl}
        use-custom-tabs={useCustomTabs}
        toolbar-color={toolbarColor}
        controls-color={controlsColor}
        show-title={showTitle}
        enable-bar-collapsing={enableBarCollapsing}
        bindload={enhancedLoadHandler}
        binderror={enhancedErrorHandler}
        bindnavigation={enhancedNavigationHandler}
        bindnavigationstatechange={enhancedNavigationStateChangeHandler}
        bindredirect={enhancedRedirectHandler}
        style={webViewStyle}
      />
      {children}
    </view>
  );
}

/**
 * WebView with built-in navigation controls
 *
 * @example
 * ```tsx
 * import { WebViewWithControls } from '../components/WebView';
 *
 * function BrowserComponent() {
 *   return (
 *     <WebViewWithControls
 *       src="https://example.com"
 *       showAddressBar={true}
 *       controlsPosition="bottom"
 *     />
 *   );
 * }
 * ```
 */
export interface WebViewWithControlsProps extends WebViewProps {
  /** Whether to show the address bar */
  showAddressBar?: boolean;
  /** Position of navigation controls */
  controlsPosition?: 'top' | 'bottom';
  /** Custom styles for the controls */
  controlsStyle?: Lynx.CSSProperties;
  /** Whether to show the loading indicator */
  showLoadingIndicator?: boolean;
}

export function WebViewWithControls({
  showAddressBar = true,
  controlsPosition = 'bottom',
  controlsStyle = {},
  showLoadingIndicator = true,
  ...webViewProps
}: WebViewWithControlsProps): ReactElement {
  const {
    currentUrl,
    canGoBack,
    canGoForward,
    isLoading,
    goBack,
    goForward,
    reload,
  } = useWebView();

  const controlsDefaultStyle: Lynx.CSSProperties = {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderTopWidth: controlsPosition === 'bottom' ? '1px' : '0px',
    borderBottomWidth: controlsPosition === 'top' ? '1px' : '0px',
    borderColor: '#ccc',
    ...controlsStyle,
  };

  const buttonStyle: Lynx.CSSProperties = {
    padding: '8px',
    marginLeft: '4px',
    marginRight: '4px',
    backgroundColor: '#007AFF',
    borderRadius: '4px',
    opacity: '1',
  };

  const disabledButtonStyle: Lynx.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    opacity: '0.5',
  };

  const Controls = () => (
    <view style={controlsDefaultStyle}>
      <view
        style={canGoBack ? buttonStyle : disabledButtonStyle}
        bindtap={canGoBack ? goBack : undefined}
      >
        <text style={{ color: 'white', fontSize: '16px' }}>←</text>
      </view>

      <view
        style={canGoForward ? buttonStyle : disabledButtonStyle}
        bindtap={canGoForward ? goForward : undefined}
      >
        <text style={{ color: 'white', fontSize: '16px' }}>→</text>
      </view>

      <view style={buttonStyle} bindtap={reload}>
        <text style={{ color: 'white', fontSize: '16px' }}>⟳</text>
      </view>

      {showAddressBar && (
        <view style={{ flex: '1', marginLeft: '8px' }}>
          <text
            style={{
              fontSize: '14px',
              color: '#666',
              backgroundColor: 'white',
              padding: '6px',
              borderRadius: '4px',
              borderWidth: '1px',
              borderColor: '#ddd',
            }}
          >
            {currentUrl || webViewProps.src}
          </text>
        </view>
      )}

      {showLoadingIndicator && isLoading && (
        <view style={{ marginLeft: '8px' }}>
          <text style={{ fontSize: '12px', color: '#666' }}>Loading...</text>
        </view>
      )}
    </view>
  );

  const containerStyle: Lynx.CSSProperties = {
    flex: '1',
  };

  // Pass sizing/style props to the inner WebView so the element itself is sized
  const innerWebViewStyle: Lynx.CSSProperties = {
    flex: '1',
    ...(webViewProps.style || {}),
  };

  return (
    <view style={containerStyle}>
      {controlsPosition === 'top' && <Controls />}

      <WebView {...webViewProps} style={innerWebViewStyle} />

      {controlsPosition === 'bottom' && <Controls />}
    </view>
  );
}

export default WebView;
