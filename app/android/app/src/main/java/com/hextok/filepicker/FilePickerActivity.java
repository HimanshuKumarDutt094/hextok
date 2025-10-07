package com.hextok.filepicker;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.content.ContentResolver;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.provider.DocumentsContract;
import android.os.Build;

import androidx.annotation.Nullable;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FilePickerActivity extends Activity {

    private static final int REQUEST_CODE = 0xF10;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);

        boolean multiple = getIntent().getBooleanExtra("multiple", false);
        String accepts = getIntent().getStringExtra("accepts");
        boolean includeBase64 = getIntent().getBooleanExtra("includeBase64", false);

        if (accepts != null && !accepts.isEmpty()) {
            intent.setType(accepts);
        } else {
            intent.setType("*/*");
        }

        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple);

        try {
            startActivityForResult(Intent.createChooser(intent, "Select file(s)"), REQUEST_CODE);
        } catch (Exception e) {
            FilePickerModule.deliverErrorToJs("ERROR_STARTING_INTENT", e.getMessage());
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != REQUEST_CODE) {
            finish();
            return;
        }

        if (resultCode != RESULT_OK || data == null) {
            FilePickerModule.deliverErrorToJs("USER_CANCELLED", "User cancelled file picker");
            finish();
            return;
        }

        List<Map<String, Object>> out = new ArrayList<>();

        try {
            ClipData clip = data.getClipData();
            if (clip != null) {
                for (int i = 0; i < clip.getItemCount(); i++) {
                    Uri uri = clip.getItemAt(i).getUri();
                    // Persist permission if possible
                    persistUriIfPossible(uri, data);
                    Map<String, Object> fi = uriToMap(uri, true);
                    out.add(fi);
                }
            } else {
                Uri uri = data.getData();
                persistUriIfPossible(uri, data);
                Map<String, Object> fi = uriToMap(uri, true);
                out.add(fi);
            }

            FilePickerModule.deliverResultToJs(out);
        } catch (Exception e) {
            FilePickerModule.deliverErrorToJs("ERROR_READING_FILES", e.getMessage());
        }

        finish();
    }

    private Map<String, Object> uriToMap(Uri uri, boolean includeBase64) {
        Map<String, Object> m = new HashMap<>();
        try {
            m.put("uri", uri.toString());

            // Try to get a display name and size via content resolver
            String name = null;
            long size = -1;
            ContentResolver cr = getContentResolver();
            Cursor cursor = null;
            try {
                cursor = cr.query(uri, null, null, null, null);
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (nameIdx != -1) name = cursor.getString(nameIdx);
                    if (sizeIdx != -1) size = cursor.getLong(sizeIdx);
                }
            } catch (Exception ignored) {
            } finally {
                if (cursor != null) cursor.close();
            }

            if (name == null) name = uri.getLastPathSegment();
            if (name != null) m.put("name", name);
            if (size >= 0) m.put("size", size);

            // mimeType
            try {
                String mime = cr.getType(uri);
                if (mime != null) m.put("mimeType", mime);
            } catch (Exception ignored) { }

            // lastModified - best effort using DocumentContract if available
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    Cursor c = cr.query(uri, new String[]{"last_modified"}, null, null, null);
                    if (c != null && c.moveToFirst()) {
                        int idx = c.getColumnIndex("last_modified");
                        if (idx != -1) {
                            long lm = c.getLong(idx);
                            m.put("lastModified", lm);
                        }
                    }
                    if (c != null) c.close();
                }
            } catch (Exception ignored) { }

            // Attempt to open stream and read bytes if requested (careful with large files)
            if (includeBase64) {
                InputStream is = getContentResolver().openInputStream(uri);
                if (is != null) {
                    byte[] buf = new byte[4096];
                    int len;
                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    while ((len = is.read(buf)) != -1) baos.write(buf, 0, len);
                    is.close();
                    byte[] all = baos.toByteArray();
                    String b64 = Base64.encodeToString(all, Base64.NO_WRAP);
                    m.put("base64", b64);
                    m.put("size", all.length);
                }
            }
        } catch (Exception ignored) { }
        return m;
    }

    private void persistUriIfPossible(Uri uri, Intent data) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                final int takeFlags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                this.getContentResolver().takePersistableUriPermission(uri, takeFlags);
            }
        } catch (Exception ignored) { }
    }
}
