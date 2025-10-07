package com.hextok.custom;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.TypedValue;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import com.lynx.react.bridge.Callback;
import com.lynx.react.bridge.ReadableMap;
import com.lynx.tasm.behavior.LynxContext;
import com.lynx.tasm.behavior.LynxProp;
import com.lynx.tasm.behavior.LynxUIMethod;
import com.lynx.tasm.behavior.LynxUIMethodConstants;
import com.lynx.tasm.behavior.ui.UIGroup;
import com.lynx.tasm.behavior.ui.LynxBaseUI;
import com.lynx.tasm.event.LynxCustomEvent;

import java.util.HashMap;
import java.util.Map;

/**
 * Custom LynxJS Button Component
 * 
 * A comprehensive button implementation that supports:
 * - Text rendering and child elements
 * - All press events (press, pressIn, pressOut, longPress, pressMove)
 * - Hover events for supported devices
 * - Material Design ripple effects
 * - Hit testing customization
 * - Accessibility features
 * - Focus/blur methods
 */
public class LynxButton extends UIGroup<FrameLayout> {

    // Core state
    private Handler longPressHandler = new Handler(Looper.getMainLooper());
    private Handler pressDelayHandler = new Handler(Looper.getMainLooper());
    private Runnable longPressRunnable;
    private Runnable pressDelayRunnable;
    private boolean isPressed = false;
    private boolean isDisabled = false;
    private boolean isHovered = false;
    private boolean testOnlyPressed = false;

    // Behavior properties
    private boolean androidDisableSound = false;
    private long delayLongPress = 500;
    private long unstablePressDelay = 0;

    // Ripple effect properties
    private int rippleColor = Color.parseColor("#DDDDDD");
    private boolean rippleBorderless = false;
    private int rippleRadius = -1; // -1 means use default
    private boolean rippleForeground = false;

    // Hit testing properties
    private Rect hitSlop = null;
    private int pressRetentionOffset = 0;

    // Text content
    private String buttonText = null;
    private TextView textView = null;
    // Text style properties
    private Integer textColor = null;
    private float fontSizeSp = -1f;
    private boolean fontBold = false;
    private int textGravity = Gravity.CENTER;

    // Accessibility properties
    private boolean accessibilityElement = true;
    private String accessibilityLabel = null;
    private String accessibilityTrait = "button";

    // Touch tracking
    private float lastTouchX = 0;
    private float lastTouchY = 0;
    private long lastTouchTime = 0;

    public LynxButton(LynxContext context) {
        super(context);
    }

    @Override
    @NonNull
    protected FrameLayout createView(@NonNull Context context) {
        FrameLayout view = new FrameLayout(context);
        view.setClickable(true);
        view.setFocusable(true);
        view.setFocusableInTouchMode(true);

        // Set up accessibility
        setupAccessibility(view);

        // Apply default styling and ripple effect
        setupRippleEffect(view);

        // Set up comprehensive touch handling
        view.setOnTouchListener(this::handleTouch);

        // Set up hover handling for supported devices
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
            view.setOnHoverListener(this::handleHover);
        }

