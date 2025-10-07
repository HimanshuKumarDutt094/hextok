import { useCallback } from '@lynx-js/react';

/**
 * Hook for managing local storage in Lynx applications
 * Provides async methods for storing and retrieving data
 */
export function useLocalStorage() {
  const setItem = useCallback(
    async (key: string, value: string): Promise<void> => {
      'background only';

      return new Promise((resolve, reject) => {
        try {
          if (
            typeof NativeModules === 'undefined' ||
            !NativeModules.LocalStorageModule
          ) {
            reject(new Error('LocalStorageModule not available'));
            return;
          }

          NativeModules.LocalStorageModule.setStorageItem(key, value);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
    [],
  );

  const getItem = useCallback(async (key: string): Promise<string | null> => {
    'background only';

    return new Promise((resolve, reject) => {
      try {
        if (
          typeof NativeModules === 'undefined' ||
          !NativeModules.LocalStorageModule
        ) {
          reject(new Error('LocalStorageModule not available'));
          return;
        }

        NativeModules.LocalStorageModule.getStorageItem(
          key,
          (value: string | null) => {
            resolve(value);
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    'background only';

    return new Promise((resolve, reject) => {
      try {
        if (
          typeof NativeModules === 'undefined' ||
          !NativeModules.LocalStorageModule
        ) {
          reject(new Error('LocalStorageModule not available'));
          return;
        }

        NativeModules.LocalStorageModule.removeStorageItem(key);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    'background only';

    return new Promise((resolve, reject) => {
      try {
        if (
          typeof NativeModules === 'undefined' ||
          !NativeModules.LocalStorageModule
        ) {
          reject(new Error('LocalStorageModule not available'));
          return;
        }

        NativeModules.LocalStorageModule.clearStorage();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const getAllKeys = useCallback(async (): Promise<string[]> => {
    'background only';

    return new Promise((resolve, reject) => {
      try {
        if (
          typeof NativeModules === 'undefined' ||
          !NativeModules.LocalStorageModule
        ) {
          reject(new Error('LocalStorageModule not available'));
          return;
        }

        NativeModules.LocalStorageModule.getAllKeys((keys: string[]) => {
          resolve(keys);
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    getAllKeys,
  };
}
