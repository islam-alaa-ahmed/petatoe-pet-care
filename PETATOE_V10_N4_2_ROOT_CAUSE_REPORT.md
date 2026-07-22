# PETATOE v10 N4.2 — Root Cause Report

## Confirmed failure

The `static-certification` job passed, while `ios-simulator-build` failed at:

```text
Validate Face ID usage description
Print: Entry, ":NSFaceIDUsageDescription", Does Not Exist
```

## Root cause

`scripts/install-native-face-id.mjs` copied the Swift plugin files and patched `Main.storyboard`, but it never wrote `NSFaceIDUsageDescription` to `ios/App/App/Info.plist`.

The separate macOS helper `scripts/setup-native-ios.sh` added the key with `PlistBuddy`, but the GitHub Actions workflow invokes `npm run native:install:faceid` directly and does not run that helper. Therefore the generated CI project had no Face ID privacy description.

## Impact

The workflow stopped before the unsigned simulator compilation. On a signed physical-device build, omission of this privacy key would also make Face ID unavailable and could terminate the application when access is requested.

## Fix

The Face ID installer now owns the complete native installation contract and writes or updates the required key directly in `Info.plist`. The operation is idempotent and does not create duplicate keys.
