# PETATOE v10 Native Mobile Wrapper — N1 Root Cause Report

## Current limitation

PETATOE is delivered as a GitHub Pages PWA. iOS therefore owns the WebAuthn/Passkey interface and can display system sheets such as “Use Passkey” or “Save Passkey”. A PWA cannot replace that security UI with the same local Face ID flow used by a native iOS application.

## Architectural cause

The project has no native iOS container, application identifier, Xcode project, deterministic native web bundle, or Capacitor synchronization workflow. Consequently, native-only services such as Local Authentication and Keychain cannot be integrated safely.

## N1 correction

N1 introduces a Capacitor foundation with:

- stable application identifier `com.petatoe.enterprise`;
- deterministic `www` build output;
- iOS synchronization commands;
- macOS setup automation;
- native build exclusions that prevent repository and generated files from being copied into the app bundle.

No authentication or business workflow is changed in N1. Native Face ID and Keychain are intentionally reserved for N2.
