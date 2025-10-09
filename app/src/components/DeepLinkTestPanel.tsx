import { simulateDeepLink, checkSchemeSupport } from '../hooks/useDeepLink';

/**
 * Simple component to test deep linking functionality
 * Add this to your app for development testing
 */
export function DeepLinkTestPanel() {
  const testUrls = [
    'hextok://home',
    'hextok://profile',
    'hextok://liked',
    'hextok://login',
    'hextok://profile?user=123',
    'hextok://home?tab=trending&filter=music',
  ];

  const handleTestDeepLink = (url: string) => {
    console.log('🧪 [DeepLinkTest] Testing URL:', url);
    simulateDeepLink(url);
  };

  const handleCheckScheme = async () => {
    const canHandle = await checkSchemeSupport('hextok');
    console.log('🧪 [DeepLinkTest] Can handle hextok scheme:', canHandle);
    alert(`Can handle hextok scheme: ${canHandle}`);
  };

  return (
    <view className="p-4 bg-gray-800 m-4 rounded-lg">
      <text className="text-white text-lg font-bold mb-4">
        Deep Link Test Panel
      </text>

      <view className="mb-4">
        <view
          className="bg-blue-600 p-2 rounded mb-2"
          bindtap={handleCheckScheme}
        >
          <text className="text-white text-center">Check Scheme Support</text>
        </view>
      </view>

      <text className="text-white text-sm mb-2">Test URLs:</text>
      <view className="space-y-2">
        {testUrls.map((url, index) => (
          <view
            key={index}
            className="bg-green-600 p-2 rounded"
            bindtap={() => handleTestDeepLink(url)}
          >
            <text className="text-white text-sm text-center">{url}</text>
          </view>
        ))}
      </view>

      <view className="mt-4 p-3 bg-yellow-800 rounded">
        <text className="text-yellow-200 text-xs">
          💡 To test from outside the app, use ADB:
          {'\n'}adb shell am start -W -a android.intent.action.VIEW -d
          "hextok://profile" com.hextok
        </text>
      </view>
    </view>
  );
}
