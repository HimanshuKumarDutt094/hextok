import { useState, useCallback } from '@lynx-js/react';
import { useWebBrowser } from '../../../hooks/useWebBrowser';
import { API_BASE } from '../../../config';
import { StorageTest } from './store';

const LoginPage = () => {
  const [status, setStatus] = useState<
    'idle' | 'authenticating' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { openBrowser, isLoading, error: browserError } = useWebBrowser();

  // Generate a random state for OAuth security
  const generateState = useCallback(() => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const handleLogin = useCallback(() => {
    setStatus('authenticating');
    setErrorMessage('');

    const state = generateState();
    const redirectUri = 'hextok://oauth/callback';

    // Build OAuth URL to start the flow
    const oauthUrl = `${API_BASE}/api/v1/oauth/mobile/start/github?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log('🚀 [Login] Starting OAuth flow:', {
      oauthUrl,
      state,
      redirectUri,
    });

    // Open browser - the deep link will handle the callback
    openBrowser(oauthUrl, {
      toolbarColor: '#007AFF',
      showTitle: true,
    });
  }, [openBrowser, generateState]);

  const getStatusMessage = () => {
    switch (status) {
      case 'authenticating':
        return 'Opening GitHub authentication...';
      case 'success':
        return 'Authentication successful! Redirecting...';
      case 'error':
        return `Authentication failed: ${errorMessage}`;
      default:
        return 'Sign in to continue';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'authenticating':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isDisabled =
    isLoading || status === 'authenticating' || status === 'success';

  return (
    <view className="flex-1 flex h-screen bg-gradient-to-br from-blue-900 to-purple-900 justify-center items-center">
      <view className="flex flex-col items-center space-y-8 p-8 bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
        {/* Logo/Title */}
        <view className="text-center">
          <text className="text-gray-900 text-5xl font-bold mb-2">Hextok</text>
          <text className="text-gray-500 text-lg">Social Media Platform</text>
        </view>

        {/* Status Message */}
        <view className="text-center min-h-6">
          <text className={`text-sm ${getStatusColor()}`}>
            {getStatusMessage()}
          </text>
        </view>

        {/* Login Button */}
        <view
          bindtap={isDisabled ? undefined : handleLogin}
          className={`
            w-full px-6 py-4 rounded-xl shadow-lg transition-all duration-200
            ${
              isDisabled
                ? 'bg-gray-300 shadow-none'
                : 'bg-gray-900 hover:bg-gray-800 active:scale-95 shadow-lg'
            }
          `}
        >
          <view className="flex flex-row items-center justify-center space-x-3">
            {/* GitHub Icon (simplified) */}
            <text className="text-white text-xl">⚡</text>
            <text
              className={`text-lg font-semibold ${isDisabled ? 'text-gray-500' : 'text-white'}`}
            >
              {isLoading || status === 'authenticating'
                ? 'Authenticating...'
                : status === 'success'
                  ? 'Success!'
                  : 'Continue with GitHub'}
            </text>
          </view>
        </view>

        {/* Additional Error Details */}
        {browserError && status === 'error' && (
          <view className="w-full p-4 bg-red-50 rounded-lg border border-red-200">
            <text className="text-red-800 text-sm text-center">
              {browserError}
            </text>
          </view>
        )}

        {/* Retry Button for errors */}
        {status === 'error' && (
          <view
            bindtap={handleLogin}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <text className="text-gray-700 text-sm">Try Again</text>
          </view>
        )}

        {/* Footer */}
        <view className="text-center">
          <text className="text-xs text-gray-400">
            Secure authentication via GitHub OAuth
          </text>
        </view>
      </view>
    </view>
  );
};

export default LoginPage;
