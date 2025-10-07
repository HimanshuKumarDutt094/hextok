// cookie-capture.ts
// Utility for capturing and analyzing OAuth cookies in LynxJS applications
// Helps debug OAuth flow by monitoring cookie changes

export interface CookieInfo {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  expires?: string;
  maxAge?: number;
  timestamp: number;
}

export interface CookieAnalysis {
  added: CookieInfo[];
  removed: CookieInfo[];
  modified: CookieInfo[];
  unchanged: CookieInfo[];
}

/**
 * Enhanced cookie capture utility for OAuth flows
 * Provides detailed cookie analysis and OAuth-specific insights
 */
export class OAuthCookieCapture {
  private previousCookies: CookieInfo[] = [];

  /**
   * Capture current cookies from available sources
   * In LynxJS, this may be limited depending on the environment
   */
  captureCookies(): CookieInfo[] {
    const cookies: CookieInfo[] = [];
    const timestamp = Date.now();

    try {
      // Method 1: Try to access document.cookie (web environment)
      if (typeof document !== 'undefined' && document.cookie) {
        const cookieStrings = document.cookie.split(';');

        cookieStrings.forEach((cookieStr) => {
          const trimmed = cookieStr.trim();
          if (trimmed) {
            const [name, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('='); // Handle values with '=' in them

            if (name && value !== undefined) {
              cookies.push({
                name: name.trim(),
                value: value.trim(),
                timestamp,
              });
            }
          }
        });
      }

      // Method 2: Try to access cookies via LynxJS native modules (if available)
      if (
        typeof NativeModules !== 'undefined' &&
        NativeModules.LynxWebBrowserModule
      ) {
        // Note: LynxJS might not expose cookie access directly
        // This is a placeholder for potential future cookie access APIs
        console.log(
          '🔍 LynxJS WebBrowser module available, but cookie access may be limited',
        );
      }

      // Method 3: Try to access cookies via Web APIs (if available)
      if (typeof navigator !== 'undefined' && 'cookieStore' in navigator) {
        // Future: Use Cookie Store API when available
        console.log(
          '🔍 Cookie Store API detected but not implemented in this version',
        );
      }
    } catch (error) {
      console.warn('⚠️ Failed to capture cookies:', error);
    }

    return cookies;
  }

  /**
   * Analyze changes between previous and current cookie state
   */
  analyzeCookieChanges(currentCookies: CookieInfo[]): CookieAnalysis {
    const analysis: CookieAnalysis = {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
    };

    // Find cookies that were added or modified
    currentCookies.forEach((current) => {
      const previous = this.previousCookies.find(
        (p) => p.name === current.name,
      );

      if (!previous) {
        analysis.added.push(current);
      } else if (previous.value !== current.value) {
        analysis.modified.push(current);
      } else {
        analysis.unchanged.push(current);
      }
    });

    // Find cookies that were removed
    this.previousCookies.forEach((previous) => {
      const current = currentCookies.find((c) => c.name === previous.name);
      if (!current) {
        analysis.removed.push(previous);
      }
    });

    return analysis;
  }

  /**
   * Capture cookies and analyze changes from previous capture
   */
  captureAndAnalyze(): { cookies: CookieInfo[]; analysis: CookieAnalysis } {
    const currentCookies = this.captureCookies();
    const analysis = this.analyzeCookieChanges(currentCookies);

    // Update previous cookies for next comparison
    this.previousCookies = [...currentCookies];

    return { cookies: currentCookies, analysis };
  }

  /**
   * Find OAuth-specific cookies based on naming patterns
   */
  findOAuthCookies(cookies: CookieInfo[]): {
    stateCookies: CookieInfo[];
    sessionCookies: CookieInfo[];
    otherAuthCookies: CookieInfo[];
  } {
    const stateCookies: CookieInfo[] = [];
    const sessionCookies: CookieInfo[] = [];
    const otherAuthCookies: CookieInfo[] = [];

    cookies.forEach((cookie) => {
      const lowerName = cookie.name.toLowerCase();

      // OAuth state cookies
      if (lowerName.includes('oauth') && lowerName.includes('state')) {
        stateCookies.push(cookie);
      }
      // Session cookies
      else if (lowerName.includes('session') || lowerName.includes('sess')) {
        sessionCookies.push(cookie);
      }
      // Other authentication-related cookies
      else if (
        lowerName.includes('auth') ||
        lowerName.includes('token') ||
        lowerName.includes('csrf') ||
        lowerName.includes('xsrf')
      ) {
        otherAuthCookies.push(cookie);
      }
    });

    return { stateCookies, sessionCookies, otherAuthCookies };
  }

  /**
   * Log detailed cookie information for debugging
   */
  logCookieInfo(cookies: CookieInfo[], title = '🍪 Cookie Information') {
    console.group(title);

    if (cookies.length === 0) {
      console.log('No cookies found');
      console.groupEnd();
      return;
    }

    // Group cookies by type
    const oauthCookies = this.findOAuthCookies(cookies);

    if (oauthCookies.stateCookies.length > 0) {
      console.group('🎯 OAuth State Cookies');
      oauthCookies.stateCookies.forEach((cookie) => {
        console.log(`${cookie.name}:`, {
          value:
            cookie.value.substring(0, 50) +
            (cookie.value.length > 50 ? '...' : ''),
          fullValue: cookie.value,
          timestamp: new Date(cookie.timestamp).toISOString(),
        });
      });
      console.groupEnd();
    }

    if (oauthCookies.sessionCookies.length > 0) {
      console.group('🔐 Session Cookies');
      oauthCookies.sessionCookies.forEach((cookie) => {
        console.log(`${cookie.name}:`, {
          value:
            cookie.value.substring(0, 50) +
            (cookie.value.length > 50 ? '...' : ''),
          fullValue: cookie.value,
          timestamp: new Date(cookie.timestamp).toISOString(),
        });
      });
      console.groupEnd();
    }

    if (oauthCookies.otherAuthCookies.length > 0) {
      console.group('🔑 Other Auth Cookies');
      oauthCookies.otherAuthCookies.forEach((cookie) => {
        console.log(`${cookie.name}:`, {
          value:
            cookie.value.substring(0, 50) +
            (cookie.value.length > 50 ? '...' : ''),
          fullValue: cookie.value,
          timestamp: new Date(cookie.timestamp).toISOString(),
        });
      });
      console.groupEnd();
    }

    // Log remaining cookies
    const otherCookies = cookies.filter((cookie) => {
      const { stateCookies, sessionCookies, otherAuthCookies } = oauthCookies;
      return ![...stateCookies, ...sessionCookies, ...otherAuthCookies].some(
        (authCookie) => authCookie.name === cookie.name,
      );
    });

    if (otherCookies.length > 0) {
      console.group('📝 Other Cookies');
      otherCookies.forEach((cookie) => {
        console.log(`${cookie.name}:`, {
          value:
            cookie.value.substring(0, 30) +
            (cookie.value.length > 30 ? '...' : ''),
          timestamp: new Date(cookie.timestamp).toISOString(),
        });
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Log cookie analysis results
   */
  logCookieAnalysis(analysis: CookieAnalysis) {
    console.group('📊 Cookie Change Analysis');

    if (analysis.added.length > 0) {
      console.group(`➕ Added Cookies (${analysis.added.length})`);
      analysis.added.forEach((cookie) => {
        console.log(
          `${cookie.name}: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`,
        );
      });
      console.groupEnd();
    }

    if (analysis.modified.length > 0) {
      console.group(`🔄 Modified Cookies (${analysis.modified.length})`);
      analysis.modified.forEach((cookie) => {
        console.log(
          `${cookie.name}: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`,
        );
      });
      console.groupEnd();
    }

    if (analysis.removed.length > 0) {
      console.group(`➖ Removed Cookies (${analysis.removed.length})`);
      analysis.removed.forEach((cookie) => {
        console.log(
          `${cookie.name}: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`,
        );
      });
      console.groupEnd();
    }

    console.log(`✅ Unchanged: ${analysis.unchanged.length} cookies`);
    console.groupEnd();
  }

  /**
   * Reset the previous cookies state
   */
  reset() {
    this.previousCookies = [];
  }
}

/**
 * Global cookie capture instance for OAuth debugging
 */
export const oauthCookieCapture = new OAuthCookieCapture();

/**
 * Convenience function for quick cookie capture and logging
 */
export function captureAndLogCookies(title?: string): CookieInfo[] {
  const cookies = oauthCookieCapture.captureCookies();
  oauthCookieCapture.logCookieInfo(cookies, title);
  return cookies;
}

/**
 * Convenience function for capturing cookies with change analysis
 */
export function captureAndAnalyzeCookies(title?: string): {
  cookies: CookieInfo[];
  analysis: CookieAnalysis;
} {
  const result = oauthCookieCapture.captureAndAnalyze();

  if (title) {
    console.group(title);
  }

  oauthCookieCapture.logCookieInfo(result.cookies, '🍪 Current Cookies');
  oauthCookieCapture.logCookieAnalysis(result.analysis);

  if (title) {
    console.groupEnd();
  }

  return result;
}
