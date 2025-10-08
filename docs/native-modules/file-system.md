# File System Module — Comprehensive File Management for LynxJS

Why this module

Mobile apps need robust file handling: downloads, uploads, caching, temporary storage, and document management. A first-class File System module provides a secure, performant, and consistent API across Android and iOS.

Design goals

- Standalone: plug-and-play native module
- Async, promise-based API with progress events
- Support for streaming large files without fully loading into memory
- Integration with platform permissions and external storage

Capabilities

- File and directory operations (read/write/move/copy/delete/stat)
- File download/upload with progress, retry, and resumable download support
- File system watching (notify on changes inside a directory)
- MIME type detection and extension utilities
- File compression/decompression (zip/tar/gzip)
- Access to external storage and media galleries with permission handling
- Temporary file creation and cleanup utilities

TypeScript interface

export type FileStat = {
path: string;
size: number;
isFile: boolean;
isDirectory: boolean;
modifiedAt: number; // epoch ms
};

export interface IFileSystemModule {
// Basic file operations
writeFile(path: string, base64Data: string, options?: { encoding?: 'base64'|'utf8' }): Promise<void>;
readFile(path: string, options?: { encoding?: 'base64'|'utf8' }): Promise<string>;
deleteFile(path: string): Promise<void>;
stat(path: string): Promise<FileStat>;
exists(path: string): Promise<boolean>;
mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
readdir(path: string): Promise<string[]>;
move(src: string, dest: string): Promise<void>;
copy(src: string, dest: string): Promise<void>;

// Streams / chunked
openReadStream(path: string, options?: { chunkSize?: number }): Promise<string>; // returns stream id
readStream(streamId: string): Promise<{ done: boolean; chunkBase64?: string }>;
closeStream(streamId: string): Promise<void>;

// Downloads / uploads
download(url: string, destPath: string, options?: { headers?: Record<string,string>; resume?: boolean; timeout?: number }, progressCallbackId?: string): Promise<void>;
upload(url: string, filePath: string, options?: { method?: 'POST'|'PUT'; headers?: Record<string,string>; fieldName?: string }, progressCallbackId?: string): Promise<{ status: number; body?: string }>;

// Watcher
watch(path: string, callbackId: string): Promise<string>; // returns watcher id
unwatch(watcherId: string): Promise<void>;

// Compression
zip(paths: string[], destZipPath: string): Promise<void>;
unzip(zipPath: string, destPath: string): Promise<void>;

// Helpers
getTemporaryDirectory(): Promise<string>;
getExternalStorageDirectory(): Promise<string>;
getMimeType(path: string): Promise<string>;
}

Usage example

const tmp = await Lynx.modules.FileSystem.getTemporaryDirectory();
await Lynx.modules.FileSystem.writeFile(tmp + '/hello.txt', btoa('hello world'), { encoding: 'base64' });

// Download with progress callback
await Lynx.modules.FileSystem.download('https://example.com/bigfile.zip', tmp + '/bigfile.zip', {}, 'dlProgressCb');

Integration notes

- Android: use OkHttp for downloads/uploads with support for interceptors and resume. Use FileProvider for exposing files to other apps.
- iOS: use URLSession with background configuration for large/background downloads; expose progress via delegate callbacks.
- Streaming: avoid buffering entire files to JS runtime; stream as base64-chunks and provide an index-based stream id.
- Permissions: request WRITE_EXTERNAL_STORAGE (Android < Q) and use SAF when needed; iOS should use UIDocumentPicker for external file access.

Edge cases

- Very large files: use background transfers and avoid keeping file content in memory
- Network flakiness: provide retry strategy with exponential backoff and resume support where the server supports range requests
- Cross-process file locks: ensure atomic file writes (write temp + move/rename)

Testing

- Unit tests for small operations using temp directories
- Android instrumentation for download/upload and FileProvider interactions
- iOS XCTest for background URLSession behaviors

Security

- Avoid allowing arbitrary file writes to app root. Document permitted directories and require explicit permission for external areas
- Validate MIME types and provide explicit opt-in before opening files with external apps

Next: I'll create the Enhanced Input module doc and then an index README to tie them together.  
(Updating todo list: file system completed, moving to enhanced input.)
