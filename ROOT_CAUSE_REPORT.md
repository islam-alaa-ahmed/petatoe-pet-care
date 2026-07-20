# Root Cause Report — Phase A4

## Confirmed causes

1. The existing Supabase parity file was generated before the A3 localization catalogs and contained 3,427 keys, while the effective runtime catalog loaded by `index.html` now contains 3,822 Arabic and 3,822 English keys.
2. Supabase synchronization therefore could not reach exact parity with the current runtime dictionary.
3. Nine `runtimeTemplates.*.source` values intentionally contain the original Arabic source text inside the English dictionary. They are matching metadata, not visible English translations. The runtime loader rejected them under the generic Arabic-in-English protection rule, creating a local/Supabase source mismatch.
4. The previous SQL incremented value versions even when text had not changed and did not deactivate obsolete system keys, which could leave stale active records.

## Fix

- Generated the Supabase synchronization file from the actual localization-center script order in `index.html`.
- Added deterministic key/value hashes and exact local parity checks.
- Exempted only `runtimeTemplates.<name>.source` metadata from the visible-English rejection rule.
- Added idempotent version updates and deactivation of obsolete system-owned keys only.
- Preserved user-created keys.
- Added an exact post-sync parity query returning `parity_ok`.
