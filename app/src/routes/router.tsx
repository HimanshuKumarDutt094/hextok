import React, { useMemo, useCallback } from 'react';
import type { DeepLinkData } from '../rspeedy-env';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  Navigate,
} from 'react-router';
import { useAuth } from '../hooks/auth';
import { useDeepLink } from '../hooks/useDeepLink';
import LoginPage from './(unauth)/login/login-page';
import LikedPage from './(auth)/liked/liked-page';
import ProfilePage from './(auth)/profile/profile-page';
import BottomTabs from './(auth)/home/bottom-tabs';
import HomePage from './(auth)/home/home-page';

// Inner router component that can use hooks
const RouterContent = () => {
  console.log('🔵 [Router] RouterContent called');

  const location = useLocation();
  const { isLoading, isAuthenticated, error } = useAuth();

  // Set up deep link handling
  // Memoize protected routes so the reference is stable between renders
  const protectedRoutes = useMemo(() => ['/profile', '/liked'], []);

  // Memoize the custom deep link handler so it doesn't get recreated every render
  const onDeepLink = useCallback(
    (data: DeepLinkData) => {
      console.log('🔗 [Router] Custom deep link handler:', data);
      console.log('🔗 [Router] Auth state during deep link:', {
        isAuthenticated,
        isLoading,
      });
      // Return undefined to use default route conversion
      return undefined;
    },
    // Only recreate when auth state changes
    [isAuthenticated, isLoading],
  );

  useDeepLink({
    autoNavigate: true,
    isAuthenticated,
    isAuthLoading: isLoading,
    protectedRoutes,
    onDeepLink,
  });

  console.log('🔍 [Router] Auth state:', {
    isLoading,
    isAuthenticated,
    hasError: !!error,
    errorMessage: error?.message,
    errorType:
      error && !error.message.includes('No authentication token')
        ? 'critical'
        : 'normal',
  });

  console.log('🔍 [Router] Current location:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state,
  });

  return (
    <Routes>
      {/* Show loading state while checking authentication */}
      {(() => {
        if (isLoading) {
          console.log('🟡 [Router] Rendering loading state');
          return (
            <Route
              path="*"
              element={
                <view className="flex flex-1 justify-center items-center h-screen bg-gray-900">
                  <view className="flex flex-col items-center space-y-4">
                    <text className="text-white text-4xl animate-pulse">
                      Hextok
                    </text>
                    <text className="text-gray-400 text-lg">Loading...</text>
                  </view>
                </view>
              }
            />
          );
        } else if (
          error &&
          !error.message.includes('No authentication token')
        ) {
          console.log('🔴 [Router] Rendering error state:', error.message);
          return (
            <Route
              path="*"
              element={
                <view className="flex flex-1 justify-center items-center h-screen bg-red-900">
                  <view className="flex flex-col items-center space-y-4 p-6">
                    <text className="text-white text-2xl">
                      Authentication Error
                    </text>
                    <text className="text-red-200 text-center">
                      {error.message}
                    </text>
                    <text className="text-red-300 text-sm">
                      Please restart the app
                    </text>
                  </view>
                </view>
              }
            />
          );
        } else if (!isAuthenticated) {
          console.log('🟠 [Router] Rendering unauthenticated routes');
          return (
            <>
              <Route
                path="/login"
                element={(() => {
                  console.log('🟢 [Router] Login route matched!');
                  return <LoginPage />;
                })()}
              />
              {/* Default unauthenticated route */}
              <Route
                path="/"
                element={(() => {
                  console.log('🟢 [Router] Root route matched, showing login');
                  return <LoginPage />;
                })()}
              />
              <Route
                path="*"
                element={(() => {
                  console.log(
                    '🟢 [Router] Wildcard route matched, redirecting to login',
                  );
                  return <LoginPage />;
                })()}
              />
            </>
          );
        } else {
          console.log('🟢 [Router] Rendering authenticated routes');
          return (
            <>
              {/* Parent route mounts BottomTabs so all nested routes render inside it */}
              <Route path="/" element={<BottomTabs />}>
                {/* index -> renders at exact '/' inside BottomTabs */}
                <Route
                  index
                  element={(() => {
                    console.log(
                      '🟢 [Router] Index (/) route matched for authenticated user',
                    );
                    return <HomePage />;
                  })()}
                />
                {/* also allow explicit /home, /liked, /profile paths as nested (relative) routes */}
                <Route
                  path="home"
                  element={(() => {
                    console.log('🟢 [Router] /home route matched!');
                    return <HomePage />;
                  })()}
                />
                <Route path="liked" element={<LikedPage />} />
                <Route path="profile" element={<ProfilePage />} />
                {/* catch-all under the authenticated root should render home */}
                <Route path="*" element={<HomePage />} />
              </Route>

              {/* Redirect any other top-level unmatched routes to authenticated root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          );
        }
      })()}
    </Routes>
  );
};

const Router = () => {
  console.log('🔵 [Router] Main Router component called');

  // Start with a loading state while we check authentication
  // If there's a token, start at /home, otherwise start at /login
  const initialEntry = '/';
  console.log('🔍 [Router] Initial entry will be:', initialEntry);

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <RouterContent />
    </MemoryRouter>
  );
};

export default Router;
