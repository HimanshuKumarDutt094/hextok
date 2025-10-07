package com.hextok.nativeauth;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;

public class AuthActivity extends Activity {

    public static final String EXTRA_URL = "extra_url";
    public static final String EXTRA_CALLBACK_SCHEME = "extra_callback_scheme";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String url = getIntent().getStringExtra(EXTRA_URL);
        final String callbackScheme = getIntent().getStringExtra(EXTRA_CALLBACK_SCHEME);

        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(webView);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String requested = request.getUrl().toString();
                if (callbackScheme != null && requested.startsWith(callbackScheme)) {
                    // Try to read cookies for the requested URL (session cookie set by backend)
                    try {
                        android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                        String cookieHeader = cookieManager.getCookie(requested);
                        String sessionCookie = null;
                        if (cookieHeader != null) {
                            String[] cookies = cookieHeader.split(";\\s*");
                            for (String c : cookies) {
                                if (c.startsWith("hextok_session=")) {
                                    sessionCookie = c.substring("hextok_session=".length());
                                    break;
                                }
                            }
                        }
                        NativeAuthModule.deliverResultToJs(requested, sessionCookie);
                    } catch (Exception e) {
                        NativeAuthModule.deliverResultToJs(requested, null);
                    }
                    finish();
                    return true;
                }
                return false;
            }
        });

        if (url != null) {
            webView.loadUrl(url);
        } else {
            NativeAuthModule.deliverErrorToJs("INVALID_REQUEST", "Missing URL");
            finish();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
    }
}
