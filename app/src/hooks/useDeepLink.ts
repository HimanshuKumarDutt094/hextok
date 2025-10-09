import { useEffect, useRef, useCallback } from '@lynx-js/react';
import { useNavigate, useLocation } from 'react-router';
import type { DeepLinkData, DeepLinkListener } from '../rspeedy-env';

interface UseDeepLinkOptions {
  /** Whether to automatically navigate to deep link routes */
  autoNavigate?: boolean;
  /** Custom handler for deep link data before navigation */
  onDeepLink?: (data: DeepLinkData) => string | void;
  /** Routes that require authentication */
  protectedRoutes?: string[];
  /** Whether user is currently authenticated */
  isAuthenticated?: boolean;
  /** Whether authentication is still loading */
  isAuthLoading?: boolean;
}

interface UseDeepLinkReturn {
  /** Manually process a deep link */
  handleDeepLink: (data: DeepLinkData) => void;
  /** Current deep link data if any */
  currentDeepLink: DeepLinkData | null;
}

/**
 * Parse deep link JSON data safely
 */
function parseDeepLinkData(jsonData: string): DeepLinkData | null {
  try {
    const parsed = JSON.parse(jsonData);
    console.log('🔗 [DeepLink] Parsed JSON data:', parsed);
    // Validate the structure
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.url === 'string' &&
      typeof parsed.path === 'string'
    ) {
      // host and scheme can be optional, but if present should be strings
      if (parsed.host !== undefined && typeof parsed.host !== 'string') {
        console.error('🔗 [DeepLink] Invalid host type:', typeof parsed.host);
        return null;
      }
      if (parsed.scheme !== undefined && typeof parsed.scheme !== 'string') {
        console.error(
          '🔗 [DeepLink] Invalid scheme type:',
          typeof parsed.scheme,
        );
        return null;
      }
      console.log('🔗 [DeepLink] Validation passed, returning as DeepLinkData');
      return parsed as DeepLinkData;
    } else {
      console.error('🔗 [DeepLink] Invalid deep link data structure:', parsed);
      return null;
    }
  } catch (e) {
    console.error('🔗 [DeepLink] Failed to parse deep link JSON:', e);
    return null;
  }
}

/**
 * Hook to handle deep links and integrate with React Router
 */
