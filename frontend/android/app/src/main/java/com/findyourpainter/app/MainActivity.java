package com.findyourpainter.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Standard Android runtime permission check for Camera and Microphone
        // This is necessary for Android 6.0+ regardless of manifest entries
        String[] permissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        };

        boolean allGranted = true;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (!allGranted) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Enhance WebView settings for WebRTC support in Android APK
        WebView webView = (WebView) this.bridge.getWebView();
        WebSettings settings = webView.getSettings();
        
        settings.setJavaScriptEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setDomStorageEnabled(true);
        
        // Use the existing WebChromeClient from the bridge if possible, or set a new one
        // Capacitor Bridge usually sets its own WebChromeClient, so we just need to ensure
        // onPermissionRequest is handled for WebRTC.
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Automatically grant permissions requested by the WebView (Camera, Mic)
                // In production, you might want to check the requested resources if needed
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });
    }
}
