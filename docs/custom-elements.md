# LynxJS Custom Elements Documentation

## Overview

Custom Elements in LynxJS allow developers to extend the platform's capabilities by creating native UI components that can be used seamlessly within LynxJS applications. When built-in elements don't meet your requirements, custom elements provide a powerful way to implement platform-specific functionality while maintaining the declarative development model.

## Architecture

### Element Hierarchy

```
Element Tag (DSL) → Element (Native Object) → Layout Node → Platform UI
```

- **Element Tag**: Static markup structure in DSL (`<custom-element>`)
- **Element**: Native object created during framework rendering
- **Layout Node**: Holds layout-related computed styles
- **Platform UI**: Platform-specific view (Android View, iOS UIView)

### Integration Points

Custom elements integrate with LynxJS through several key mechanisms:

- **Native Registration**: Platform-specific element registration
- **Property Binding**: Two-way data flow between JS and native
- **Event System**: Native-to-JS event propagation
- **Layout Engine**: Integration with Starlight layout system
- **Styling**: CSS-like style application

## Development Process

### Step 1: Design the Element Interface

Define the element's API in your TypeScript declarations:

```typescript
// src/typing.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'explorer-input': ExplorerInputProps;
      'media-player': MediaPlayerProps;
      'chart-view': ChartViewProps;
      'camera-preview': CameraPreviewProps;
    }
  }
}

interface ExplorerInputProps {
  // Properties
  value?: string;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'password' | 'email' | 'number';
  disabled?: boolean;

  // Events (background thread)
  bindinput?: (event: InputEvent) => void;
  bindfocus?: (event: FocusEvent) => void;
  bindblur?: (event: BlurEvent) => void;
  bindchange?: (event: ChangeEvent) => void;

  // Standard element properties
  id?: string;
  className?: string;
  style?: CSSProperties;
}

interface InputEvent {
  detail: {
    value: string;
    cursor: number;
  };
}
```

### Step 2: Android Implementation

#### Element Class Structure

```kotlin
// LynxExplorerInput.kt
package com.lynx.explorer.elements

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.text.InputType
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.widget.AppCompatEditText
import com.lynx.tasm.behavior.LynxContext
import com.lynx.tasm.behavior.LynxProp
import com.lynx.tasm.behavior.LynxUIMethod
import com.lynx.tasm.behavior.LynxUIMethodConstants
import com.lynx.tasm.behavior.ui.LynxUI
import com.lynx.tasm.event.LynxCustomEvent
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableMap

class LynxExplorerInput(context: LynxContext) : LynxUI<AppCompatEditText>(context) {

  private var isUpdating = false

  override fun createView(context: Context): AppCompatEditText {
    return AppCompatEditText(context).apply {
      // Configure the native view
      setSingleLine(true)

      addTextChangedListener(object : TextWatcher {
        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

        override fun afterTextChanged(s: Editable?) {
          if (!isUpdating) {
            emitEvent("input", mapOf(
              "value" to (s?.toString() ?: ""),
              "cursor" to selectionStart
            ))
          }
        }
      })

      setOnFocusChangeListener { _, hasFocus ->
        if (hasFocus) {
          emitEvent("focus", mapOf("value" to text.toString()))
        } else {
          emitEvent("blur", mapOf("value" to text.toString()))
          emitEvent("change", mapOf("value" to text.toString()))
        }
      }
    }
  }

  // Property handlers
  @LynxProp(name = "value")
  fun setValue(value: String) {
    if (value != mView.text.toString()) {
      isUpdating = true
      mView.setText(value)
      mView.setSelection(value.length)
      isUpdating = false
    }
  }

  @LynxProp(name = "placeholder")
  fun setPlaceholder(placeholder: String) {
    mView.hint = placeholder
  }

  @LynxProp(name = "maxLength")
  fun setMaxLength(maxLength: Int) {
    mView.filters = arrayOf(InputFilter.LengthFilter(maxLength))
  }

  @LynxProp(name = "type")
  fun setType(type: String) {
    val inputType = when (type) {
      "password" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
      "email" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
      "number" -> InputType.TYPE_CLASS_NUMBER
      else -> InputType.TYPE_CLASS_TEXT
    }
    mView.inputType = inputType
  }

  @LynxProp(name = "disabled")
  fun setDisabled(disabled: Boolean) {
    mView.isEnabled = !disabled
    mView.alpha = if (disabled) 0.5f else 1.0f
  }

  // Layout handling
  override fun onLayoutUpdated() {
    super.onLayoutUpdated()
    val paddingTop = mPaddingTop + mBorderTopWidth
    val paddingBottom = mPaddingBottom + mBorderBottomWidth
    val paddingLeft = mPaddingLeft + mBorderLeftWidth
    val paddingRight = mPaddingRight + mBorderRightWidth
    mView.setPadding(paddingLeft, paddingTop, paddingRight, paddingBottom)
  }

  // Imperative methods
  @LynxUIMethod
  fun focus(params: ReadableMap, callback: Callback) {
    if (mView.requestFocus()) {
      if (showSoftInput()) {
        callback.invoke(LynxUIMethodConstants.SUCCESS)
      } else {
        callback.invoke(LynxUIMethodConstants.UNKNOWN, "Failed to show keyboard")
      }
    } else {
      callback.invoke(LynxUIMethodConstants.UNKNOWN, "Failed to focus")
    }
  }

  @LynxUIMethod
  fun blur(params: ReadableMap, callback: Callback) {
    mView.clearFocus()
    hideSoftInput()
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  @LynxUIMethod
  fun getValue(params: ReadableMap, callback: Callback) {
    callback.invoke(LynxUIMethodConstants.SUCCESS, mView.text.toString())
  }

  @LynxUIMethod
  fun setValue(params: ReadableMap, callback: Callback) {
    val value = params.getString("value") ?: ""
    setValue(value)
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  // Helper methods
  private fun showSoftInput(): Boolean {
    val imm = lynxContext.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    return imm.showSoftInput(mView, InputMethodManager.SHOW_IMPLICIT)
  }

  private fun hideSoftInput() {
    val imm = lynxContext.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    imm.hideSoftInputFromWindow(mView.windowToken, 0)
  }

  private fun emitEvent(name: String, detail: Map<String, Any>) {
    val event = LynxCustomEvent(sign, name)
    detail.forEach { (key, value) ->
      event.addDetail(key, value)
    }
    lynxContext.eventEmitter.sendCustomEvent(event)
  }
}
```

