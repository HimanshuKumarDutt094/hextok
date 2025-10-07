package com.hextok.nativeauth;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import com.lynx.jsbridge.LynxMethod;
import com.lynx.jsbridge.LynxModule;
import com.lynx.react.bridge.Callback;
import com.lynx.tasm.behavior.LynxContext;

import java.util.HashMap;
import java.util.Map;

public class NativeAuthModule extends LynxModule {

    private static final String MODULE_NAME = "NativeAuthModule";

    private static Callback pendingCallback = null;

    public NativeAuthModule(Context context) {
        super(context);
    }

    // Note: Lynx module naming is handled by the host registration call.
    // We avoid overriding methods that may not exist on LynxModule across versions.

    @LynxMethod
    public void openAuth(String url, Map options, Callback callback) {
        if (pendingCallback != null) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", "ALREADY_IN_PROGRESS");
            error.put("message", "An auth flow is already in progress");
            callback.invoke(error);
            return;
        }

        pendingCallback = callback;

        Activity act = null;
        // Try to resolve an Activity from mContext or LynxContext
        try {
            if (mContext instanceof Activity) {
                act = (Activity) mContext;
            } else if (mContext instanceof LynxContext) {
                Context real = ((LynxContext) mContext).getContext();
                if (real instanceof Activity) act = (Activity) real;
            }
        } catch (Exception ignored) {
        }

        if (act == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", "NO_ACTIVITY");
            error.put("message", "Cannot find Activity to start auth");
            pendingCallback.invoke(error);
            pendingCallback = null;
            return;
        }

        Intent it = new Intent(act, AuthActivity.class);
        it.putExtra(AuthActivity.EXTRA_URL, url);
        if (options != null && options.containsKey("callbackScheme")) {
            it.putExtra(AuthActivity.EXTRA_CALLBACK_SCHEME, options.get("callbackScheme").toString());
        }
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        act.startActivity(it);
    }

    @LynxMethod
    public void cancelAuth(Callback callback) {
        if (pendingCallback != null) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", "USER_CANCELLED");
            error.put("message", "User cancelled authentication");
            pendingCallback.invoke(error);
            pendingCallback = null;
        }
        // Always call the cancel callback to indicate completion
        callback.invoke(null);
    }

    public static void deliverResultToJs(String redirectUrl) {
        deliverResultToJs(redirectUrl, null);
    }

    // New: deliver result with optional session cookie (hextok_session) captured from WebView
    public static void deliverResultToJs(String redirectUrl, String sessionCookie) {
        if (pendingCallback != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("redirectUrl", redirectUrl);
            if (sessionCookie != null) {
                result.put("sessionCookie", sessionCookie);
            }
            // Error-first callback pattern: null for no error, result as second parameter
            pendingCallback.invoke(null, result);
        }
        pendingCallback = null;
    }

    public static void deliverErrorToJs(String code, String message) {
        if (pendingCallback != null) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", code);
            error.put("message", message);
            pendingCallback.invoke(error);
        }
        pendingCallback = null;
    }
}
