# Root Cause Report — N4 Native iPhone Certification Gate

N1–N3 introduced a Capacitor wrapper, native Face ID/Keychain access, and a metadata-only update strategy. Static JavaScript checks alone could not protect the native architecture from missing Swift files, unsafe Keychain changes, plugin installation regressions, invalid release metadata, or an iOS project that no longer compiles.

N4 adds a repeatable static certification script and a macOS GitHub Actions simulator build. Physical Face ID behavior remains a real-device test and is intentionally not claimed as verified by automation.
