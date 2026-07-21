#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "PETATOE iOS setup must run on macOS with Xcode installed." >&2
  exit 1
fi

command -v node >/dev/null || { echo "Node.js is required." >&2; exit 1; }
command -v xcodebuild >/dev/null || { echo "Xcode Command Line Tools are required." >&2; exit 1; }

npm install --no-audit --no-fund
npm run native:build:web

if [[ ! -d ios ]]; then
  npx cap add ios
fi

npx cap sync ios
npx cap open ios
