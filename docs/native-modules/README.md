# Native Modules for LynxJS — Quick Index

This folder contains standalone, plug-and-play documentation for 5 essential native modules/elements that improve LynxJS mobile app capabilities. Each module is designed to be independent so you can adopt them selectively.

Modules

- WebView — docs/native-modules/webview.md
  Embedded web content, JS bridge, cookie & session management, navigation and progress events.

- Secure Storage — docs/native-modules/secure-storage.md
  Encrypted, high-performance key-value store with batch ops, namespaces, and migrations.

- Native Picker — docs/native-modules/native-picker.md
  Rich native pickers: dropdown, date/time, multi-select, cascading pickers with accessibility.

- File System — docs/native-modules/file-system.md
  File and directory ops, download/upload with progress, streaming, compression, and external access.

- Enhanced Input — docs/native-modules/enhanced-input.md
  Rich text editing, auto-complete, validation, password strength indicators, and OTP fields.

Quick install and usage (conceptual)

1. Add native module packages to your Android/iOS project using the recommended gradle/cocoapods setup.
2. Register the module with LynxJS following the pattern in docs/modules.md (expose a TypeScript interface and bridge).
3. Use in your LynxJS code via the `Lynx.modules.<ModuleName>` API or the element registration for UI components.

Example (SecureStorage)

// open a store
const handle = await Lynx.modules.SecureStorage.open({ name: 'user-store' });
await Lynx.modules.SecureStorage.set(handle, 'auth_token', token);

Notes

- Each doc file contains Android/iOS implementation notes, TS interfaces, and testing/security recommendations.
- Follow the platform-specific notes in each file for performance optimizations and permission handling.

Next steps

- Implement the native modules in your Android/iOS codebase following the interfaces here.
- Add small TypeScript wrappers in the LynxJS app package to provide typed usage.
- Add CI tests and instrumentation tests per module for platform validation.

If you'd like, I can scaffold the TypeScript wrapper files for these modules in `src/native-modules/` and add a brief Kotlin/Swift stub for each module to accelerate implementation.
