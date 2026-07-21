#!/usr/bin/env bash
set -euo pipefail
if [[ "$(uname -s)" != "Darwin" ]]; then echo "PETATOE iOS setup must run on macOS with Xcode installed." >&2; exit 1; fi
command -v node >/dev/null || { echo "Node.js is required." >&2; exit 1; }
command -v xcodebuild >/dev/null || { echo "Xcode Command Line Tools are required." >&2; exit 1; }

npm install --no-audit --no-fund
npm run native:build:web
if [[ ! -d ios ]]; then npx cap add ios; fi
node scripts/install-native-face-id.mjs
node scripts/install-native-update.mjs
PLIST="ios/App/App/Info.plist"
/usr/libexec/PlistBuddy -c "Delete :NSFaceIDUsageDescription" "$PLIST" >/dev/null 2>&1 || true
/usr/libexec/PlistBuddy -c "Add :NSFaceIDUsageDescription string PETATOE uses Face ID to securely unlock your saved session." "$PLIST"
npx cap sync ios
npx cap open ios
