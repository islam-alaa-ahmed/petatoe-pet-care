# PETATOE v9.4.8 — Localization Lockdown CI Fix

## Root Cause

The GitHub Actions `Localization Lockdown` workflow failed for three verified reasons:

1. `settings/settings.js` still referenced `PETATOE_I18N` inside the language resolver.
2. `scripts/enterprise-localization-certification-check.js` still validated release v9.4.5.
3. `scripts/localization-production-lockdown-check.js` and the Localization Center runtime still expected v9.4.5 metadata.

## Fixes

- Removed the final `PETATOE_I18N` fallback from `settings/settings.js`.
- Synchronized the Localization Center runtime to `9.4.8-settings-localization-phase61`.
- Updated Enterprise Localization Certification expectations to PETATOE v9.4.8.
- Updated Production Localization Lockdown expectations to PETATOE v9.4.8.
- Kept the current release metadata and did not roll the project back to v9.4.5.

## Verification

- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Legacy calls: 0
- Missing stored texts: 0
- Missing counterparts: 0
- Arabic entries: 3361
- English entries: 3361
- JavaScript syntax: 275 files passed, 0 failures