#### Registration

```kotlin
// Global registration
LynxEnv.inst().addBehavior(object : Behavior("explorer-input") {
  override fun createUI(context: LynxContext): LynxExplorerInput {
    return LynxExplorerInput(context)
  }
})

// Local registration (per LynxView)
val lynxViewBuilder = LynxViewBuilder()
lynxViewBuilder.addBehavior(object : Behavior("explorer-input") {
  override fun createUI(context: LynxContext): LynxExplorerInput {
    return LynxExplorerInput(context)
  }
})
```

### Step 3: iOS Implementation

```swift
// LynxExplorerInput.swift
import UIKit

class LynxExplorerInput: LynxUIView<UITextField> {

  private var isUpdating = false

  override func createView() -> UITextField {
    let textField = UITextField()

    textField.borderStyle = .none
    textField.delegate = self

    textField.addTarget(self, action: #selector(textFieldDidChange), for: .editingChanged)
    textField.addTarget(self, action: #selector(textFieldDidBeginEditing), for: .editingDidBegin)
    textField.addTarget(self, action: #selector(textFieldDidEndEditing), for: .editingDidEnd)

    return textField
  }

  // Property handlers
  @objc
  func setValue(_ value: String) {
    guard !isUpdating && value != nativeView.text else { return }

    isUpdating = true
    nativeView.text = value
    isUpdating = false
  }

  @objc
  func setPlaceholder(_ placeholder: String) {
    nativeView.placeholder = placeholder
  }

  @objc
  func setType(_ type: String) {
    switch type {
    case "password":
      nativeView.isSecureTextEntry = true
      nativeView.keyboardType = .default
    case "email":
      nativeView.keyboardType = .emailAddress
    case "number":
      nativeView.keyboardType = .numberPad
    default:
      nativeView.keyboardType = .default
    }
  }

  @objc
  func setDisabled(_ disabled: Bool) {
    nativeView.isEnabled = !disabled
    nativeView.alpha = disabled ? 0.5 : 1.0
  }

  // Event handlers
  @objc
  private func textFieldDidChange() {
    guard !isUpdating else { return }

    emitEvent(name: "input", detail: [
      "value": nativeView.text ?? "",
      "cursor": nativeView.selectedTextRange?.start ?? 0
    ])
  }

  @objc
  private func textFieldDidBeginEditing() {
    emitEvent(name: "focus", detail: [
      "value": nativeView.text ?? ""
    ])
  }

  @objc
  private func textFieldDidEndEditing() {
    emitEvent(name: "blur", detail: [
      "value": nativeView.text ?? ""
    ])
    emitEvent(name: "change", detail: [
      "value": nativeView.text ?? ""
    ])
  }

  // Imperative methods
  @objc
  func focus(_ params: [String: Any], callback: @escaping LynxCallback) {
    DispatchQueue.main.async {
      if self.nativeView.becomeFirstResponder() {
        callback([LynxUIMethodConstants.success])
      } else {
        callback([LynxUIMethodConstants.unknown, "Failed to focus"])
      }
    }
  }

  @objc
  func blur(_ params: [String: Any], callback: @escaping LynxCallback) {
    DispatchQueue.main.async {
      self.nativeView.resignFirstResponder()
      callback([LynxUIMethodConstants.success])
    }
  }

  @objc
  func getValue(_ params: [String: Any], callback: @escaping LynxCallback) {
    callback([LynxUIMethodConstants.success, nativeView.text ?? ""])
  }

  private func emitEvent(name: String, detail: [String: Any]) {
    let event = LynxCustomEvent(target: self, name: name, detail: detail)
    lynxContext.eventEmitter.emit(event)
  }
}

// UITextField delegate
extension LynxExplorerInput: UITextFieldDelegate {
  func textFieldShouldReturn(_ textField: UITextField) -> Bool {
    textField.resignFirstResponder()
    return true
  }
}
```

