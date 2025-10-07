package com.hextok.filepicker;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.lynx.jsbridge.LynxMethod;
import com.lynx.jsbridge.LynxModule;
import com.lynx.react.bridge.Callback;
import com.lynx.tasm.behavior.LynxContext;

import java.util.HashMap;
import java.util.Map;

public class FilePermissionModule extends LynxModule {

    private static Callback pendingCallback = null;

    public FilePermissionModule(Context context) {
        super(context);
    }

    @LynxMethod
    public void hasFilePermission(Callback callback) {
        boolean granted = false;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                granted = android.os.Environment.isExternalStorageManager();
            } else {
                // Pre-R: SAF-based pickers don't require MANAGE_EXTERNAL_STORAGE; treat as available
                granted = true;
            }
            // Error-first callback pattern: null for no error, result as second parameter
            callback.invoke(null, granted);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", "PERMISSION_CHECK_ERROR");
            error.put("message", e.getMessage() != null ? e.getMessage() : "Failed to check permission");
            callback.invoke(error);
        }
    }

    @LynxMethod
    public void requestFilePermission(Callback callback) {
        Activity act = null;
        try {
            if (mContext instanceof Activity) act = (Activity) mContext;
            else if (mContext instanceof LynxContext) {
                Context real = ((LynxContext) mContext).getContext();
                if (real instanceof Activity) act = (Activity) real;
            }
        } catch (Exception ignored) { }

        if (act == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", "NO_ACTIVITY");
            error.put("message", "Cannot find Activity to request permission");
            callback.invoke(error);
            return;
        }

        pendingCallback = callback;
        Intent it = new Intent(act, PermissionRequestActivity.class);
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        act.startActivity(it);
    }

    public static void deliverPermissionResult(boolean granted) {
        if (pendingCallback != null) {
            // Error-first callback pattern
            pendingCallback.invoke(null, granted);
        }
        pendingCallback = null;
    }
}
