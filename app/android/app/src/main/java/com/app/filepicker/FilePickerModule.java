package com.app.filepicker;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.lynx.jsbridge.LynxMethod;
import com.lynx.jsbridge.LynxModule;
import com.lynx.react.bridge.Callback;
import com.lynx.tasm.behavior.LynxContext;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FilePickerModule extends LynxModule {

    private static final String MODULE_NAME = "FilePicker";

    private static Callback pendingCallback = null;

    public FilePickerModule(Context context) {
        super(context);
    }

    @LynxMethod
    public void open(Map options, Callback callback) {
        Activity act = null;
        try {
            if (mContext instanceof Activity) {
                act = (Activity) mContext;
            } else if (mContext instanceof LynxContext) {
                Context real = ((LynxContext) mContext).getContext();
                if (real instanceof Activity) act = (Activity) real;
            }
        } catch (Exception ignored) { }

        if (act == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("code", "NO_ACTIVITY");
            error.put("message", "Cannot find Activity to start file picker");
            callback.invoke(error);
            return;
        }

        // Store callback for later use
        pendingCallback = callback;

        Intent it = new Intent(act, FilePickerActivity.class);
        if (options != null) {
            if (options.containsKey("multiple")) it.putExtra("multiple", (Boolean) options.get("multiple"));
            if (options.containsKey("accepts")) it.putExtra("accepts", options.get("accepts").toString());
            if (options.containsKey("includeBase64")) it.putExtra("includeBase64", (Boolean) options.get("includeBase64"));
        }
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        act.startActivity(it);
    }

    public static void deliverResultToJs(List<Map<String, Object>> files) {
        if (pendingCallback != null) {
            // Error-first callback pattern: null for no error, result as second parameter
            pendingCallback.invoke(null, files);
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
