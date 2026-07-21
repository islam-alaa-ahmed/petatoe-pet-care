# PETATOE Mobile Enterprise UI v10 — M1.1 Localization Certification Fix

## Root Cause

The V10 mobile shell introduced visible Arabic UI literals directly inside `mobile/mobile-enterprise-v10-shell.js`. The Enterprise Localization Certification scans JavaScript and HTML surfaces and requires every displayed Arabic string to exist in the canonical localization store.

The failing literals were detected in mobile accessibility labels and the drawer search placeholder. Additional mobile-shell labels were also still hard-coded and were migrated in the same limited scope to prevent the next certification failure and to support English mode correctly.

## Files Responsible

- `mobile/mobile-enterprise-v10-shell.js`
- `i18n/localization-center/dictionary-store.js`

## Fix

- Added a canonical `mobileV10` Arabic/English dictionary namespace.
- Replaced all Arabic UI literals in the V10 shell with key-based resolution through `PETATOE_LOCALIZATION_CENTER` / `PETATOE_LOCALIZATION_CENTER_STORE`.
- Generated an updated Supabase localization parity SQL file for the new dictionary keys.

No routing, permissions, Supabase business data, reports, payroll, desktop layout, or tablet layout logic was changed.
