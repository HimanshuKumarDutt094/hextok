# LynxJS APIs Documentation

## Overview

LynxJS provides a comprehensive set of APIs that enable developers to build native applications using web technologies. These APIs are designed to bridge the gap between JavaScript code and native platform capabilities while maintaining performance and responsiveness.

## Element APIs

### Element PAPI (PrimJS API)

The main thread runtime exposes Element PAPI to framework developers for direct element manipulation.

#### Core Element Operations

```typescript
// Element creation and manipulation
__CreateView(id: number): ElementRef
__SetStyleProperty(element: ElementRef, property: string, value: string): void
__GetStyleProperty(element: ElementRef, property: string): string
__SetAttribute(element: ElementRef, attribute: string, value: any): void
__GetAttribute(element: ElementRef, attribute: string): any
```

#### Element Tree Operations

```typescript
// Tree manipulation
__AppendChild(parent: ElementRef, child: ElementRef): void
__RemoveChild(parent: ElementRef, child: ElementRef): void
__InsertBefore(parent: ElementRef, newChild: ElementRef, beforeChild: ElementRef): void
__ReplaceChild(parent: ElementRef, newChild: ElementRef, oldChild: ElementRef): void
```

#### Style Management

```typescript
// Inline style operations
__SetInlineStyle(element: ElementRef, styles: Record<string, string>): void
__GetComputedStyle(element: ElementRef): ComputedStyleResult

// CSS class management
__AddClass(element: ElementRef, className: string): void
__RemoveClass(element: ElementRef, className: string): void
__ToggleClass(element: ElementRef, className: string): boolean
__HasClass(element: ElementRef, className: string): boolean
```

### Element Object Model (EOM)

Higher-level object model encapsulating Element PAPI for main thread script developers.

```typescript
interface ElementObject {
  // Properties
  id: string;
  className: string;
  style: CSSStyleDeclaration;
  dataset: Record<string, string>;

  // Methods
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;

  appendChild(child: ElementObject): void;
  removeChild(child: ElementObject): void;
  insertBefore(newChild: ElementObject, beforeChild: ElementObject): void;

  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}
```

### Element Inter Thread Call (Element ITC)

Background thread interface for cross-thread element operations.

```typescript
// Selector query from background thread
lynx
  .createSelectorQuery()
  .select('#elementId')
  .boundingClientRect()
  .exec(callback);

// Element method invocation
lynx
  .createSelectorQuery()
  .select('.className')
  .invoke({
    method: 'focus',
    params: {},
    success: (result) => console.log('Success:', result),
    fail: (error) => console.log('Error:', error),
  })
  .exec();
```

## Built-in Element APIs

### View Element

Basic container element with styling and layout capabilities.

```typescript
interface ViewElement {
  // Standard element properties
  id?: string;
  className?: string;
  style?: StyleProperties;

  // Event handlers (background thread)
  bindtap?: (event: TapEvent) => void;
  bindlongpress?: (event: LongPressEvent) => void;
  bindtouchstart?: (event: TouchEvent) => void;
  bindtouchmove?: (event: TouchEvent) => void;
  bindtouchend?: (event: TouchEvent) => void;

  // Capture variants
  catchtap?: (event: TapEvent) => void;
  catchlongpress?: (event: LongPressEvent) => void;
}
```

### Text Element

Text content display with styling support.

```typescript
interface TextElement {
  // Content
  children?: string | number;

  // Text-specific styling
  style?: TextStyleProperties & {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: string;
    textDecoration?: string;
  };
}
```

### Image Element

Image rendering with various source types and sizing options.

```typescript
interface ImageElement {
  src: string;
  'auto-size'?: boolean;
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix';

  // Event handlers
  bindload?: (event: ImageLoadEvent) => void;
  binderror?: (event: ImageErrorEvent) => void;

  // Lazy loading
  lazy?: boolean;

  style?: ImageStyleProperties;
}
```

### Scroll View Element

