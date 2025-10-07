import { useState } from '@lynx-js/react';

export function ButtonDemo() {
  const [pressCount, setPressCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [pressedStates, setPressedStates] = useState<Record<string, boolean>>(
    {},
  );

  const handlePress = (buttonId: string) => {
    setPressCount((prev) => prev + 1);
    console.log(`Button ${buttonId} pressed! Total presses: ${pressCount + 1}`);
  };

  const handleLongPress = (buttonId: string) => {
    setLongPressCount((prev) => prev + 1);
    console.log(
      `Button ${buttonId} long pressed! Total long presses: ${longPressCount + 1}`,
    );
  };

  const handlePressIn = (buttonId: string) => {
    setPressedStates((prev) => ({ ...prev, [buttonId]: true }));
  };

  const handlePressOut = (buttonId: string) => {
    setPressedStates((prev) => ({ ...prev, [buttonId]: false }));
  };

  const resetCounters = () => {
    setPressCount(0);
    setLongPressCount(0);
  };

  const toggleDisabled = () => {
    setIsDisabled((prev) => !prev);
  };

  return (
    <view
      style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <text
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#333',
        }}
      >
        Custom Button Demo
      </text>

      {/* Stats */}
      <view
        style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <text style={{ fontSize: '16px', marginBottom: '8px' }}>
          Press Count: {pressCount}
        </text>
        <text style={{ fontSize: '16px', marginBottom: '16px' }}>
          Long Press Count: {longPressCount}
        </text>

        <view style={{ flexDirection: 'row', gap: '10px' }}>
          <button
            text="Reset Counters"
            bindpress={resetCounters}
            style={{
              backgroundColor: '#FF5722',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              height: '32px',
            }}
          />

          <button
            text={isDisabled ? 'Enable Buttons' : 'Disable Buttons'}
            bindpress={toggleDisabled}
            style={{
              backgroundColor: '#FF9800',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              height: '32px',
            }}
          />
        </view>
      </view>

      {/* Basic Button */}
      <view style={{ marginBottom: '20px' }}>
        <text
          style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          1. Basic Button
        </text>

        <button
          id="basic-button"
          text="Basic Button"
          disabled={isDisabled}
          bindpress={() => handlePress('basic')}
          bindlongPress={() => handleLongPress('basic')}
          style={{
            backgroundColor: '#1976D2',
            color: '#ffffff',
            padding: '12px 24px',
            // borderRadius: '8px',
            // fontSize: '16px',
            // fontWeight: 'bold',
          }}
          accessibility-element={true}
          accessibility-label="Basic button for simple interactions"
          accessibility-trait="button"
        />
      </view>

      {/* Material Design Button with Ripple */}
      <view style={{ marginBottom: '20px' }}>
        <text
          style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          2. Material Design with Custom Ripple
        </text>

        <button
          id="material-button"
          disabled={isDisabled}
          rippleColor="#E91E63"
          rippleBorderless={false}
          rippleRadius={30}
          rippleForeground={false}
          bindpress={() => handlePress('material')}
          bindlongPress={() => handleLongPress('material')}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '24px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          <text>Material buttonsss</text>
        </button>
      </view>

      {/* Interactive Button with State Feedback */}
      <view style={{ marginBottom: '20px' }}>
        <text
          style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          3. Interactive Button with State Feedback
        </text>

        <button
          id="interactive-button"
          disabled={isDisabled}
          delayLongPress={1000}
          unstablePressDelay={100}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
          pressRetentionOffset={15}
          bindpress={() => handlePress('interactive')}
          bindlongPress={() => handleLongPress('interactive')}
          bindpressIn={() => handlePressIn('interactive')}
          bindpressOut={() => handlePressOut('interactive')}
          bindhoverIn={() => console.log('Hover started on interactive button')}
          bindhoverOut={() => console.log('Hover ended on interactive button')}
          style={{
            backgroundColor: pressedStates['interactive']
              ? '#4CAF50'
              : '#8BC34A',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '120px',
            fontSize: '16px',
            fontWeight: 'bold',
            transform: pressedStates['interactive']
              ? 'scale(0.95)'
              : 'scale(1)',
            transition: 'all 0.1s ease',
          }}
        >
          <text
            style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}
          >
            {pressedStates['interactive']
              ? 'Pressing...'
              : 'Interactive Button'}
          </text>
        </button>
      </view>

      {/* Button with Dynamic Content */}
      <view style={{ marginBottom: '20px' }}>
        <text
          style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          4. Button with Children Function
        </text>

        <button
          id="dynamic-button"
          disabled={isDisabled}
          bindpress={() => handlePress('dynamic')}
          bindlongPress={() => handleLongPress('dynamic')}
          bindpressIn={() => handlePressIn('dynamic')}
          bindpressOut={() => handlePressOut('dynamic')}
          style={{
            backgroundColor: '#9C27B0',
            padding: '16px 24px',
            borderRadius: '8px',
            minWidth: '200px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {({ pressed }) => (
            <view
              style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}
            >
              <text
                style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: pressed ? 'bold' : 'normal',
                }}
              >
                {pressed ? '🔥 Pressed!' : '👆 Press Me'}
              </text>
            </view>
          )}
        </button>
      </view>

      {/* Accessibility-focused Button */}
      <view style={{ marginBottom: '20px' }}>
        <text
          style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          5. Accessibility-focused Button
        </text>

        <button
          id="a11y-button"
          text="Accessible Button"
          disabled={isDisabled}
          bindpress={() => handlePress('a11y')}
          bindlongPress={() => handleLongPress('a11y')}
          style={{
            backgroundColor: '#607D8B',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            minHeight: '48px', // WCAG minimum touch target size
          }}
          accessibility-element={true}
          accessibility-label="Accessible button designed for screen readers and assistive technologies"
          accessibility-trait="button"
          hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
        />
      </view>

      {/* Silent Button (No Sound) */}
      <view style={{ marginBottom: '20px' }}>
        <text
          style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          6. Silent Button (No Android Sound)
        </text>

        <button
          id="silent-button"
          text="Silent Button"
          disabled={isDisabled}
          androidDisableSound={true}
          bindpress={() => handlePress('silent')}
          bindlongPress={() => handleLongPress('silent')}
          style={{
            backgroundColor: '#795548',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
          }}
        />
      </view>

      {/* API Test Buttons */}
      <view style={{ marginBottom: '20px' }}>
        <text
          style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}
        >
          7. API Test Buttons
        </text>

        <view style={{ flexDirection: 'row', gap: '10px', flexWrap: 'wrap' }}>
          <button
            text="Focus Basic"
            bindpress={() => {
              lynx
                .createSelectorQuery()
                .select('#basic-button')
                .invoke({
                  method: 'focus',
                  params: {},
                  success: (res) => console.log('Focus success:', res),
                  fail: (error) => console.log('Focus failed:', error),
                })
                .exec();
            }}
            style={{
              backgroundColor: '#00BCD4',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />

          <button
            text="Measure Interactive"
            bindpress={() => {
              lynx
                .createSelectorQuery()
                .select('#interactive-button')
                .invoke({
                  method: 'measure',
                  params: {},
                  success: (res) => {
                    console.log('Button measurements:', res);
                    alert(
                      `Size: ${res.width}x${res.height}, Position: (${res.x}, ${res.y})`,
                    );
                  },
                  fail: (error) => console.log('Measure failed:', error),
                })
                .exec();
            }}
            style={{
              backgroundColor: '#FFC107',
              color: 'black',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />

          <button
            text="Blur All"
            bindpress={() => {
              const buttonIds = [
                'basic-button',
                'material-button',
                'interactive-button',
                'dynamic-button',
                'a11y-button',
                'silent-button',
              ];
              buttonIds.forEach((id) => {
                lynx
                  .createSelectorQuery()
                  .select(`#${id}`)
                  .invoke({
                    method: 'blur',
                    params: {},
                    success: () => console.log(`Blurred ${id}`),
                    fail: (error) =>
                      console.log(`Blur failed for ${id}:`, error),
                  })
                  .exec();
              });
            }}
            style={{
              backgroundColor: '#E91E63',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </view>
      </view>

      {/* Footer */}
      <view
        style={{
          marginTop: '40px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
        }}
      >
        <text
          style={{
            fontSize: '14px',
            color: '#666',
            textAlign: 'center',
            lineHeight: '20px',
          }}
        >
          Custom LynxJS Button Component Demo{'\n'}
          Featuring Material Design, Accessibility, and React Native
          Pressable-like functionality
        </text>
      </view>
    </view>
  );
}