export function useDeepLink({
  autoNavigate = true,
  onDeepLink,
  protectedRoutes = ['/profile', '/liked'],
  isAuthenticated = false,
  isAuthLoading = false,
}: UseDeepLinkOptions = {}): UseDeepLinkReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const currentDeepLinkRef = useRef<DeepLinkData | null>(null);
  const listenerRef = useRef<DeepLinkListener | null>(null);
  const pendingDeepLinkRef = useRef<DeepLinkData | null>(null);
  const locationRef = useRef(location);

  // Update location ref when location changes
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  /**
   * Convert deep link path to React Router path
   */
  const convertDeepLinkToRoute = useCallback((data: DeepLinkData): string => {
    console.log('🔗 [DeepLink] convertDeepLinkToRoute input:', data);
    const { path, host, queryParams } = data;
    let normalizedPath = path;

    console.log(
      '🔗 [DeepLink] Initial path:',
      JSON.stringify(path),
      'host:',
      JSON.stringify(host),
    );
    console.log(
      '🔗 [DeepLink] Path truthy check:',
      !!path,
      'Path length:',
      path ? path.length : 0,
    );

    // Handle case where meaningful route info is in the host (e.g., hextok://liked)
    // If path is empty/root AND host has a meaningful value, use host as the path
    if (
      (!normalizedPath || normalizedPath === '/') &&
      host &&
      host !== 'localhost'
    ) {
      normalizedPath = host;
      console.log(
        `🔗 [DeepLink] Using host "${host}" as path since path is empty or root`,
      );
    }

    console.log(
      '🔗 [DeepLink] After host check, normalizedPath:',
      normalizedPath,
    );

    // Normalize path - ensure it starts with /
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }

    console.log('🔗 [DeepLink] After slash normalization:', normalizedPath);

    // Handle special cases and route mapping
    const routeMap: Record<string, string> = {
      '/': '/home',
      '/login': '/login',
      '/home': '/home',
      '/profile': '/profile',
      '/liked': '/liked',
      '/user': '/profile', // Map user to profile
      '/favorites': '/liked', // Map favorites to liked
    };

    // Check if we have a direct mapping
    let targetRoute = routeMap[normalizedPath] || normalizedPath;

    console.log('🔗 [DeepLink] After route mapping, targetRoute:', targetRoute);

    // Handle parameterized routes
    if (
      normalizedPath.startsWith('/user/') ||
      normalizedPath.startsWith('/profile/')
    ) {
      targetRoute = '/profile';
      // You could extract user ID from path and pass as state
    }

    // Add query parameters as URL search params
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) {
      targetRoute += `?${queryString}`;
    }

    console.log('🔗 [DeepLink] Final targetRoute:', targetRoute);
    return targetRoute;
  }, []);

  /**
   * Handle deep link data and navigate if needed
   */
  const handleDeepLink = useCallback(
    (data: DeepLinkData) => {
      console.log('🔗 [DeepLink] Processing deep link:', data);

      currentDeepLinkRef.current = data;

      // If auth is still loading, store the deep link for later processing
      if (isAuthLoading) {
        console.log(
          '🔗 [DeepLink] Auth still loading, storing deep link for later',
        );
        pendingDeepLinkRef.current = data;
        return;
      }

      // Clear any pending deep link since we're processing now
      pendingDeepLinkRef.current = null;

      // Call custom handler first
      let targetRoute: string;
      if (onDeepLink) {
        const customRoute = onDeepLink(data);
        targetRoute =
          typeof customRoute === 'string'
            ? customRoute
            : convertDeepLinkToRoute(data);
      } else {
        targetRoute = convertDeepLinkToRoute(data);
      }

      console.log('🔗 [DeepLink] Target route:', targetRoute);

      // Check if route requires authentication
      const requiresAuth = protectedRoutes.some((route) =>
        targetRoute.startsWith(route),
      );

      if (requiresAuth && !isAuthenticated) {
        console.log(
          '🔗 [DeepLink] Route requires authentication, redirecting to login',
        );
        // Store the intended destination for after login
        navigate('/login', {
          state: {
            from: targetRoute,
            deepLink: data,
          },
          replace: true,
        });
        return;
      }

      // Navigate to the target route
      const currentLocation = locationRef.current;
      const currentPath = currentLocation.pathname + currentLocation.search;
      if (autoNavigate && targetRoute !== currentPath) {
        console.log('🔗 [DeepLink] Navigating to:', targetRoute);
        navigate(targetRoute, { replace: true });
      }
    },
    [
      autoNavigate,
      convertDeepLinkToRoute,
      isAuthenticated,
      isAuthLoading,
      navigate,
      onDeepLink,
      protectedRoutes,
      // Remove location dependencies to prevent infinite re-renders
    ],
  );

  // Process pending deep link when auth loading completes
  useEffect(() => {
    if (!isAuthLoading && pendingDeepLinkRef.current) {
      console.log(
        '🔗 [DeepLink] Auth loading completed, processing pending deep link',
      );
      const pendingData = pendingDeepLinkRef.current;
      pendingDeepLinkRef.current = null;
      handleDeepLink(pendingData);
    }
  }, [isAuthLoading, handleDeepLink]);

  useEffect(() => {
    // Check if we have access to the native module
    if (typeof NativeModules === 'undefined' || !NativeModules.DeepLinkModule) {
      console.warn('🔗 [DeepLink] DeepLinkModule not available');
      return;
    }

    console.log('🔗 [DeepLink] Setting up deep link handlers');

    // Get initial deep link (if app was launched via deep link)
    NativeModules.DeepLinkModule.getInitialDeepLink(
      (jsonData: string | null) => {
        if (jsonData) {
          const data = parseDeepLinkData(jsonData);
          if (data) {
            console.log('🔗 [DeepLink] Initial deep link found:', data);
            handleDeepLink(data);
          }
        } else {
          console.log('🔗 [DeepLink] No initial deep link');
        }
      },
    );

    // Set up listener for runtime deep links
    const listener = (jsonData: string) => {
      const data = parseDeepLinkData(jsonData);
      if (data) {
        console.log('🔗 [DeepLink] Runtime deep link received:', data);
        handleDeepLink(data);
      }
    };

    listenerRef.current = listener;
    NativeModules.DeepLinkModule.addDeepLinkListener(listener);

    // Cleanup
    return () => {
      if (listenerRef.current) {
        try {
          NativeModules.DeepLinkModule.removeDeepLinkListener(
            listenerRef.current,
          );
        } catch (e) {
          console.warn('🔗 [DeepLink] Error removing listener:', e);
        }
      }
    };
  }, [handleDeepLink]); // Only depend on handleDeepLink

  return {
    handleDeepLink,
    currentDeepLink: currentDeepLinkRef.current,
  };
}

/**
 * Utility function to test deep links in development
 */
export function simulateDeepLink(url: string) {
  if (typeof NativeModules !== 'undefined' && NativeModules.DeepLinkModule) {
    NativeModules.DeepLinkModule.simulateDeepLink(url);
  } else {
    console.warn(
      '🔗 [DeepLink] Cannot simulate - DeepLinkModule not available',
    );
  }
}

/**
 * Check if the app can handle a specific URL scheme
 */
export function checkSchemeSupport(scheme: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof NativeModules !== 'undefined' && NativeModules.DeepLinkModule) {
      NativeModules.DeepLinkModule.canHandleScheme(scheme, resolve);
    } else {
      resolve(false);
    }
  });
}
