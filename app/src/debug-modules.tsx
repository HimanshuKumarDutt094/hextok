import { useEffect } from '@lynx-js/react';

export function DebugModules() {
  useEffect(() => {
    console.log('🔍 [Debug] Checking all native modules...');

    if (typeof NativeModules === 'undefined') {
      console.error('❌ [Debug] NativeModules is undefined!');
      return;
    }

    console.log(
      '✅ [Debug] Available NativeModules:',
      Object.keys(NativeModules),
    );

    // Test LocalStorageModule (known working)
    if (NativeModules.LocalStorageModule) {
      console.log(
        '✅ [Debug] LocalStorageModule methods:',
        Object.getOwnPropertyNames(NativeModules.LocalStorageModule),
      );
      console.log(
        '✅ [Debug] LocalStorageModule.setStorageItem type:',
        typeof NativeModules.LocalStorageModule.setStorageItem,
      );
    } else {
      console.error('❌ [Debug] LocalStorageModule not found!');
    }

    // Test DeepLinkModule (broken)
    if (NativeModules.DeepLinkModule) {
      console.log('✅ [Debug] DeepLinkModule found!');
      console.log(
        '🔍 [Debug] DeepLinkModule methods:',
        Object.getOwnPropertyNames(NativeModules.DeepLinkModule),
      );
      console.log(
        '🔍 [Debug] DeepLinkModule.testMethod type:',
        typeof NativeModules.DeepLinkModule.testMethod,
      );
      console.log(
        '🔍 [Debug] DeepLinkModule.registerDeepLinks type:',
        typeof NativeModules.DeepLinkModule.registerDeepLinks,
      );
      console.log(
        '🔍 [Debug] DeepLinkModule.unregister type:',
        typeof NativeModules.DeepLinkModule.unregister,
      );

      // Try calling the test method
      if (typeof NativeModules.DeepLinkModule.testMethod === 'function') {
        try {
          NativeModules.DeepLinkModule.testMethod();
          console.log(
            '✅ [Debug] DeepLinkModule.testMethod() called successfully!',
          );
        } catch (error) {
          console.error(
            '❌ [Debug] DeepLinkModule.testMethod() failed:',
            error,
          );
        }
      }
    } else {
      console.error('❌ [Debug] DeepLinkModule not found!');
    }
  }, []);

  return null;
}
