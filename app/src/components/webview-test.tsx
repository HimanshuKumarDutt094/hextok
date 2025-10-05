import { useState, useCallback } from '@lynx-js/react';
import type { ReactElement } from '@lynx-js/react';
import WebView, { WebViewWithControls } from './WebView';
import type {
  WebViewLoadEvent,
  WebViewErrorEvent,
  WebViewNavigationEvent,
  WebViewRedirectEvent,
} from './WebView';

export default function WebViewTest(): ReactElement {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [loadStatus, setLoadStatus] = useState<string>('Ready');
  const [lastEvent, setLastEvent] = useState<string>('');

  const handleLoad = useCallback((event: WebViewLoadEvent) => {
    'background only';
    console.log('WebView loaded:', event.detail.url);
    setCurrentUrl(event.detail.url);
    setLoadStatus(`Loaded: ${event.detail.title || 'Untitled'}`);
    setLastEvent(`Load: ${event.detail.url}`);
  }, []);

  const handleError = useCallback((event: WebViewErrorEvent) => {
    'background only';
    console.error('WebView error:', event.detail);
    setLoadStatus(`Error: ${event.detail.description}`);
    setLastEvent(`Error: ${event.detail.code} - ${event.detail.description}`);
  }, []);

  const handleNavigation = useCallback((event: WebViewNavigationEvent) => {
    'background only';
    console.log('WebView navigation:', event.detail);
    setLoadStatus('Navigating...');
    setLastEvent(
      `Navigation: ${event.detail.navigationType} to ${event.detail.url}`,
    );
  }, []);

  const handleRedirect = useCallback((event: WebViewRedirectEvent) => {
    'background only';
    console.log('WebView redirect:', event.detail);
    setLastEvent(`Redirect: ${event.detail.url}`);
  }, []);

  return (
    <view style={{ padding: '12px' }}>
      <text
        style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 'bold' }}
      >
        WebView Test — Enhanced Implementation
      </text>

      <view
        style={{
          marginBottom: '16px',
          padding: '8px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <text style={{ fontSize: '14px', marginBottom: '4px' }}>
          Status: {loadStatus}
        </text>
        <text style={{ fontSize: '12px', color: '#666' }}>
          Current URL: {currentUrl || 'None'}
        </text>
        <text style={{ fontSize: '12px', color: '#666' }}>
          Last Event: {lastEvent || 'None'}
        </text>
      </view>

      <text
        style={{ marginTop: '8px', marginBottom: '6px', fontWeight: 'bold' }}
      >
        1) Basic WebView with event handling
      </text>
      <WebView
        src="https://www.google.com"
        onLoad={handleLoad}
        onError={handleError}
        onNavigation={handleNavigation}
        onRedirect={handleRedirect}
        style={{
          width: '100%',
          height: '200px',
          borderRadius: '8px',
          borderWidth: '1px',
          borderColor: '#ccc',
        }}
      />

      <text
        style={{ marginTop: '16px', marginBottom: '6px', fontWeight: 'bold' }}
      >
        2) WebView with Custom Tabs enabled
      </text>
      <WebView
        src="https://www.wikipedia.org"
        useCustomTabs={true}
        toolbarColor="#1976d2"
        controlsColor="#ffffff"
        showTitle={true}
        enableBarCollapsing={true}
        onLoad={handleLoad}
        style={{
          width: '100%',
          height: '180px',
          borderRadius: '12px',
          borderWidth: '2px',
          borderColor: '#1976d2',
        }}
      />

      <text
        style={{ marginTop: '16px', marginBottom: '6px', fontWeight: 'bold' }}
      >
        3) WebView with enhanced settings
      </text>
      <WebView
        src="https://news.ycombinator.com"
        enable-zoom={true}
        javascript-enabled={true}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '160px',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      />

      <text
        style={{ marginTop: '16px', marginBottom: '6px', fontWeight: 'bold' }}
      >
        4) WebView with built-in navigation controls
      </text>
      <WebViewWithControls
        src="https://example.com"
        showAddressBar={true}
        controlsPosition="bottom"
        showLoadingIndicator={true}
        onLoad={handleLoad}
        onError={handleError}
        onNavigation={handleNavigation}
        style={{
          width: '100%',
          height: '250px',
          borderRadius: '8px',
          borderWidth: '1px',
          borderColor: '#ddd',
        }}
      />

      <text
        style={{ marginTop: '16px', marginBottom: '6px', fontWeight: 'bold' }}
      >
        5) OAuth/Redirect testing WebView
      </text>
      <WebView
        src="https://httpbin.org/redirect/1"
        redirectUrl="https://httpbin.org"
        onRedirect={handleRedirect}
        onLoad={handleLoad}
        style={{
          width: '100%',
          height: '140px',
          borderRadius: '8px',
          borderWidth: '1px',
          borderColor: '#ff9800',
        }}
      />
    </view>
  );
}
