// WebView utilities
// Utility functions for WebView operations following LynxJS patterns

import { createRef } from '@lynx-js/react';

/**
 * Create a ref for WebView elements following LynxJS patterns
 */
export function createWebViewRef() {
  return createRef<HTMLElement>();
}

/**
 * WebView constants and configurations
 */
export const WebViewDefaults = {
  useCustomTabs: false,
  showTitle: true,
  enableZoom: true,
  javaScriptEnabled: true,
  controlsPosition: 'bottom' as const,
  showAddressBar: true,
  showLoadingIndicator: true,
};

/**
 * Common WebView styles following LynxJS CSS patterns
 */
export const WebViewStyles = {
  container: {
    flex: '1',
    width: '100%',
    height: '100%',
  },
  webView: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  button: {
    padding: '8px',
    marginLeft: '4px',
    marginRight: '4px',
    backgroundColor: '#007AFF',
    borderRadius: '4px',
    color: 'white',
  },
  disabledButton: {
    padding: '8px',
    marginLeft: '4px',
    marginRight: '4px',
    backgroundColor: '#ccc',
    borderRadius: '4px',
    opacity: '0.5',
    color: 'white',
  },
  addressBar: {
    flex: '1',
    marginLeft: '8px',
    fontSize: '14px',
    color: '#666',
    backgroundColor: 'white',
    padding: '6px',
    borderRadius: '4px',
    borderWidth: '1px',
    borderColor: '#ddd',
  },
};
