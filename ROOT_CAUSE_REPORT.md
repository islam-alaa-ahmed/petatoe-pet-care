# PETATOE v10.0.1 — Localization Version Gate Hotfix

## Root Cause
The GitHub Actions localization workflow failed because multiple certification scripts still contained hard-coded expectations for PETATOE v9.4.23 after Phase F1 synchronized the application release to v10.0.1.

The first failing gate was `scripts/enterprise-localization-certification-check.js`. After correcting only that gate, the same stale version assumptions would also fail later workflow steps in:

- `scripts/runtime-translation-completion-check.js`
- `scripts/smart-reports-translation-stability-check.js`
- `scripts/smart-reports-public-api-check.js`

The Smart Reports runtime identifier and the corresponding cache-busting query tokens in `index.html` also remained on the old v9.4.23 runtime string.

## Fix
- Certification gates now derive the canonical semantic version from `package.json`.
- Release display metadata and release identifier are verified against that canonical version.
- Runtime versions may equal the semantic version or start with `<version>-`, preserving release phase suffixes.
- Smart Reports certification derives its expected runtime token from the canonical localization runtime instead of a hard-coded release.
- Smart Reports runtime metadata and cache tokens were synchronized to `10.0.1-canonical-payroll-persistence`.

## Scope
No payroll calculations, Supabase logic, permissions, translations, visual design, or business logic were changed.