### Step 4: Advanced Custom Elements

#### Media Player Element

```kotlin
// MediaPlayerElement.kt
class LynxMediaPlayer(context: LynxContext) : LynxUI<VideoView>(context) {

  private var mediaController: MediaController? = null
  private var currentUrl: String? = null

  override fun createView(context: Context): VideoView {
    return VideoView(context).apply {
      mediaController = MediaController(context)
      setMediaController(mediaController)

      setOnPreparedListener { mediaPlayer ->
        emitEvent("prepared", mapOf(
          "duration" to mediaPlayer.duration,
          "width" to mediaPlayer.videoWidth,
          "height" to mediaPlayer.videoHeight
        ))
      }

      setOnCompletionListener {
        emitEvent("ended", emptyMap())
      }

      setOnErrorListener { _, what, extra ->
        emitEvent("error", mapOf(
          "what" to what,
          "extra" to extra
        ))
        true
      }
    }
  }

  @LynxProp(name = "src")
  fun setSrc(url: String) {
    if (url != currentUrl) {
      currentUrl = url
      val uri = Uri.parse(url)
      mView.setVideoURI(uri)
    }
  }

  @LynxProp(name = "autoplay")
  fun setAutoplay(autoplay: Boolean) {
    if (autoplay && currentUrl != null) {
      mView.start()
    }
  }

  @LynxUIMethod
  fun play(params: ReadableMap, callback: Callback) {
    mView.start()
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  @LynxUIMethod
  fun pause(params: ReadableMap, callback: Callback) {
    mView.pause()
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  @LynxUIMethod
  fun seekTo(params: ReadableMap, callback: Callback) {
    val position = params.getInt("position")
    mView.seekTo(position)
    callback.invoke(LynxUIMethodConstants.SUCCESS)
  }

  @LynxUIMethod
  fun getCurrentPosition(params: ReadableMap, callback: Callback) {
    callback.invoke(LynxUIMethodConstants.SUCCESS, mView.currentPosition)
  }
}
```

#### Chart View Element

