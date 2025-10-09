import { simulateDeepLink } from '../../../hooks/useDeepLink';
import { useFilePermission } from '../../../native-elements/use-file-permission';
const LikedPage = () => {
  const testDeepLinks = () => {
    console.log('🧪 Testing deep link to profile');
    simulateDeepLink('hextok://profile');
  };

  // File permission hook (must be called at top-level of component)
  const { granted, request } = useFilePermission();

  return (
    <view className="flex-1 px-2 justify-center items-center">
      <text className="text-4xl text-white">Liked Page</text>
      <text className="text-white mb-4">Successfully navigated to /liked!</text>
      <text>
        {granted === true
          ? 'File permission granted'
          : granted === false
            ? 'File permission denied'
            : 'File permission unknown'}
      </text>
      <view className="bg-blue-600 p-3 rounded my-4" bindtap={request}>
        <text>Check</text>
      </view>
      <view className="space-y-4">
        <view
          className="bg-green-600 p-3 rounded"
          bindtap={() => {
            'background only';
            console.log('Opening file picker');
            console.log(`native modules inside bindtap`, NativeModules);
            // DON'T call NativeModules.FilePickerModule.open() inside typeof -
            // that will throw if open is undefined. Check the property safely.
            console.log(
              `FilePickerModule open exists`,
              typeof NativeModules?.FilePickerModule?.open === 'function'
                ? true
                : false,
            );
            console.log(
              `object detaild `,
              Object.keys(NativeModules.FilePickerModule || {}),
            );

            if (
              NativeModules &&
              NativeModules.FilePickerModule &&
              typeof NativeModules.FilePickerModule.open === 'function'
            ) {
              NativeModules.FilePickerModule.open(
                {
                  includeBase64: true,
                },
                (err, files) => {
                  console.log('File picker callback:', { err, files });
                },
              );
              console.log('File picker invoked');
            } else {
              console.warn(
                'FilePickerModule.open is not a function or missing',
                {
                  module: NativeModules
                    ? NativeModules.FilePickerModule
                    : undefined,
                },
              );
            }
          }}
        >
          <text className="text-white text-center">Open File Picker</text>
        </view>

        <view className="bg-blue-600 p-3 rounded" bindtap={testDeepLinks}>
          <text className="text-white text-center">
            Test Deep Link to Profile
          </text>
        </view>
      </view>
    </view>
  );
};

export default LikedPage;
