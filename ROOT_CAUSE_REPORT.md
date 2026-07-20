# Root Cause Report — PETATOE Enterprise App Icon

## Root Cause
The application used only a legacy root `favicon.ico`. It had no Web App Manifest, Apple Touch Icon, Android maskable icons, or explicit icon metadata for installed desktop/mobile shortcuts.

## Impact
- Browser tab used the old icon.
- Add-to-Home-Screen and installed desktop shortcuts had no unified PETATOE identity.
- iOS, Android, PWA and Windows could fall back to generic or low-resolution icons.

## Fix
- Replaced the root multi-resolution `favicon.ico`.
- Added a complete PNG icon pack based on the approved glass PETATOE design.
- Added Apple Touch, standard PWA and maskable icons.
- Added `manifest.webmanifest` and `browserconfig.xml`.
- Updated `index.html` and `404.html` icon metadata.
