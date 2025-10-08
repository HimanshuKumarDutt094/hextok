# Secure Storage Module — Encrypted, High-Performance Key-Value Store

Why this module

Production mobile apps need a fast, encrypted, and thread-safe key-value storage for tokens, small caches, and user preferences. LynxJS benefits from a storage implementation similar in spirit to MMKV (React Native) but built with LynxJS's dual-threading model and mobile constraints in mind.

Design goals

- Standalone: no dependency on other native modules
- Encrypted at rest with platform-backed encryption (Android Keystore, iOS Keychain)
- Thread-safe and optimized for high throughput (batch operations)
- API suitable for background worker usage and main thread usage
- Migration utilities for converting from AsyncStorage-like sources

Capabilities

- Encrypted key/value store for strings and binary data
- Synchronous and asynchronous operations (prefer async promises)
- Batch read/write and atomic transactions
- Namespaces (multiple stores) and TTL entries
- Storage size and usage metrics
- Data migration utilities and versioned migrations
- Clear/backup/restore APIs

TypeScript interface

export type StorageOptions = {
name?: string; // store name/namespace, default: 'default'
encrypt?: boolean; // default: true
ttl?: number | null; // default: null, in ms
};

export interface ISecureStorage {
// Open/create a store namespace and return a handle
open(options?: StorageOptions): Promise<string>;
close(handle: string): Promise<void>;

// Basic operations
get(handle: string, key: string): Promise<string | null>;
set(handle: string, key: string, value: string, options?: { ttl?: number | null }): Promise<void>;
remove(handle: string, key: string): Promise<void>;
has(handle: string, key: string): Promise<boolean>;

// Binary-safe operations
setBinary(handle: string, key: string, valueBase64: string): Promise<void>;
getBinary(handle: string, key: string): Promise<string | null>; // base64

// Batch operations
multiGet(handle: string, keys: string[]): Promise<Array<[string, string | null]>>;
multiSet(handle: string, pairs: Array<[string, string]>): Promise<void>;
multiRemove(handle: string, keys: string[]): Promise<void>;

// Atomic transaction
transaction(handle: string, operations: Array<{type: 'set'|'remove', key: string, value?: string}>): Promise<void>;

// Utility
clear(handle: string): Promise<void>;
getKeys(handle: string): Promise<string[]>;
getUsage(handle: string): Promise<{ bytesUsed: number; itemCount: number }>;

// Migration
migrateFromAsyncStorage(handle: string, adapterId?: string): Promise<void>;

// Backup / Restore
export(handle: string, options?: { includeMeta?: boolean }): Promise<string>; // base64 or encrypted blob
import(handle: string, blobBase64: string, options?: { overwrite?: boolean }): Promise<void>;
}

Usage example (TypeScript)

const store = await Lynx.modules.SecureStorage.open({ name: 'user-store' });
await Lynx.modules.SecureStorage.set(store, 'auth_token', 'eyJ...');
const token = await Lynx.modules.SecureStorage.get(store, 'auth_token');

// Batch
await Lynx.modules.SecureStorage.multiSet(store, [['a','1'], ['b','2']]);
const pairs = await Lynx.modules.SecureStorage.multiGet(store, ['a','b','c']);

Android implementation notes

- Base storage: use MMKV or RocksDB for speed; prefer MMKV when small key-value workloads are predominant
- Encryption: use Android Keystore to store the encryption key, use AES-GCM for content encryption
- Thread-safety: expose a thread-safe native API and use coroutines to process calls from worker threads
- TTL: implement via per-key metadata and periodic cleanup on store open or as a background job
- Migration: provide a utility that reads from SharedPreferences/AsyncStorage export and writes into this store preserving types where possible

iOS implementation notes

- Base storage: use SQLite or NSUserDefaults/Keychain depending on size; for speed and features, SQLite with a small wrapper is recommended
- Encryption: store encryption keys in Keychain and encrypt values using AES-GCM
- Thread-safety: ensure read/write operations are done on a dedicated serial queue

Data migration strategy

- Provide a two-phase migration for large datasets: (1) export from source to temporary encrypted blob, (2) import into new store and verify integrity
- Provide hooks to display migration progress back to UI (percent complete) so large migrations can be monitored

Testing

- Unit tests for TypeScript wrapper and mocks
- Android: instrumentation tests for concurrency and encryption
- iOS: XCTest for Keychain integration and data integrity

Security considerations

- Keys should never be exported in plaintext
- Document that backup/export should be encrypted with a user-provided passphrase if required
- Consider biometric encryption unlock optionally

Performance notes

- Prefer batching for writes to avoid I/O thrashing
- Expose metrics for bytesWritten and average latency to allow app-level tuning

Implementation scaffold (created files)

To accelerate integration, a TypeScript wrapper and Android Kotlin stubs were scaffolded in the repository:

- `app/src/native-modules/secure-storage.ts` — TypeScript wrapper exposing the `ISecureStorage` interface used by app code.
- `app/android/app/src/main/kotlin/com/yourapp/securestorage/SecureStorageModule.kt` — Kotlin native module scaffold (in-memory store) with methods matching the TypeScript wrapper. Replace the in-memory store with MMKV/SQLCipher and hook up Android Keystore for encryption in production.
- `app/android/app/src/main/kotlin/com/yourapp/securestorage/SecureStoragePackage.kt` — Package helper to register the module.

These files are scaffolds: they implement the API surface and thread marshalling but the storage backend and encryption are intentionally minimal so you can replace them with your chosen secure backend.

Usage notes

- The TypeScript wrapper assumes a global `Lynx.modules.SecureStorage` bridge is registered. Adapt the bridge lookup in `app/src/native-modules/secure-storage.ts` if your project exposes native modules differently.
- After you integrate the Kotlin module into your app's native module registration, calls from `app.tsx` to the TypeScript wrapper should work with type safety.

Next: I will complete the Native Picker document and then the File System doc.  
(Updating todo list: secure storage completed, moving to native picker.)
