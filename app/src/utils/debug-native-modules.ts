// Debug utilities for LynxJS native modules
// Helps diagnose native module registration and availability issues

export interface NativeModuleDebugInfo {
  isNativeModulesAvailable: boolean;
  availableModules: string[];
  hasLynxWebBrowserModule: boolean;
  hasLynxRequireNativeModule: boolean;
  environment: 'native' | 'web' | 'unknown';
}

/**
 * Get detailed debug information about native module availability
 * Useful for troubleshooting native module registration issues
 */
export function getNativeModuleDebugInfo(): NativeModuleDebugInfo {
  const info: NativeModuleDebugInfo = {
    isNativeModulesAvailable: false,
    availableModules: [],
    hasLynxWebBrowserModule: false,
    hasLynxRequireNativeModule: false,
    environment: 'unknown',
  };

  try {
    // Check for NativeModules global
    if (typeof NativeModules !== 'undefined') {
      info.isNativeModulesAvailable = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      info.availableModules = Object.keys(NativeModules as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      info.hasLynxWebBrowserModule = !!(NativeModules as any)
        ?.LynxWebBrowserModule;
      info.environment = 'native';
    }

    // Check for lynx.requireNativeModule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof lynx !== 'undefined' && (lynx as any)?.requireNativeModule) {
      info.hasLynxRequireNativeModule = true;
    }

    // Detect web environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      info.environment = 'web';
    }
  } catch (error) {
    console.error('Error getting native module debug info:', error);
  }

  return info;
}

/**
 * Print native module debug information to console
 * Useful for development and troubleshooting
 */
export function logNativeModuleDebugInfo(): void {
  const info = getNativeModuleDebugInfo();

  console.group('🔍 Native Module Debug Info');
  console.log('Environment:', info.environment);
  console.log('NativeModules available:', info.isNativeModulesAvailable);
  console.log(
    'lynx.requireNativeModule available:',
    info.hasLynxRequireNativeModule,
  );
  console.log('LynxWebBrowserModule found:', info.hasLynxWebBrowserModule);

  if (info.availableModules.length > 0) {
    console.log('Available native modules:', info.availableModules);
  } else {
    console.warn(
      'No native modules found - this might indicate a registration issue',
    );
  }

  if (!info.hasLynxWebBrowserModule) {
    console.warn('LynxWebBrowserModule not found. Check:');
    console.warn(
      '1. MainApplication.kt calls LynxWebBrowserRegistration.registerAll()',
    );
    console.warn(
      '2. LynxWebBrowserModule.kt is compiled and included in the build',
    );
    console.warn('3. App is running in native environment (not web)');
  }

  console.groupEnd();
}

/**
 * Enhanced OAuth-specific debug logging
 * Provides detailed information about the OAuth authentication environment
 */
export function logOAuthEnvironmentDebugInfo(): void {
  console.group('🔐 OAuth Environment Debug Info');

  // Get basic native module info
  const nativeInfo = getNativeModuleDebugInfo();
  console.log('Native Environment:', nativeInfo.environment);
  console.log(
    'WebBrowser Module Available:',
    nativeInfo.hasLynxWebBrowserModule,
  );

  // Check for cookie access capabilities
  console.group('🍪 Cookie Access Capabilities');
  if (typeof document !== 'undefined') {
    console.log('✅ document.cookie available (web environment)');
    try {
      const testCookie = document.cookie;
      console.log(
        'Cookie test successful, current cookies:',
        testCookie || 'none',
      );
    } catch (error) {
      console.warn('⚠️ Cookie access failed:', error);
    }
  } else {
    console.log('❌ document.cookie not available (native environment)');
  }

  if (typeof navigator !== 'undefined' && 'cookieStore' in navigator) {
    console.log('✅ Cookie Store API available');
  } else {
    console.log('❌ Cookie Store API not available');
  }
  console.groupEnd();

  // Check for WebBrowser specific capabilities
  console.group('🌐 WebBrowser Capabilities');
  if (nativeInfo.hasLynxWebBrowserModule) {
    try {
      // Check if we can access the WebBrowser module
      if (
        typeof NativeModules !== 'undefined' &&
        NativeModules.LynxWebBrowserModule
      ) {
        console.log('✅ LynxWebBrowserModule accessible via NativeModules');

        // Log available methods
        const module = NativeModules.LynxWebBrowserModule;
        const methods = Object.getOwnPropertyNames(module).filter(
          (name) => typeof module[name] === 'function',
        );
        console.log('Available methods:', methods);
      }

      // Check lynx.requireNativeModule access
      if (nativeInfo.hasLynxRequireNativeModule) {
        console.log('✅ lynx.requireNativeModule available');
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const module = (lynx as any)?.requireNativeModule?.(
            'LynxWebBrowserModule',
          );
          if (module) {
            console.log(
              '✅ LynxWebBrowserModule accessible via lynx.requireNativeModule',
            );
          }
        } catch (error) {
          console.warn(
            '⚠️ Failed to access via lynx.requireNativeModule:',
            error,
          );
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking WebBrowser capabilities:', error);
    }
  } else {
    console.warn('❌ LynxWebBrowserModule not available');
    console.log('OAuth authentication may not work properly');
  }
  console.groupEnd();

  // Check for OAuth-specific environment variables
  console.group('⚙️ OAuth Configuration');
  console.log(
    'User Agent:',
    typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  );
  console.log(
    'Platform:',
    typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
  );

  // Check for potential OAuth redirect handling
  if (typeof window !== 'undefined') {
    console.log('Current URL:', window.location?.href || 'N/A');
    console.log('URL Search Params:', window.location?.search || 'none');

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location?.search || '');
    const hasCode = urlParams.has('code');
    const hasState = urlParams.has('state');
    const hasError = urlParams.has('error');

    if (hasCode || hasState || hasError) {
      console.log('🎯 OAuth callback parameters detected:');
      if (hasCode) console.log('  - code parameter found');
      if (hasState) console.log('  - state parameter found');
      if (hasError)
        console.log('  - error parameter found:', urlParams.get('error'));
    }
  }
  console.groupEnd();

  console.groupEnd();
}

/**
 * Test if a specific native module is available
 */
export function isNativeModuleAvailable(moduleName: string): boolean {
  try {
    if (typeof NativeModules !== 'undefined' && NativeModules?.[moduleName]) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof lynx !== 'undefined' && (lynx as any)?.requireNativeModule) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const module = (lynx as any).requireNativeModule(moduleName);
      return !!module;
    }

    return false;
  } catch {
    return false;
  }
}
