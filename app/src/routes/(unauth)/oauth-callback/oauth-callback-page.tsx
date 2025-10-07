import { useEffect, useState } from '@lynx-js/react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../../hooks/auth';
import { API_BASE } from '../../../config';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeToken } = useAuth();

  console.log('🔵 [OAuth Callback] Component mounted');
  console.log('🔵 [OAuth Callback] Current location:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state,
  });

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing',
  );
  const [message, setMessage] = useState<string>(
    'Processing OAuth callback...',
  );

  useEffect(() => {
    console.log('🟡 [OAuth Callback] useEffect triggered');

    const handleOAuthCallback = async () => {
      console.log('🟠 [OAuth Callback] Starting handleOAuthCallback');

      try {
        // Parse URL parameters
        console.log(
          '🔍 [OAuth Callback] Parsing URL parameters from:',
          location.search,
        );
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const userId = urlParams.get('user_id');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const state = urlParams.get('state');
        const expiresIn = urlParams.get('expires_in');

        console.log('✅ [OAuth Callback] URL parameters parsed:', {
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : null,
          userId,
          error,
          errorDescription,
          state,
          expiresIn,
          allParams: Object.fromEntries(urlParams.entries()),
        });

        // Handle OAuth errors
        if (error) {
          console.error('❌ [OAuth Callback] OAuth error detected:', {
            error,
            errorDescription,
          });
          setStatus('error');
          setMessage(`Authentication failed: ${errorDescription || error}`);

          console.log(
            '🔄 [OAuth Callback] Redirecting to login in 3 seconds due to error',
          );
          setTimeout(() => {
            console.log('🔄 [OAuth Callback] Executing navigation to /login');
            navigate('/login');
          }, 3000);
          return;
        }

        // Validate required parameters
        if (!token || !userId) {
          console.error('❌ [OAuth Callback] Missing required parameters:', {
            hasToken: !!token,
            hasUserId: !!userId,
            token: token || 'MISSING',
            userId: userId || 'MISSING',
          });
          setStatus('error');
          setMessage('Invalid OAuth response - missing token or user ID');

          console.log(
            '🔄 [OAuth Callback] Redirecting to login in 3 seconds due to missing params',
          );
          setTimeout(() => {
            console.log('🔄 [OAuth Callback] Executing navigation to /login');
            navigate('/login');
          }, 3000);
          return;
        }

        console.log(
          '✅ [OAuth Callback] Parameters validated, starting token exchange',
        );
        setMessage('Exchanging token for authentication...');

        // Exchange the mobile token for a session token
        const exchangeUrl = `${API_BASE}/api/v1/oauth/mobile/exchange`;
        console.log(
          '🌐 [OAuth Callback] Making token exchange request to:',
          exchangeUrl,
        );
        console.log('🌐 [OAuth Callback] Request body:', {
          token: `${token.substring(0, 20)}...`,
        });

        const response = await fetch(exchangeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        console.log('🌐 [OAuth Callback] Token exchange response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [OAuth Callback] Token exchange failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          setStatus('error');
          setMessage(`Token exchange failed: ${response.status}`);

          console.log(
            '🔄 [OAuth Callback] Redirecting to login in 3 seconds due to exchange failure',
          );
          setTimeout(() => {
            console.log('🔄 [OAuth Callback] Executing navigation to /login');
            navigate('/login');
          }, 3000);
          return;
        }

        const exchangeResult = await response.json();
        console.log('✅ [OAuth Callback] Token exchange successful:', {
          userId: exchangeResult.user_id,
          sessionId: exchangeResult.session_id,
          expiresIn: exchangeResult.expires_in,
          hasToken: !!exchangeResult.token,
          tokenPreview: exchangeResult.token
            ? `${exchangeResult.token.substring(0, 20)}...`
            : null,
        });

        // Store the session token using the auth hook to properly update state
        console.log('💾 [OAuth Callback] Storing auth token via auth hook');

        setStatus('success');
        setMessage('Authentication successful! Redirecting to home...');

        // Use the storeToken mutation to properly update React Query cache
        storeToken.mutate(exchangeResult, {
          onSuccess: () => {
            console.log('✅ [OAuth Callback] Auth token stored successfully');
            console.log('🔄 [OAuth Callback] Redirecting to /home in 1 second');
            // Wait a moment for the auth state to update, then navigate
            setTimeout(() => {
              console.log('🔄 [OAuth Callback] Executing navigation to /home');
              navigate('/home');
            }, 1000);
          },
          onError: (error) => {
            console.error('❌ [OAuth Callback] Failed to store token:', error);
            setStatus('error');
            setMessage(
              'Failed to save authentication. Redirecting to login...',
            );
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          },
        });
      } catch (error) {
        console.error(
          '❌ [OAuth Callback] Unexpected error in handleOAuthCallback:',
          {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        );
        setStatus('error');
        setMessage(
          `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        console.log(
          '🔄 [OAuth Callback] Redirecting to login in 3 seconds due to unexpected error',
        );
        setTimeout(() => {
          console.log('🔄 [OAuth Callback] Executing navigation to /login');
          navigate('/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate, location.search, storeToken]);

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  return (
    <view className="flex-1 flex h-screen bg-gradient-to-br from-blue-900 to-purple-900 justify-center items-center">
      <view className="flex flex-col items-center space-y-8 p-8 bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
        {/* Logo/Title */}
        <view className="text-center">
          <text className="text-gray-900 text-5xl font-bold mb-2">Hextok</text>
          <text className="text-gray-500 text-lg">Completing Sign In</text>
        </view>

        {/* Status Icon */}
        <view className="text-6xl mb-4">
          <text>{getIcon()}</text>
        </view>

        {/* Status Message */}
        <view className="text-center">
          <text className={`text-lg font-medium ${getStatusColor()}`}>
            {message}
          </text>
        </view>

        {/* Loading indicator for processing */}
        {status === 'processing' && (
          <view className="flex justify-center">
            <view className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></view>
          </view>
        )}

        {/* Additional info */}
        <view className="text-center">
          <text className="text-xs text-gray-400">
            {status === 'processing' &&
              'Please wait while we complete your authentication...'}
            {status === 'success' && 'You will be redirected automatically.'}
            {status === 'error' && 'You will be redirected to login page.'}
          </text>
        </view>
      </view>
    </view>
  );
};

export default OAuthCallbackPage;
