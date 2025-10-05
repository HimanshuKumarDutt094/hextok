import React from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../../../hooks/auth';
import { openAuth } from '../../../lynx-native-auth';
import WebView from '../../../components/WebView';
import { useWebBrowser } from '../../../hooks/useWebBrowser';
import WebViewTest from '../../../components/webview-test';

const HomePage = () => {
  const p = useLocation();
  const { session } = useAuth();
  console.log('home page', p);
  const { openBrowser, isLoading, result, error } = useWebBrowser();

  const handlePress = () => {
    openBrowser('https://example.com', {
      toolbarColor: '#007AFF',
      showTitle: true,
    });
  };
  return (
    <view className="flex-1 px-2    justify-center items-center">
      <text className="text-4xl">Homse</text>
      <text className="text-2xl mt-4">Welcome, {session?.name}</text>
      <view className="flex-row mt-6">
        <view bindtap={handlePress}>
          <text>{isLoading ? 'Opening...' : 'Open Browser'}</text>
          {error && <text>Error: {error}</text>}
        </view>
        <view
          className="px-4 py-2 bg-blue-500 rounded mr-3"
          bindtap={() =>
            openAuth(
              'https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID',
              {
                callbackScheme: 'myapp://callback',
              },
            )
          }
        >
          <text className="text-white">Sign in with GitHub</text>
        </view>

        <view
          className="px-4 py-2 bg-gray-300 rounded"
          bindtap={() =>
            openAuth('https://example.com/auth', {
              callbackScheme: 'myapp://callback',
            })
          }
        >
          <view className="">
            <web-view
              src="https://www.google.com"
              showTitle
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 40,
                borderWidth: 4,
                borderColor: 'black',
              }}
            />
          </view>
          <text>Sign in (Otherss)</text>
        </view>
      </view>
      <WebViewTest />
    </view>
  );
};

export default HomePage;