        return view;
    }

    private void setupAccessibility(FrameLayout view) {
        view.setImportantForAccessibility(accessibilityElement ? 
            View.IMPORTANT_FOR_ACCESSIBILITY_YES : View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        if (accessibilityLabel != null) {
            view.setContentDescription(accessibilityLabel);
        }
    }

    private boolean handleTouch(View v, MotionEvent event) {
        if (isDisabled || testOnlyPressed) {
            return false;
        }

        // Store touch coordinates and time
        lastTouchX = event.getX();
        lastTouchY = event.getY();
        lastTouchTime = System.currentTimeMillis();

        // Check hit slop for extended touch area
        if (hitSlop != null && !isWithinHitSlop(event, v)) {
            return false;
        }

        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                handlePressIn(event);
                return true;
            case MotionEvent.ACTION_MOVE:
                handlePressMove(event);
                // Check if we're still within the press retention area
                if (!isWithinPressRetentionArea(event, v)) {
                    handlePressOut(event);
                    return false;
                }
                return true;
            case MotionEvent.ACTION_UP:
                handlePressOut(event);
                // Check if the UP event is within the view bounds for a click
                if (isWithinViewBounds(event, v)) {
                    handlePress(event);
                }
                return true;
            case MotionEvent.ACTION_CANCEL:
                handlePressOut(event);
                return true;
        }
        return false;
    }

    private boolean handleHover(View v, MotionEvent event) {
        if (isDisabled) {
            return false;
        }

        switch (event.getAction()) {
            case MotionEvent.ACTION_HOVER_ENTER:
                handleHoverIn(event);
                return true;
            case MotionEvent.ACTION_HOVER_EXIT:
                handleHoverOut(event);
                return true;
        }
        return false;
    }

    private boolean isWithinHitSlop(MotionEvent event, View view) {
        if (hitSlop == null) return true;
        
        float x = event.getX();
        float y = event.getY();
        
        return x >= -hitSlop.left && 
               x <= view.getWidth() + hitSlop.right &&
               y >= -hitSlop.top && 
               y <= view.getHeight() + hitSlop.bottom;
    }

    private boolean isWithinPressRetentionArea(MotionEvent event, View view) {
        float x = event.getX();
        float y = event.getY();
        
        return x >= -pressRetentionOffset && 
               x <= view.getWidth() + pressRetentionOffset &&
               y >= -pressRetentionOffset && 
               y <= view.getHeight() + pressRetentionOffset;
    }

    private boolean isWithinViewBounds(MotionEvent event, View view) {
        float x = event.getX();
        float y = event.getY();
        
        return x >= 0 && x <= view.getWidth() && y >= 0 && y <= view.getHeight();
    }

    private void setupRippleEffect(FrameLayout view) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            ColorStateList rippleColorStateList = ColorStateList.valueOf(rippleColor);
            RippleDrawable rippleDrawable;
            
            if (rippleBorderless) {
                rippleDrawable = new RippleDrawable(rippleColorStateList, null, null);
            } else {
                // Create a mask for bounded ripple
                StateListDrawable mask = new StateListDrawable();
                rippleDrawable = new RippleDrawable(rippleColorStateList, null, mask);
            }
            
            if (rippleForeground) {
                view.setForeground(rippleDrawable);
            } else {
                view.setBackground(rippleDrawable);
            }
        } else {
            // Fallback for older Android versions
            TypedValue outValue = new TypedValue();
            int attribute = rippleBorderless ? 
                android.R.attr.selectableItemBackgroundBorderless : 
                android.R.attr.selectableItemBackground;
            view.getContext().getTheme().resolveAttribute(attribute, outValue, true);
            if (outValue.resourceId != 0) {
                view.setBackgroundResource(outValue.resourceId);
            }
        }
    }

    private void handlePressIn(MotionEvent event) {
        if (isPressed) return;
        
        isPressed = true;

        if (unstablePressDelay > 0) {
            cancelPressDelay();
            pressDelayRunnable = () -> {
                if (isPressed) {
                    emitPressInEvent(event);
                    scheduleLongPress(event);
                }
            };
            pressDelayHandler.postDelayed(pressDelayRunnable, unstablePressDelay);
        } else {
            emitPressInEvent(event);
            scheduleLongPress(event);
        }
    }

    private void handlePressOut(MotionEvent event) {
        if (!isPressed) return;
        
        isPressed = false;
        cancelLongPress();
        cancelPressDelay();
        emitPressOutEvent(event);
    }

    private void handlePress(MotionEvent event) {
        emitPressEvent(event);
        if (!androidDisableSound) {
            mView.playSoundEffect(android.view.SoundEffectConstants.CLICK);
        }
    }

    private void handlePressMove(MotionEvent event) {
        if (isPressed) {
            emitPressMoveEvent(event);
        }
    }

    private void handleHoverIn(MotionEvent event) {
        if (isHovered) return;
        
        isHovered = true;
        emitHoverInEvent(event);
    }

    private void handleHoverOut(MotionEvent event) {
        if (!isHovered) return;
        
        isHovered = false;
        emitHoverOutEvent(event);
    }

    private void scheduleLongPress(MotionEvent event) {
        cancelLongPress();
        longPressRunnable = () -> {
            if (isPressed) {
                emitLongPressEvent(event);
            }
        };
        longPressHandler.postDelayed(longPressRunnable, delayLongPress);
    }

    private void cancelLongPress() {
        if (longPressRunnable != null) {
            longPressHandler.removeCallbacks(longPressRunnable);
            longPressRunnable = null;
        }
    }

    private void cancelPressDelay() {
        if (pressDelayRunnable != null) {
            pressDelayHandler.removeCallbacks(pressDelayRunnable);
            pressDelayRunnable = null;
        }
    }

    // --- Event Emitters ---
    private void emitEvent(String eventName, MotionEvent event) {
        LynxCustomEvent customEvent = new LynxCustomEvent(getSign(), eventName);
        Map<String, Object> eventData = createEventData(event);
        if (eventData != null) {
            for (Map.Entry<String, Object> entry : eventData.entrySet()) {
                customEvent.addDetail(entry.getKey(), entry.getValue());
            }
        }
        getLynxContext().getEventEmitter().sendCustomEvent(customEvent);
    }

    private Map<String, Object> createEventData(MotionEvent event) {
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("pressed", isPressed);
        eventData.put("timestamp", lastTouchTime);
        
        if (event != null) {
            // Get screen coordinates
            int[] screenLocation = new int[2];
            mView.getLocationOnScreen(screenLocation);
            
            eventData.put("locationX", event.getX());
            eventData.put("locationY", event.getY());
            eventData.put("pageX", screenLocation[0] + event.getX());
            eventData.put("pageY", screenLocation[1] + event.getY());
        } else {
            // Fallback to last known touch coordinates
            eventData.put("locationX", lastTouchX);
            eventData.put("locationY", lastTouchY);
            eventData.put("pageX", lastTouchX);
            eventData.put("pageY", lastTouchY);
        }
        
        return eventData;
    }

    private void emitPressInEvent(MotionEvent event) { 
        emitEvent("pressIn", event); 
    }
    
    private void emitPressOutEvent(MotionEvent event) { 
        emitEvent("pressOut", event); 
    }
    
    private void emitPressEvent(MotionEvent event) { 
        emitEvent("press", event); 
    }
    
    private void emitLongPressEvent(MotionEvent event) { 
        emitEvent("longPress", event); 
    }
    
    private void emitPressMoveEvent(MotionEvent event) { 
        emitEvent("pressMove", event); 
    }
    
    private void emitHoverInEvent(MotionEvent event) { 
        emitEvent("hoverIn", event); 
    }
    
    private void emitHoverOutEvent(MotionEvent event) { 
        emitEvent("hoverOut", event); 
    }

    // --- Property Setters ---
    
    @LynxProp(name = "text")
    public void setText(String text) {
        this.buttonText = text;
        updateTextDisplay();
    }

    @LynxProp(name = "disabled")
    public void setDisabled(boolean disabled) {
        this.isDisabled = disabled;
        mView.setEnabled(!disabled);
        mView.setAlpha(disabled ? 0.5f : 1.0f);
        
        if (disabled && isPressed) {
            handlePressOut(null);
        }
    }

    @LynxProp(name = "androidDisableSound")
    public void setAndroidDisableSound(boolean disableSound) {
        this.androidDisableSound = disableSound;
    }

    @LynxProp(name = "delayLongPress")
    public void setDelayLongPress(int delay) {
        this.delayLongPress = Math.max(0, delay);
    }

    @LynxProp(name = "unstablePressDelay")
    public void setUnstablePressDelay(int delay) {
        this.unstablePressDelay = Math.max(0, delay);
    }

    @LynxProp(name = "testOnlyPressed")
    public void setTestOnlyPressed(boolean testPressed) {
        this.testOnlyPressed = testPressed;
    }

    // Ripple effect properties
    @LynxProp(name = "rippleColor")
    public void setRippleColor(String color) {
        try {
            this.rippleColor = Color.parseColor(color);
            setupRippleEffect(mView);
        } catch (IllegalArgumentException ignored) {
            // Invalid color, keep default
        }
    }

    @LynxProp(name = "rippleBorderless")
    public void setRippleBorderless(boolean borderless) {
        this.rippleBorderless = borderless;
        setupRippleEffect(mView);
    }

    @LynxProp(name = "rippleRadius")
    public void setRippleRadius(int radius) {
        this.rippleRadius = Math.max(-1, radius); // -1 means use default
        setupRippleEffect(mView);
    }

    @LynxProp(name = "rippleForeground")
    public void setRippleForeground(boolean foreground) {
        this.rippleForeground = foreground;
        setupRippleEffect(mView);
    }

    // Hit testing properties
    @LynxProp(name = "hitSlop")
    public void setHitSlop(ReadableMap hitSlopMap) {
        if (hitSlopMap == null) {
            this.hitSlop = null;
            return;
        }

        // Handle both number and object formats
        if (hitSlopMap.hasKey("top") || hitSlopMap.hasKey("left") || 
            hitSlopMap.hasKey("right") || hitSlopMap.hasKey("bottom")) {
            // Object format: { top: 10, left: 10, right: 10, bottom: 10 }
            int top = hitSlopMap.hasKey("top") ? (int) hitSlopMap.getDouble("top") : 0;
            int left = hitSlopMap.hasKey("left") ? (int) hitSlopMap.getDouble("left") : 0;
            int right = hitSlopMap.hasKey("right") ? (int) hitSlopMap.getDouble("right") : 0;
            int bottom = hitSlopMap.hasKey("bottom") ? (int) hitSlopMap.getDouble("bottom") : 0;
            this.hitSlop = new Rect(left, top, right, bottom);
        }
    }

    @LynxProp(name = "pressRetentionOffset")
    public void setPressRetentionOffset(ReadableMap offsetMap) {
        if (offsetMap == null) {
            this.pressRetentionOffset = 0;
            return;
        }

        // For simplicity, use the largest value if it's an object
        if (offsetMap.hasKey("top") || offsetMap.hasKey("left") || 
            offsetMap.hasKey("right") || offsetMap.hasKey("bottom")) {
            int top = offsetMap.hasKey("top") ? (int) offsetMap.getDouble("top") : 0;
            int left = offsetMap.hasKey("left") ? (int) offsetMap.getDouble("left") : 0;
            int right = offsetMap.hasKey("right") ? (int) offsetMap.getDouble("right") : 0;
            int bottom = offsetMap.hasKey("bottom") ? (int) offsetMap.getDouble("bottom") : 0;
            this.pressRetentionOffset = Math.max(Math.max(top, left), Math.max(right, bottom));
        }
    }

    // Alternative single-value setters for hit testing
    @LynxProp(name = "hitSlopValue")
    public void setHitSlopValue(int value) {
        this.hitSlop = new Rect(value, value, value, value);
    }

    @LynxProp(name = "pressRetentionOffsetValue")
    public void setPressRetentionOffsetValue(int value) {
        this.pressRetentionOffset = Math.max(0, value);
    }

    // Accessibility properties
    @LynxProp(name = "accessibility-element")
    public void setAccessibilityElement(boolean isElement) {
        this.accessibilityElement = isElement;
        setupAccessibility(mView);
    }

    @LynxProp(name = "accessibility-label")
    public void setAccessibilityLabel(String label) {
        this.accessibilityLabel = label;
        setupAccessibility(mView);
    }

    @LynxProp(name = "accessibility-trait")
    public void setAccessibilityTrait(String trait) {
        this.accessibilityTrait = trait;
        // Note: Android doesn't have direct equivalent to iOS traits,
        // but this is here for API compatibility
    }

    // --- Text style properties (from front-end props) ---
    @LynxProp(name = "textColor")
    public void setTextColor(String color) {
        try {
            this.textColor = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
            this.textColor = null;
        }
        applyTextStyles();
    }

    @LynxProp(name = "fontSize")
    public void setFontSize(int sizeSp) {
        this.fontSizeSp = sizeSp;
        applyTextStyles();
    }

    // Accept numeric values (double) from bridge
    @LynxProp(name = "fontSize")
    public void setFontSize(double size) {
        this.fontSizeSp = (float) size;
        applyTextStyles();
    }

    // Accept string values like "16px" or "16"
    @LynxProp(name = "fontSize")
    public void setFontSizeString(String sizeStr) {
        if (sizeStr == null) return;
        try {
            String s = sizeStr.trim();
            if (s.endsWith("px")) s = s.substring(0, s.length() - 2).trim();
            this.fontSizeSp = Float.parseFloat(s);
            applyTextStyles();
        } catch (NumberFormatException ex) {
            // ignore invalid
        }
    }

    @LynxProp(name = "fontWeight")
    public void setFontWeight(String weight) {
        if (weight == null) {
            this.fontBold = false;
        } else {
            // Treat numeric >=700 or "bold" as bold
            if (weight.equalsIgnoreCase("bold")) {
                this.fontBold = true;
            } else {
                try {
                    int w = Integer.parseInt(weight);
                    this.fontBold = w >= 700;
                } catch (NumberFormatException ex) {
                    this.fontBold = false;
                }
            }
        }
        applyTextStyles();
    }

    @LynxProp(name = "textAlign")
    public void setTextAlign(String align) {
        if (align == null) return;
        switch (align.toLowerCase()) {
            case "left":
                this.textGravity = Gravity.START | Gravity.CENTER_VERTICAL;
                break;
            case "right":
                this.textGravity = Gravity.END | Gravity.CENTER_VERTICAL;
                break;
            case "center":
            default:
                this.textGravity = Gravity.CENTER;
                break;
        }
        applyTextStyles();
    }

    // Alias for style.color -> map to internal text color
    @LynxProp(name = "color")
    public void setColorAlias(String color) {
        setTextColor(color);
    }

    // Child insertion/removal hooks: remove internal textView when children exist
    @Override
    public void onInsertChild(LynxBaseUI child, int index) {
        super.onInsertChild(child, index);
        updateTextDisplay();
        mView.requestLayout(); // Ensure the layout is updated
    }

    @Override
    public boolean onRemoveChild(LynxBaseUI child) {
        boolean res = super.onRemoveChild(child);
        if (getChildCount() == 0) {
            updateTextDisplay();
        }
        mView.requestLayout(); // Ensure the layout is updated
        return res;
    }

    // --- Text Display Management ---
    private void updateTextDisplay() {
        // If there are child elements, prefer rendering them instead of the auto text
        if (getChildCount() > 0) {
            // Remove internal text view if present
            if (textView != null && textView.getParent() == mView) {
                mView.removeView(textView);
            }
            return;
        }

        if (buttonText != null && !buttonText.isEmpty()) {
            if (textView == null) {
                createTextView();
            }
            applyTextStyles();
            textView.setText(buttonText);
            if (textView.getParent() != mView) {
                mView.addView(textView);
            }
        } else if (textView != null && textView.getParent() == mView) {
            mView.removeView(textView);
        }
    }

    private void createTextView() {
        textView = new TextView(mView.getContext());
        textView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
        ));
        // sensible defaults which can be overridden by Lynx props
        textView.setTextColor(Color.BLACK);
        textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        textView.setGravity(Gravity.CENTER);
        textView.setSingleLine(false);
        textView.setEllipsize(TextUtils.TruncateAt.END);
        textView.setClickable(false); // Don't intercept clicks
        textView.setFocusable(false);
    }

    private void applyTextStyles() {
        if (textView == null) return;

        if (textColor != null) {
            textView.setTextColor(textColor);
        }

        if (fontSizeSp > 0) {
            textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, fontSizeSp);
        }

        textView.setTypeface(null, fontBold ? Typeface.BOLD : Typeface.NORMAL);
        textView.setGravity(textGravity);
        
        // Ensure container has a minimum size based on text content so Lynx layout
        // (which may not know about this native child) will give it space.
        try {
            int widthSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
            int heightSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
            textView.measure(widthSpec, heightSpec);
            int measuredW = textView.getMeasuredWidth();
            int measuredH = textView.getMeasuredHeight();
            if (measuredW > 0) mView.setMinimumWidth(measuredW + mView.getPaddingLeft() + mView.getPaddingRight());
            if (measuredH > 0) mView.setMinimumHeight(measuredH + mView.getPaddingTop() + mView.getPaddingBottom());
            mView.requestLayout();
        } catch (Exception ignored) {}
    }

    // --- UI Methods ---
    @LynxUIMethod
    public void focus(ReadableMap params, Callback callback) {
        if (mView.requestFocus()) {
            callback.invoke(LynxUIMethodConstants.SUCCESS);
        } else {
            callback.invoke(LynxUIMethodConstants.UNKNOWN, "Failed to focus button");
        }
    }

    @LynxUIMethod
    public void blur(ReadableMap params, Callback callback) {
        mView.clearFocus();
        callback.invoke(LynxUIMethodConstants.SUCCESS);
    }

    @LynxUIMethod
    public void measure(ReadableMap params, Callback callback) {
        Map<String, Object> result = new HashMap<>();
        result.put("width", mView.getWidth());
        result.put("height", mView.getHeight());
        
        int[] location = new int[2];
        mView.getLocationOnScreen(location);
        result.put("x", location[0]);
        result.put("y", location[1]);
        
        callback.invoke(LynxUIMethodConstants.SUCCESS, result);
    }

    // --- Lifecycle Methods ---
    @Override
    public void destroy() {
        // cleanup timers
        cancelLongPress();
        cancelPressDelay();
        // remove text view
        if (textView != null && textView.getParent() == mView) {
            mView.removeView(textView);
            textView = null;
        }
        isPressed = false;
        isHovered = false;
        super.destroy();
    }

    @Override
    public void onAttach() {
        super.onAttach();
        updateTextDisplay();
    }
}
