import { useCallback, useEffect, useState } from '@lynx-js/react';
import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
} from '@lynx-js/react';
import type { MainThread } from '@lynx-js/types';
import './tiktok-feed.css';
import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
};

const TiktokFeed: React.FC<Props> = ({
  children,
  className = '',
  initialIndex = 0,
  onIndexChange,
}) => {
  const [index, setIndex] = useState<number>(initialIndex);
  const childrenArr = React.Children.toArray(children);
  // main-thread ref to the track element so main-thread handlers can manipulate styles
  const trackRef = useMainThreadRef<MainThread.Element | null>(null);

  useEffect(() => {
    // keep external callback in background thread
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  // Use main-thread functions and main-thread ref for low-latency touch handling.
  const mtTouchStartY = useMainThreadRef<number>(0);

  // Background function to change index by ±1
  const changeIndexBy = (dir: number) => {
    setIndex((i) => {
      const next = Math.min(Math.max(i + dir, 0), childrenArr.length - 1);
      return next;
    });
  };

  // Main-thread function to set the track transform/transition to a specific index
  const setTrackToIndex = useCallback(
    (idx: number) => {
      'main thread';
      const el = trackRef.current;
      if (!el) return;
      // Use style properties directly on the main thread element for low-latency
      el.setStyleProperty('transition', 'transform 300ms ease');
      el.setStyleProperty('transform', `translateY(${-idx * 100}vh)`);
    },
    [trackRef],
  );

  // Main-thread touch handlers
  type MTTouch = {
    touches: Array<{ clientY: number }>;
    changedTouches?: Array<{ clientY: number }>;
  };

  function handleTouchStartMT(e: MTTouch) {
    'main thread';
    mtTouchStartY.current = e.touches[0].clientY;
    const el = trackRef.current;
    el?.setStyleProperty('transition', 'none');
  }

  function handleTouchMoveMT(e: MTTouch) {
    'main thread';
    const delta = e.touches[0].clientY - mtTouchStartY.current;
    // If we're at the first index, prevent pulling down (positive delta)
    if (index === 0 && delta > 0) {
      // keep the track at the top; optionally provide a small resistance effect
      const resistance = Math.min(delta / 3, 80); // mild resistance cap
      const el = trackRef.current;
      el?.setStyleProperty(
        'transform',
        `translateY(calc(${-index * 100}vh + ${resistance}px))`,
      );
      return;
    }
    const el = trackRef.current;
    el?.setStyleProperty(
      'transform',
      `translateY(calc(${-index * 100}vh + ${delta}px))`,
    );
  }

  function handleTouchEndMT(e: MTTouch) {
    'main thread';
    const touch =
      (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    const endY = touch ? touch.clientY : mtTouchStartY.current;
    const delta = endY - mtTouchStartY.current;
    const threshold = 60;
    if (Math.abs(delta) > threshold) {
      const dir = delta < 0 ? 1 : -1;
      // Prevent decrementing when at the first page and pulling down
      if (index === 0 && dir === -1) {
        // snap back to current index
        setTrackToIndex(index);
        return;
      }
      // changeIndexBy is a background function; call it from main thread via runOnBackground
      runOnBackground(changeIndexBy)(dir);
    } else {
      // snap back
      // We're already on the main thread here, so call the main-thread function directly
      setTrackToIndex(index);
    }
  }

  // Keyboard support removed for Android ReactLynx

  useEffect(() => {
    // ensure track is in correct position on mount and whenever index changes
    // setTrackToIndex is a main-thread function; use runOnMainThread from the background
    // to schedule the main-thread update. Effects run on the background thread, so
    // calling runOnMainThread here is the correct cross-thread invocation.
    runOnMainThread(setTrackToIndex)(index);
  }, [index, setTrackToIndex]);

  return (
    <view className={`tiktok-feed ${className}`}>
      <view
        className="tiktok-track"
        main-thread:ref={trackRef}
        main-thread:bindtouchstart={handleTouchStartMT}
        main-thread:bindtouchmove={handleTouchMoveMT}
        main-thread:bindtouchend={handleTouchEndMT}
        style={{ transform: `translateY(${-index * 100}vh)` }}
      >
        {childrenArr.map((child, i) => (
          <view className="tiktok-page" key={i}>
            <view className="tiktok-page-inner">{child}</view>
          </view>
        ))}
      </view>
    </view>
  );
};

export default TiktokFeed;
