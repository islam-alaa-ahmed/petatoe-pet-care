# PETATOE v9.4.4 — Production Localization Lockdown

## Scope

- Locked the canonical translation source to `PETATOE_LOCALIZATION_CENTER_STORE`.
- Kept compatibility modules as data-free adapters only.
- Removed unused public localization aliases.
- Added a repository-wide lockdown validator.
- Added GitHub Actions enforcement for certification, lockdown, and JavaScript syntax checks.
- Synchronized release metadata and localization cache tokens.

## Enforcement Rules

The build fails when it detects:

- Direct screen-level access to legacy module localization globals.
- Translation dictionaries embedded in compatibility adapters.
- Deprecated public localization aliases.
- Missing Arabic/English language counterparts.
- Release metadata drift.
- JavaScript syntax errors.

## Release

- Version: PETATOE v9.4.4
- Release name: ELC_V9_4_4_PRODUCTION_LOCALIZATION_LOCKDOWN
