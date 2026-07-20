# GitHub Desktop Summary

## Summary

Phase A4 adds a reproducible Supabase localization parity pipeline generated from the effective runtime catalog order. It updates the runtime loader to preserve Arabic source-matching metadata while continuing to reject Arabic text in visible English translations.

## Modified

- `index.html`
- `i18n/localization-center/loader.js`

## Added

- `scripts/localization-supabase-parity-build.js`
- `LOCALIZATION_SUPABASE_PARITY_SNAPSHOT.json`
- `petatoe_v9_4_23_supabase_localization_dictionary_parity_sync.sql`

## Not changed

- Business logic
- Report calculations
- Payroll workflow
- Supabase client configuration
- Queries or RPC calls used by operational modules