```kotlin
// ChartViewElement.kt
class LynxChartView(context: LynxContext) : LynxUI<LineChart>(context) {

  override fun createView(context: Context): LineChart {
    return LineChart(context).apply {
      description.isEnabled = false
      setTouchEnabled(true)
      setDragEnabled(true)
      setScaleEnabled(true)
      setPinchZoom(true)

      setOnChartValueSelectedListener(object : OnChartValueSelectedListener {
        override fun onValueSelected(e: Entry?, h: Highlight?) {
          e?.let { entry ->
            emitEvent("pointSelect", mapOf(
              "x" to entry.x,
              "y" to entry.y,
              "index" to h?.x?.toInt() ?: 0
            ))
          }
        }

        override fun onNothingSelected() {
          emitEvent("pointDeselect", emptyMap())
        }
      })
    }
  }

  @LynxProp(name = "data")
  fun setData(dataArray: ReadableArray) {
    val entries = mutableListOf<Entry>()

    for (i in 0 until dataArray.size()) {
      val item = dataArray.getMap(i)
      val x = item.getDouble("x").toFloat()
      val y = item.getDouble("y").toFloat()
      entries.add(Entry(x, y))
    }

    val dataSet = LineDataSet(entries, "Chart Data")
    dataSet.color = Color.BLUE
    dataSet.setCircleColor(Color.BLUE)
    dataSet.lineWidth = 2f
    dataSet.circleRadius = 4f

    val lineData = LineData(dataSet)
    mView.data = lineData
    mView.invalidate()
  }

  @LynxProp(name = "animate")
  fun setAnimate(animate: Boolean) {
    if (animate) {
      mView.animateX(1000)
    }
  }

  @LynxUIMethod
  fun exportChart(params: ReadableMap, callback: Callback) {
    val format = params.getString("format") ?: "png"
    val quality = params.getInt("quality")

    try {
      val bitmap = mView.chartBitmap
      val file = saveChartToFile(bitmap, format, quality)
      callback.invoke(LynxUIMethodConstants.SUCCESS, file.absolutePath)
    } catch (e: Exception) {
      callback.invoke(LynxUIMethodConstants.UNKNOWN, e.message)
    }
  }

  private fun saveChartToFile(bitmap: Bitmap, format: String, quality: Int): File {
    val file = File(lynxContext.cacheDir, "chart_${System.currentTimeMillis()}.$format")
    val outputStream = FileOutputStream(file)

    val compressFormat = when (format.lowercase()) {
      "jpg", "jpeg" -> Bitmap.CompressFormat.JPEG
      else -> Bitmap.CompressFormat.PNG
    }

    bitmap.compress(compressFormat, quality, outputStream)
    outputStream.close()

    return file
  }
}
```

## Element Usage in JavaScript

### Basic Usage

```tsx
// App.tsx
import { useState } from '@lynx-js/react';

export function App() {
  const [inputValue, setInputValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleInput = (e) => {
    setInputValue(e.detail.value);
  };

  const handleFocus = () => {
    console.log('Input focused');
  };

  const requestFocus = () => {
    lynx
      .createSelectorQuery()
      .select('#my-input')
      .invoke({
        method: 'focus',
        params: {},
        success: () => console.log('Focus successful'),
        fail: (error) => console.log('Focus failed:', error),
      })
      .exec();
  };

  const playVideo = () => {
    lynx
      .createSelectorQuery()
      .select('#video-player')
      .invoke({
        method: 'play',
        params: {},
        success: () => setIsPlaying(true),
      })
      .exec();
  };

  return (
    <view style={{ padding: '20px' }}>
      <explorer-input
        id="my-input"
        value={inputValue}
        placeholder="Enter text here"
        maxLength={100}
        type="text"
        bindinput={handleInput}
        bindfocus={handleFocus}
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '5px',
        }}
      />

      <view style={{ marginTop: '20px' }}>
        <view
          bindtap={requestFocus}
          style={{ padding: '10px', backgroundColor: '#007AFF' }}
        >
          <text style={{ color: 'white' }}>Focus Input</text>
        </view>
      </view>

      <media-player
        id="video-player"
        src="https://example.com/video.mp4"
        autoplay={false}
        style={{
          width: '100%',
          height: '200px',
          marginTop: '20px',
        }}
        bindprepared={(e) => console.log('Video prepared:', e.detail)}
        bindended={() => setIsPlaying(false)}
      />

      <view
        bindtap={playVideo}
        style={{ padding: '10px', backgroundColor: '#34C759' }}
      >
        <text style={{ color: 'white' }}>
          {isPlaying ? 'Playing...' : 'Play Video'}
        </text>
      </view>
    </view>
  );
}
```

