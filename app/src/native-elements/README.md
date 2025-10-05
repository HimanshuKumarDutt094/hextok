Usage

Import the React-friendly wrappers:

```tsx
import {
  ExplorerInput,
  MediaPlayer,
  ChartView,
} from './native-elements/custom-elements';

export function Example() {
  return (
    <view>
      <ExplorerInput
        id="my-input"
        placeholder="Type"
        onInput={(e) => console.log(e.detail.value)}
      />
      <MediaPlayer id="video-player" src="https://example.com/video.mp4" />
      <ChartView id="chart" data={[{ x: 1, y: 2 }]} />
    </view>
  );
}
```

Notes:

- The Android implementations are minimal placeholders for demonstration. The chart element is a light placeholder and should be replaced with a proper chart library integration when needed.
- On Android the behaviors are registered in `MainApplication.kt` under `com.app` package.
