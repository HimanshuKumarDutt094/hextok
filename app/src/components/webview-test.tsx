import type { ReactElement } from '@lynx-js/react';
import { useWebBrowser, useWebView } from '../hooks/useWebBrowser';

// Component for individual WebView list items
const WebViewItem = ({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactElement;
}): ReactElement => {
  return (
    <view>
      <text
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#333',
        }}
      >
        {index + 1}. {title}
      </text>
      {children}
    </view>
  );
};

export default function WebViewTest(): ReactElement {
  const { isLoading, error, result, openContent, openBrowser, dismissBrowser } =
    useWebBrowser();
  // Inline helper component: raw web-view using useWebView hook
  const {
    currentUrl,
    webViewRef,
    goBack,
    canGoBack,
    goForward,
    canGoForward,
    getCurrentUrl,
    reload,
  } = useWebView();

  const webViewConfigs = [
    {
      title: 'Test 0 (WebBrowser test controls and logs)',
      component: (
        <view
          style={{
            width: '100vw',
            padding: '12px',
            borderRadius: '12px',
            borderWidth: '1px',
            borderColor: '#e2e8f0',
            backgroundColor: '#fff',
            marginBottom: '8px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <text
            style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}
          >
            WebBrowser Test Controls
          </text>

          <view className="flex-row items-center justify-start mb-2">
            <view
              className="px-4 py-2 mr-2 bg-blue-600 rounded"
              bindtap={() => {
                openBrowser('https://www.google.com', {
                  toolbarColor: '#1976d2',
                });
              }}
            >
              <text className="text-white">Open Browser</text>
            </view>

            <view
              className="px-4 py-2 mr-2 bg-green-600 rounded"
              bindtap={() => {
                openContent('https://www.google.com');
              }}
            >
              <text className="text-white">Open Content</text>
            </view>

            <view
              className="px-4 py-2 bg-gray-600 rounded"
              bindtap={() => {
                dismissBrowser();
              }}
            >
              <text className="text-white">Dismiss Browser</text>
            </view>
          </view>

          <view style={{ marginTop: '8px' }}>
            <text
              style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px',
              }}
            >
              WebBrowser Status:
            </text>
            <text style={{ fontSize: '12px', color: '#666' }}>
              Loading: {isLoading ? 'true' : 'false'}
            </text>
            <text style={{ fontSize: '12px', color: '#666' }}>
              Error: {error ?? 'none'}
            </text>
            <text style={{ fontSize: '12px', color: '#666' }}>
              Result: {result ? JSON.stringify(result) : 'none'}
            </text>
          </view>
        </view>
      ),
    },
    {
      title: 'Test 0.5 (Comparison: web-view with useCustomTabs - WORKING)',
      component: (
        <view>
          <text
            style={{ fontSize: '14px', marginBottom: '8px', color: '#059669' }}
          >
            This uses &lt;web-view&gt; with useCustomTabs=true (WORKING)
          </text>
          <web-view
            src="https://www.google.com"
            toolbarColor="#10b981"
            controlsColor="#ffffff"
            showTitle={true}
            style={{
              width: '100vw',
              minHeight: '300px',
              borderRadius: '8px',
              borderWidth: '1px',
              borderColor: '#10b981',
            }}
          />
          <text
            style={{ fontSize: '12px', marginTop: '8px', color: '#059669' }}
          >
            ✅ This should open URLs in Custom Tabs without errors
          </text>
        </view>
      ),
    },
    {
      title: 'Test 1 (h:80vh, w:100vw, borderRadius:18px)',
      component: (
        <view>
          <web-view
            src="https://www.google.com"
            ref={webViewRef}
            style={{
              width: '100vw',
              minHeight: '80vh',
              borderRadius: '18px',
              borderWidth: '1px',
              borderColor: '#ccc',
            }}
          />
          <view className="flex-row justify-center items-center mt-2">
            {/* lynx doesnt have button iinstead view with bindtap call back for button */}
            <view
              className={`px-4 py-2 mr-2 rounded ${
                canGoBack ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              bindtap={() => {
                if (canGoBack) goBack();
              }}
            >
              <text className="text-white">Back</text>
            </view>
            <view
              className={`px-4 py-2 mr-2 rounded ${
                canGoForward ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              bindtap={() => {
                if (canGoForward) goForward();
              }}
            >
              <text className="text-white">Forward</text>
            </view>
            <view
              className="px-4 py-2 mr-2 bg-green-500 rounded"
              bindtap={() => {
                reload();
              }}
            >
              <text className="text-white">
                {isLoading ? 'Loading...' : 'Reload'}
              </text>
            </view>
            <view
              className="px-4 py-2 bg-purple-500 rounded"
              bindtap={async () => {
                const url = await getCurrentUrl();
                alert(`Current URL: ${url}`);
              }}
            >
              <text className="text-white">Get URL</text>
            </view>
          </view>
          <text className="mt-2 text-center text-gray-600">
            Current URL: {currentUrl}
          </text>
        </view>
      ),
    },
    {
      title:
        'Test 2 (w:50vw, h:150px, borderRadius:12px, centered, customTabs)',
      component: (
        <web-view
          src="https://www.wikipedia.org"
          toolbarColor="#1976d2"
          controlsColor="#555fff"
          use-custom-tabs={true}
          style={{
            width: '100vw',
            minHeight: '550px',
            borderRadius: '12px',
            borderWidth: '2px',
            borderColor: '#1976d2',
            alignSelf: 'center',
          }}
        />
      ),
    },
    {
      title:
        'Test 3 (w:100vw, h:300px, borderRadius:8px, backgroundColor:#f9f9f9)',
      component: (
        <web-view
          src="https://lynxjs.org"
          style={{
            width: '100vw',
            minHeight: '300px',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
          }}
        />
      ),
    },
    {
      title: 'Test 4 (w:80vw, h:200px, centered, withControls)',
      component: (
        <web-view
          controls-color="#007AFF"
          src="https://google.com"
          style={{
            width: '80vw',
            minHeight: '200px',
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: '#ddd',
            alignSelf: 'center',
          }}
        />
      ),
    },
    {
      title: 'Test 5 (w:100vw, h:500px, centered, orange border)',
      component: (
        <web-view
          src="https://cutfast-extension.vercel.app"
          redirectUrl="https://httpbin.org"
          style={{
            width: '100vw',
            minHeight: '500px',
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: '#ff9800',
            alignSelf: 'center',
          }}
        />
      ),
    },
    {
      title: 'Test 6 (w:100vw, h:400px, red border, zoom enabled js enabled)',
      component: (
        <web-view
          src="https://youtube.com"
          enable-zoom
          useCustomTabs={false}
          style={{
            width: '100vw',
            minHeight: '400px',
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: 'red',
          }}
        />
      ),
    },
    {
      title: 'Test 7 (w:95vw, h:250px, centered, dark border)',
      component: (
        <web-view
          src="https://github.com"
          toolbarColor="#24292e"
          controlsColor="#ffffff"
          showTitle={true}
          style={{
            width: '95vw',
            minHeight: '250px',
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: '#24292e',
            alignSelf: 'center',
            flexShrink: 0,
          }}
        />
      ),
    },
    {
      title: 'Test 8 (w:70vw, min h:300px, centered, green border)',
      component: (
        <web-view
          src="https://vercel.com"
          style={{
            width: '70vw',
            minHeight: '300px',
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: '#28a745',
            alignSelf: 'center',
            flexShrink: 0,
          }}
        />
      ),
    },
  ];

  return (
    <scroll-view
      scroll-orientation="vertical"
      style={{
        width: '100vw',
        height: '100vh',

        paddingBottom: '80px',
      }}
    >
      {webViewConfigs.map((config, index) => (
        <WebViewItem index={index - 1} title={config.title}>
          {config.component}
        </WebViewItem>
      ))}
    </scroll-view>
  );
}
