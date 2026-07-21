# PETATOE v10 Native Mobile Wrapper — N1 Foundation

This phase adds the Capacitor iOS foundation without changing PETATOE business logic.

## Requirements on the Mac

- macOS with Xcode installed
- Node.js 20 or newer
- CocoaPods supported by the selected Capacitor/Xcode toolchain

## First setup

```bash
npm install
npm run native:build:web
npx cap add ios
npm run native:sync
npm run native:open:ios
```

The native application identifier is:

```text
com.petatoe.enterprise
```

## Normal development workflow

After modifying PETATOE web files:

```bash
npm run native:sync
npm run native:open:ios
```

Then build and run from Xcode on the connected iPhone.

## Phase boundary

N1 only creates the native container and deterministic web bundle. Native Face ID and Keychain session protection are implemented in N2.
