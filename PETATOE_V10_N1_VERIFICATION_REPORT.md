# PETATOE v10 Native Mobile Wrapper — N1 Verification Report

## Passed checks

- `package.json` parses successfully.
- `capacitor.config.ts` defines the stable app ID, app name and `www` web directory.
- `scripts/build-native-web.mjs` passes Node.js syntax validation.
- The native web build completes and produces `www/index.html`.
- Generated `www`, `node_modules`, Xcode user state and DerivedData are excluded from Git.
- The macOS setup script validates the operating system and required tools before installation.
- Existing PETATOE web source and business logic remain unchanged.

## Environment limitation

The current execution environment is Linux and its npm registry returned HTTP 503 while fetching Capacitor packages. Xcode is also unavailable outside macOS. Therefore the generated Xcode `ios/` project could not be honestly created or opened here.

On a Mac, run:

```bash
bash scripts/setup-native-ios.sh
```

This installs the declared dependencies, generates the iOS project, synchronizes the verified `www` bundle and opens Xcode.