### Advanced Usage with Charts

```tsx
import { useState, useEffect } from '@lynx-js/react';

export function ChartDemo() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Generate sample data
    const data = Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: Math.random() * 100,
    }));
    setChartData(data);
  }, []);

  const exportChart = () => {
    lynx
      .createSelectorQuery()
      .select('#chart')
      .invoke({
        method: 'exportChart',
        params: { format: 'png', quality: 90 },
        success: (result) => {
          console.log('Chart exported to:', result);
        },
      })
      .exec();
  };

  const handlePointSelect = (e) => {
    console.log('Point selected:', e.detail);
  };

  return (
    <view style={{ padding: '20px' }}>
      <chart-view
        id="chart"
        data={chartData}
        animate={true}
        bindpointSelect={handlePointSelect}
        style={{
          width: '100%',
          height: '300px',
          border: '1px solid #eee',
        }}
      />

      <view
        bindtap={exportChart}
        style={{ padding: '10px', backgroundColor: '#FF9500' }}
      >
        <text style={{ color: 'white' }}>Export Chart</text>
      </view>
    </view>
  );
}
```

## Best Practices

### 1. Property Synchronization

Always ensure proper synchronization between JavaScript properties and native view state:

```kotlin
@LynxProp(name = "value")
fun setValue(value: String) {
  // Prevent infinite loops
  if (value != mView.text.toString()) {
    isUpdating = true
    mView.setText(value)
    isUpdating = false
  }
}
```

### 2. Event Throttling

For high-frequency events, implement throttling to improve performance:

```kotlin
private var lastEventTime = 0L
private val eventThrottleMs = 16L // ~60fps

private fun emitThrottledEvent(name: String, detail: Map<String, Any>) {
  val currentTime = System.currentTimeMillis()
  if (currentTime - lastEventTime >= eventThrottleMs) {
    emitEvent(name, detail)
    lastEventTime = currentTime
  }
}
```

### 3. Resource Cleanup

Properly clean up resources in custom elements:

```kotlin
override fun onDestroy() {
  super.onDestroy()
  // Clean up listeners, timers, etc.
  mediaPlayer?.release()
  animationTimer?.cancel()
}
```

### 4. Accessibility Support

Include accessibility features in custom elements:

```kotlin
override fun createView(context: Context): View {
  return CustomView(context).apply {
    contentDescription = "Custom input field"
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
  }
}

@LynxProp(name = "accessibilityLabel")
fun setAccessibilityLabel(label: String) {
  mView.contentDescription = label
}
```

### 5. Performance Optimization

Optimize for performance, especially in scrollable lists:

```kotlin
// Implement view recycling for list items
override fun onRecycle() {
  // Reset view state for reuse
  mView.text = ""
  mView.clearFocus()
}

// Use efficient layout algorithms
override fun onLayoutUpdated() {
  // Only update layout when necessary
  if (hasLayoutChanged()) {
    super.onLayoutUpdated()
    updateViewLayout()
  }
}
```

## Testing Custom Elements

### Unit Testing

```kotlin
@RunWith(AndroidJUnit4::class)
class LynxExplorerInputTest {

  @Test
  fun testValueProperty() {
    val context = mock(LynxContext::class.java)
    val element = LynxExplorerInput(context)

    element.setValue("test value")
    assertEquals("test value", element.mView.text.toString())
  }

  @Test
  fun testInputEvent() {
    val context = mock(LynxContext::class.java)
    val element = LynxExplorerInput(context)

    // Simulate text change
    element.mView.setText("new text")

    // Verify event was emitted
    verify(context.eventEmitter).sendCustomEvent(any())
  }
}
```

### Integration Testing

```typescript
describe('Custom Elements', () => {
  it('should handle property updates', async () => {
    const { getByTestId } = render(
      <explorer-input testID="input" value="initial" bindinput={handleInput} />
    );

    const input = getByTestId('input');
    expect(input.props.value).toBe('initial');

    // Update property
    input.setNativeProps({ value: 'updated' });
    expect(input.props.value).toBe('updated');
  });
});
```

Custom elements provide a powerful mechanism for extending LynxJS with native functionality while maintaining the declarative development model. They enable developers to build rich, interactive applications that fully leverage platform-specific capabilities.