Scrollable container with direction and behavior controls.

```typescript
interface ScrollViewElement {
  // Scroll configuration
  'scroll-x'?: boolean;
  'scroll-y'?: boolean;
  'upper-threshold'?: number;
  'lower-threshold'?: number;

  // Scroll position
  'scroll-top'?: number;
  'scroll-left'?: number;

  // Event handlers
  bindscroll?: (event: ScrollEvent) => void;
  bindscrolltoupper?: (event: ScrollEvent) => void;
  bindscrolltolower?: (event: ScrollEvent) => void;

  // Enhanced scrolling
  'enable-back-to-top'?: boolean;
  'scroll-with-animation'?: boolean;
}
```

### List Element

High-performance scrollable list with recycling.

```typescript
interface ListElement {
  // Data binding
  data?: any[];

  // Performance options
  'item-height'?: number | 'auto';
  'buffer-size'?: number;

  // Event handlers
  bindscroll?: (event: ListScrollEvent) => void;
  binditemtap?: (event: ListItemEvent) => void;

  // Refresh control
  'enable-refresh'?: boolean;
  bindrefresh?: (event: RefreshEvent) => void;
}
```

## Global APIs

### Lynx Object

The global `lynx` object provides core platform capabilities.

```typescript
interface LynxGlobal {
  // Environment
  env: {
    platform: 'android' | 'ios' | 'web';
    version: string;
    debug: boolean;
  };

  // Navigation
  navigateTo(options: NavigationOptions): void;
  navigateBack(delta?: number): void;
  redirectTo(options: NavigationOptions): void;

  // Selector queries
  createSelectorQuery(): SelectorQuery;

  // Lifecycle
  reload(): void;
  exitMiniProgram(): void;

  // Storage (background thread only)
  getStorageSync(key: string): any;
  setStorageSync(key: string, value: any): void;
  removeStorageSync(key: string): void;
  clearStorageSync(): void;

  // Async storage
  getStorage(options: GetStorageOptions): void;
  setStorage(options: SetStorageOptions): void;
  removeStorage(options: RemoveStorageOptions): void;
  clearStorage(options: ClearStorageOptions): void;

  // Network (background thread only)
  request(options: RequestOptions): RequestTask;

  // Device APIs
  getSystemInfo(options: SystemInfoOptions): void;
  getSystemInfoSync(): SystemInfo;

  // UI feedback
  showToast(options: ToastOptions): void;
  showModal(options: ModalOptions): void;
  showActionSheet(options: ActionSheetOptions): void;

  // Animation
  createAnimation(options: AnimationOptions): Animation;
}
```

### Selector Query API

Interface for querying and manipulating elements from background thread.

```typescript
interface SelectorQuery {
  select(selector: string): SelectorQuery;
  selectAll(selector: string): SelectorQuery;
  selectViewport(): SelectorQuery;

  // Information queries
  boundingClientRect(): SelectorQuery;
  scrollOffset(): SelectorQuery;
  fields(fields: FieldsOptions): SelectorQuery;

  // Method invocation
  invoke(options: InvokeOptions): SelectorQuery;

  // Execution
  exec(callback?: (results: any[]) => void): void;
}

interface InvokeOptions {
  method: string;
  params?: Record<string, any>;
  success?: (result: any) => void;
  fail?: (error: any) => void;
}
```

## Native Module APIs

### NativeModules Global

Access point for all registered native modules.

```typescript
declare global {
  const NativeModules: {
    [moduleName: string]: {
      [methodName: string]: (...args: any[]) => any;
    };
  };
}

// Example usage
NativeModules.MyCustomModule.someMethod(param1, param2, callback);
```

### Module Registration (Native Side)

#### Android

```kotlin
// Module implementation
class MyNativeModule(context: Context) : LynxModule(context) {
  @LynxMethod
  fun someMethod(param: String, callback: Callback) {
    // Implementation
    callback.invoke("result")
  }
}

// Registration
LynxEnv.inst().registerModule("MyCustomModule", MyNativeModule::class.java)
```

