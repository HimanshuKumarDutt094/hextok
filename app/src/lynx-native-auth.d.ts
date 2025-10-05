/// <reference types="@lynx-js/rspeedy/client" />

// This file provides specific typing for NativeAuthModule following LynxJS docs patterns
// It should be consistent with the declarations in typing.d.ts

declare global {
  interface GlobalThis {
    lynx?: {
      nativeModules?: {
        NativeAuthModule?: {
          openAuth(
            url: string,
            options: Record<string, unknown>,
            callback: (
              error: { code: string; message: string } | null,
              result?: {
                success: boolean;
                redirectUrl: string;
                sessionCookie?: string;
              },
            ) => void,
          ): void;
          cancelAuth(callback: (error: null) => void): void;
        };
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  }
}

// Per LynxJS native module spec, `NativeModules` is a global provided in the Lynx runtime.
/* eslint-disable @typescript-eslint/no-unused-vars */
declare let NativeModules: {
  NativeAuthModule?: {
    openAuth(
      url: string,
      options: Record<string, unknown>,
      callback: (
        error: { code: string; message: string } | null,
        result?: {
          success: boolean;
          redirectUrl: string;
          sessionCookie?: string;
        },
      ) => void,
    ): void;
    cancelAuth(callback: (error: null) => void): void;
  };
  [key: string]: unknown;
};

declare module '@lynx-js/rspeedy/client' {
  // Extend the lynx global declaration with our native module
  interface NativeModules {
    NativeAuthModule: {
      openAuth(
        url: string,
        options: Record<string, unknown>,
        callback: (
          error: { code: string; message: string } | null,
          result?: {
            success: boolean;
            redirectUrl: string;
            sessionCookie?: string;
          },
        ) => void,
      ): void;
      cancelAuth(callback: (error: null) => void): void;
    };
  }
}

export {};
