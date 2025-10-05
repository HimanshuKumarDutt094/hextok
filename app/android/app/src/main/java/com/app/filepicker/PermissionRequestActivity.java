package com.app.filepicker;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import androidx.annotation.Nullable;

public class PermissionRequestActivity extends Activity {

    private static final int REQ_MANAGE = 0xF11;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Intent it = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                it.setData(Uri.parse("package:" + getPackageName()));
                startActivityForResult(it, REQ_MANAGE);
            } else {
                // Pre-R: notify module that permission is assumed available for SAF
                com.app.filepicker.FilePermissionModule.deliverPermissionResult(true);
                finish();
            }
        } catch (Exception e) {
            com.app.filepicker.FilePermissionModule.deliverPermissionResult(false);
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_MANAGE) {
            boolean granted = false;
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    granted = Settings.System.canWrite(getApplicationContext());
                }
            } catch (Exception ignored) { }
            com.app.filepicker.FilePermissionModule.deliverPermissionResult(granted);
        }
        finish();
    }
}
