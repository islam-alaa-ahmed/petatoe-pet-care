# Root Cause Report — V10-N2
PETATOE's PWA WebAuthn path is controlled by Safari/iOS Passkey UI and cannot reproduce an app-native Face ID unlock flow. N2 introduces a local Capacitor iOS plugin using LocalAuthentication and Keychain. It protects an existing authenticated PETATOE session rather than storing a password or creating another Passkey.
