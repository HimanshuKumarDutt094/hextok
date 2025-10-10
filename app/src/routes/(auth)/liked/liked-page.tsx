import { useState } from '@lynx-js/react';
import { simulateDeepLink } from '../../../hooks/useDeepLink';
import { useFilePermission } from '../../../native-elements/use-file-permission';
import WebViewTest from '../../../components/webview-test';
const LikedPage = () => {
  const testDeepLinks = () => {
    console.log('🧪 Testing deep link to profile');
    simulateDeepLink('hextok://profile');
  };

  // File permission hook (must be called at top-level of component)
  const { granted, request } = useFilePermission();
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<
    'image' | 'video' | 'audio' | 'document' | null
  >(null);
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
            NativeModules.FilePickerModule.diagnosticReturnComplex(
              (err, data) => {
                console.log('diagnostic callback', { err, data });
              },
            );

            if (
              NativeModules &&
              NativeModules.FilePickerModule &&
              typeof NativeModules.FilePickerModule.open === 'function'
            ) {
              // const cb = ;
              NativeModules.FilePickerModule.open(
                { includeBase64: false },
                (err, files) => {
                  if (err || !files) {
                    console.error('FilePickerModule.open error:', err);
                    return;
                  }
                  setSelectedFileUrl(files[0].uri);
                  setFileType(
                    files[0].mimeType?.startsWith('image/')
                      ? 'image'
                      : files[0].mimeType?.startsWith('video/')
                        ? 'video'
                        : files[0].mimeType?.startsWith('audio/')
                          ? 'audio'
                          : files[0].mimeType
                            ? 'document'
                            : null,
                  );
                  console.log('FilePickerModule.open success, files:', files);
                  console.log('callback err', err);
                  console.log('callback files', files);
                  console.log('err typeof', typeof err, err);
                  console.log('files typeof', typeof files, files);
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

        <view className="bg-blue-600 p-3 rounded">
          <text className="text-white text-center">
            Test Deep Link to Profile
          </text>
          {fileType === 'image' && selectedFileUrl && (
            <image
              style={{ width: '300px', height: '200px' }}
              src={selectedFileUrl}
            />
          )}
          {fileType === 'video' && selectedFileUrl && (
            <media-player
              src={selectedFileUrl}
              autoplay
              style={{ width: '300px', height: '200px' }}
            />
          )}
          {/* <image
            style={{ width: '300px', height: '200px' }}
            src="content://com.android.providers.media.documents/document/image%3A1000226317"
          /> */}
          {/* <video src="https://www.w3schools.com/html/mov_bbb.mp4" /> */}
        </view>
        <WebViewTest />
      </view>
    </view>
  );
};

export default LikedPage;
