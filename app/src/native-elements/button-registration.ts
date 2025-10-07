/**
 * Button Element Registration Helper
 *
 * This file provides utilities to register the custom button element
 * in your LynxJS application.
 */

import { useState, useCallback } from '@lynx-js/react';

// Android Registration Code (Java)
// Add this to your MainActivity or Application class:

/*
// Global Registration - Available across all LynxView instances
import com.lynx.tasm.LynxEnv;
import com.lynx.tasm.behavior.Behavior;
import com.hextok.lynx.custom.LynxButton;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the button element globally
        LynxEnv.inst().addBehavior(new Behavior("button") {
            @Override
            public LynxButton createUI(LynxContext context) {
                return new LynxButton(context);
            }
        });
        
        // ... rest of your activity setup
    }
}

// OR Local Registration - Available only for specific LynxView instance
import com.lynx.tasm.LynxViewBuilder;
import com.lynx.tasm.behavior.Behavior;
import com.hextok.lynx.custom.LynxButton;

public void setupLynxView() {
    LynxViewBuilder lynxViewBuilder = new LynxViewBuilder();
    
    // Register the button element for this view only
    lynxViewBuilder.addBehavior(new Behavior("button") {
        @Override
        public LynxButton createUI(LynxContext context) {
            return new LynxButton(context);
        }
    });
    
    LynxView lynxView = lynxViewBuilder.build(this);
    // ... continue with lynxView setup
}
*/

// TypeScript/JavaScript Usage Examples:

export const ButtonRegistrationGuide = {
  // Basic usage
  basic: `
<button 
  text="Click me!"
  bindpress={(e) => console.log('Button pressed!')}
  style="background-color: #1976D2; color: white; padding: 12px 24px; border-radius: 8px;"
/>
  `,

  // Advanced usage with all features
  advanced: `
<button
  id="my-button"
  text="Advanced Button"
  disabled={false}
  delayLongPress={800}
  unstablePressDelay={50}
  androidDisableSound={false}
  
  // Ripple effect customization
  rippleColor="#FF5722"
  rippleBorderless={false}
  rippleRadius={24}
  rippleForeground={false}
  
  // Hit testing
  hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
  pressRetentionOffset={20}
  
  // Event handlers
  bindpress={(e) => {
    console.log('Pressed at:', e.detail.locationX, e.detail.locationY);
  }}
  
  bindpressIn={(e) => {
    console.log('Press started');
  }}
  
  bindpressOut={(e) => {
    console.log('Press ended');
  }}
  
  bindlongPress={(e) => {
    console.log('Long press detected');
  }}
  
  bindhoverIn={(e) => {
    console.log('Hover started');
  }}
  
  bindhoverOut={(e) => {
    console.log('Hover ended');
  }}
  
  // Accessibility
  accessibility-element={true}
  accessibility-label="Advanced button for complex actions"
  accessibility-trait="button"
  
  style={{
    backgroundColor: '#1976D2',
    color: 'white',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold'
  }}
/>
  `,

  // Dynamic content with children function
  withChildrenFunction: `
<button
  bindpress={(e) => console.log('Dynamic button pressed')}
  style="padding: 16px; border-radius: 8px;"
>
  {({ pressed }) => (
    <text style={{
      color: pressed ? '#fff' : '#1976D2',
      fontWeight: 'bold'
    }}>
      {pressed ? 'Pressing...' : 'Press Me'}
    </text>
  )}
</button>
  `,

  // Imperative API usage
  imperativeAPI: `
// Focus the button
lynx
  .createSelectorQuery()
  .select('#my-button')
  .invoke({
    method: 'focus',
    params: {},
    success: (res) => console.log('Button focused'),
    fail: (error) => console.log('Focus failed:', error)
  })
  .exec();

// Blur the button
lynx
  .createSelectorQuery()
  .select('#my-button')
  .invoke({
    method: 'blur',
    params: {},
    success: (res) => console.log('Button blurred'),
    fail: (error) => console.log('Blur failed:', error)
  })
  .exec();

// Measure button dimensions
lynx
  .createSelectorQuery()
  .select('#my-button')
  .invoke({
    method: 'measure',
    params: {},
    success: (res) => {
      console.log('Button dimensions:', res.width, res.height);
      console.log('Button position:', res.x, res.y);
    },
    fail: (error) => console.log('Measure failed:', error)
  })
  .exec();
  `,
};

// React Hook for Button State Management
export function useButtonState(initialPressed = false) {
  const [pressed, setPressed] = useState(initialPressed);
  const [hovered, setHovered] = useState(false);

  const handlePressIn = useCallback(() => {
    setPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setPressed(false);
  }, []);

  const handleHoverIn = useCallback(() => {
    setHovered(true);
  }, []);

  const handleHoverOut = useCallback(() => {
    setHovered(false);
  }, []);

  return {
    pressed,
    hovered,
    handlers: {
      bindpressIn: handlePressIn,
      bindpressOut: handlePressOut,
      bindhoverIn: handleHoverIn,
      bindhoverOut: handleHoverOut,
    },
  };
}

export default ButtonRegistrationGuide;
