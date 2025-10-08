# LynxJS Core Documentation

## Overview

LynxJS is a comprehensive cross-platform framework that enables web developers to build native applications for Android, iOS, and Web using a single codebase. It leverages familiar web technologies like CSS and React while providing native rendering and pixel-perfect consistency across platforms.

## Architecture

### High-Level Components

#### Lynx Platform

The Lynx Platform is the collection of technologies and APIs that allows developers to create applications that run on the Lynx engine. Similar to the Web platform, it provides a unified development experience across different target platforms.

#### SDK (Software Development Kit)

The SDK is a collection of tools and libraries provided by Lynx contributors that enables developers to build apps. It primarily encapsulates two key layers:

- **Engine**: The native rendering and execution layer
- **Framework**: The developer-facing APIs and abstractions

#### Container

A self-contained module within an app responsible for managing LynxView instances. Key responsibilities include:

- Managing LynxView lifecycle
- Loading page resources (bundles, media, etc.)
- Handling navigation controls

#### LynxView

Similar to WebView in native development, LynxView renders bundles within a host application's context. It serves as the primary interface between the native host and Lynx content.

### Structure Components

#### Lynx Bundle

Contains all necessary resources for a Lynx app to run:

- Style sheets
- Scripts
- Serialized element trees

#### Lazy Bundle

Similar composition to regular bundles but loaded on-demand at runtime for specific components.

#### Page

The root element of a Lynx application, similar to the document in web development.

#### The Lynx Object

A binding object that offers common capabilities to script developers, available in both main thread and background thread runtimes.

## Threading Model

LynxJS implements a sophisticated dual-threaded architecture designed for optimal performance and responsiveness.

### Virtual Threads

#### UI Thread

The virtual thread corresponding to the OS main thread. Handles immediate UI updates and user interactions.

#### Background Scripting Thread

The virtual thread where scripts execute asynchronously. Formerly known as "JS Thread".

#### Engine Thread

The virtual thread that drives the pixel pipeline. Formerly known as "Tasm Thread".

#### Layout Thread

The virtual thread where layout calculations are performed.

### Scripting-Facing Threading Abstraction

#### Main Thread (Lynx Main Thread)

The scriptable thread that handles tasks directly affecting the pixel pipeline. Scripts on this thread can potentially block rendering.

#### Background Thread (Off-Main-Thread)

Scriptable threads that handle tasks outside the pixel pipeline, including:

- Business logic
- Data processing
- Network requests
- Event handling

#### Dual-Threaded Model

The programming model where developers can perceive and program with both main and background threads, enabling:

- Performance optimization through parallelism
- Main thread responsiveness
- Efficient resource utilization

## Scripting Runtime Environment

### Main Thread Scripting

- **Runtime**: Comprises PrimJS VM and APIs exposed from pixel pipeline
- **Scripts**: Intended for element manipulation and triggering pixeling operations
- **Use Cases**: Initial page loading, direct UI updates

### Background Thread Scripting

- **Runtime**: JavaScript engine with extended APIs via JavaScript Bridge (JSB)
- **Scripts**: Business logic, data processing, event handlers
- **Use Cases**: App logic, network requests, complex computations

### JavaScript FFI (Foreign Function Interface)

Mechanisms for JavaScript to call native code:

- **Node-API (N-API)**: Industry standard for native addons
- **JavaScript Interface (JSI)**: Enables bidirectional object references
- **PrimJS API (PAPI)**: High-performance API with special HostRef objects

## Pipeline Architecture

The Lynx pipeline converts app structures into visual representations through four main phases:

### 1. Load

Requesting and fetching the bundle during first-screen rendering.

### 2. Parse

Converting bundle contents into directly consumable formats for subsequent processing.

### 3. Framework Rendering

Executing application scripts to create and synchronize UI representations with the element tree through element manipulation.

### 4. Pixel Pipeline

Converting element trees into actual pixels displayed on screen through:

- **Resolve**: Generating computed styles and prop bundles
- **Layout**: Calculating element positions and sizes
- **Execute UI Operations**: Applying paint and layout operations
- **Paint**: Final pixeling based on platform UI

## Element System

### Element Hierarchy

- **Element Tag**: Static markup structure in DSL
- **Element**: Native objects forming tree structures
- **Component**: Reusable UI pieces built upon elements
- **Layout Node**: Holds layout-related computed styles
- **Platform UI**: Platform-level nodes carrying paint and layout results

### Built-in Elements

Core elements available without configuration:

- `<page>`: Root container element
- `<view>`: Basic container with styling capabilities
- `<text>`: Text content display
- `<image>`: Image rendering with auto-sizing
- `<scroll-view>`: Scrollable content containers
- `<list>`: High-performance scrollable lists with recycling

### Element Operations

- **Element Tree Mutation**: Insert, delete, replace elements
- **Element Mutation**: Set, get element attributes
- **Element Methods**: Information retrieval and manipulation
- **Selector Query**: Find elements by selectors (ID, class, tag)

## Styling System

LynxJS implements a CSS-like styling system with:

- **Style Sheets**: External style definitions
- **Style Rules**: Individual styling declarations
- **Computed Styles**: Final resolved styles for elements
- **Inline Styles**: Direct element styling
- **Paint-Related Styles**: Background, color, visual properties
- **Layout-Related Styles**: Width, height, positioning

## Event System

### Event Types

- **Event Object**: Contains state information related to events
- **Main Thread Events**: Processed synchronously on main thread
- **Background Thread Events**: Processed asynchronously via ITC

### Event Propagation

- **Event Response Chain**: Series of elements that can respond to events
- **Event Capture**: Top-down propagation from root
- **Event Bubble**: Bottom-up propagation to root
- **Event Interception**: Ability to stop propagation

### Event Handling

- **Main Thread Handlers**: Immediate UI response
- **Background Thread Handlers**: Business logic processing
- **Event Binding**: `bind*` for normal propagation, `catch*` for capture

## Running Scenarios

### Standalone

Independent usage scenarios:

- Single page applications
- Full-screen applications

### Embedded

Integration within existing UI systems:

- Multiple cards within feeds
- Partial screen integration
- Mixed native/Lynx interfaces

## Performance Considerations

### First-Screen Rendering (FSR)

Special main thread rendering during app load for optimal initial experience.

### Re-rendering

Post-initial rendering that can utilize either:

- Main thread rendering for immediate updates
- Background-driven rendering for complex operations

### Parallel Processing

- Parallel resolve operations across multiple threads
- Background thread utilization for heavy computations
- Main thread preservation for UI responsiveness

## Development Workflow

### Bundle Structure

Applications are packaged as bundles containing:

- Compiled JavaScript
- Style definitions
- Element tree serialization
- Resource references

### Integration Points

- Host platform integration
- Native module registration
- Custom element registration
- Performance monitoring hooks

This architecture enables LynxJS to provide a web-like development experience while delivering native performance and platform-specific optimizations.