#### iOS

```swift
// Module implementation
@objc(MyNativeModule)
class MyNativeModule: NSObject, LynxModule {
  @objc
  func someMethod(_ param: String, callback: @escaping LynxCallback) {
    // Implementation
    callback(["result"])
  }
}

// Registration
LynxModuleRegistry.shared.register("MyCustomModule", MyNativeModule.self)
```

## Event System APIs

### Event Objects

Standard event object structure across all events.

```typescript
interface BaseEvent<T = any> {
  type: string;
  timeStamp: number;
  target: {
    id: string;
    tagName: string;
    dataset: Record<string, string>;
  };
  currentTarget: {
    id: string;
    tagName: string;
    dataset: Record<string, string>;
  };
  detail: T;
}

// Specific event types
interface TapEvent extends BaseEvent<{ x: number; y: number }> {}
interface TouchEvent
  extends BaseEvent<{
    touches: Touch[];
    changedTouches: Touch[];
  }> {}
interface ScrollEvent
  extends BaseEvent<{
    scrollLeft: number;
    scrollTop: number;
    scrollHeight: number;
    scrollWidth: number;
  }> {}
```

### Touch Events

```typescript
interface Touch {
  identifier: number;
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
}

// Event binding
<view
  bindtouchstart={(e: TouchEvent) => {
    console.log('Touch started', e.detail.touches);
  }}
  bindtouchmove={(e: TouchEvent) => {
    console.log('Touch moved', e.detail.changedTouches);
  }}
  bindtouchend={(e: TouchEvent) => {
    console.log('Touch ended');
  }}
/>;
```

## Animation APIs

### Animation Creation

```typescript
interface Animation {
  // Transform
  translate(tx: number, ty?: number): Animation;
  scale(sx: number, sy?: number): Animation;
  rotate(angle: number): Animation;
  skew(ax: number, ay?: number): Animation;

  // Style
  opacity(value: number): Animation;
  backgroundColor(color: string): Animation;
  width(value: number): Animation;
  height(value: number): Animation;

  // Timing
  duration(ms: number): Animation;
  delay(ms: number): Animation;
  timingFunction(easing: string): Animation;

  // Execution
  step(): Animation;
  export(): AnimationExport;
}

// Usage
const animation = lynx.createAnimation({
  duration: 300,
  timingFunction: 'ease-in-out',
});

animation.translate(100, 0).rotate(45).step();
```

## Performance APIs

### Timing APIs

```typescript
// Performance measurement
console.time('operation');
// ... operation
console.timeEnd('operation');

// Custom timing
lynx.setExtraTiming({
  openTime: Date.now(),
  prepareTemplateStart: Date.now(),
  prepareTemplateEnd: Date.now(),
  containerInitStart: Date.now(),
  containerInitEnd: Date.now(),
});
```

### Memory Management

```typescript
// Explicit cleanup
element.destroy?.();

// Weak references for large objects
const weakRef = new WeakRef(largeObject);
```

## Platform-Specific APIs

### Android Specific

```typescript
// Android-only capabilities
if (lynx.env.platform === 'android') {
  NativeModules.AndroidUtils.requestPermission('camera');
}
```

### iOS Specific

```typescript
// iOS-only capabilities
if (lynx.env.platform === 'ios') {
  NativeModules.IOSUtils.presentViewController(options);
}
```

## Error Handling

### API Error Patterns

```typescript
// Callback pattern
lynx.request({
  url: 'https://api.example.com/data',
  success: (response) => {
    console.log('Success:', response);
  },
  fail: (error) => {
    console.error('Error:', error);
  },
});

// Promise pattern (where supported)
try {
  const result = await lynx.requestAsync(options);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error);
}
```

This API documentation provides the foundation for building robust LynxJS applications with full access to native platform capabilities while maintaining a familiar web development experience.
