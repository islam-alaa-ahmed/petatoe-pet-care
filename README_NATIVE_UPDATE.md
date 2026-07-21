# PETATOE v10 Native Update Strategy (N3)

## Production rule
The native iOS application does **not** download or execute replacement JavaScript bundles at runtime. Native releases are distributed through App Store or TestFlight. This preserves Apple review compliance and prevents unverified code from replacing the signed application.

## Remote manifest
Publish `native-release.json` at the GitHub Pages root. Update:
- `latestVersion` for an optional update notice.
- `minimumSupportedVersion` for a mandatory security update.
- `updateUrl` to the final App Store or TestFlight HTTPS URL.

Allowed update hosts are restricted to:
- apps.apple.com
- testflight.apple.com
- github.com

## Session preservation
The N2 Face ID session remains in iOS Keychain with `ThisDeviceOnly` protection. Normal application upgrades preserve it. Deleting the application removes local enrollment state and may remove Keychain data depending on iOS lifecycle behavior, so deletion is not part of the update workflow.

## Versioning
Before creating an Archive in Xcode, synchronize:
- `package.json` version
- `native-release.json`
- Xcode `MARKETING_VERSION`
- Xcode build number (`CURRENT_PROJECT_VERSION`)
- PETATOE release metadata
