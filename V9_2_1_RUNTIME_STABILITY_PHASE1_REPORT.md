# PETATOE v9.2.1 — Runtime Stability Fix (Phase 1)

## Baseline

`petatoe-pet-care(14).zip`

## Confirmed Root Causes Addressed

1. Runtime Cache/Supabase values could overwrite correct local English dictionary entries.
2. English runtime bundles accepted Arabic, mixed-language, or empty values.
3. The primary i18n engine and the global screen translator both observed DOM mutations.
4. Partial Arabic/English output could be stored in the global translator cache.
5. Business-data localization could silently return Arabic canonical values in English mode.
6. Reapply operations could run while the async localization bundle was still loading.

## Implemented Changes

### Dictionary protection
- Local English dictionaries are now authoritative for existing keys.
- Cache and Supabase may fill missing English keys but cannot overwrite valid local English values.
- Arabic, mixed-language, and empty English runtime values are rejected.
- Only accepted values are written back to localization cache.
- Loader status now exposes rejected/protected runtime value counters.

### Runtime loading lock
- The loader dispatches `petatoe:localization-loading` at load start and finish.
- The primary i18n engine defers reapply/subtree translation while the loader is active.
- A single reapply runs when loading finishes.
- The unified center refuses subtree application while dictionaries are loading.

### Single DOM translation engine
- `i18n/index.js` remains the primary DOM translation engine.
- The autonomous MutationObserver in `global-screen-translator.js` is no longer installed.
- The global translator remains available only as a manual diagnostic/fallback API.
- Automatic hydration/rescan loops on user, tab, records, and navigation events were removed.

### Mixed-language cache protection
- Any translated result that still contains Arabic is not cached.
- Partial output is not written back into the DOM by the global fallback translator.

### Business-data fallback protection
- English mode no longer silently returns an Arabic canonical value when translation is missing.
- Missing values receive a non-Arabic transliterated fallback.
- Missing entries are recorded in `window.PETATOE_BUSINESS_I18N_MISSING` for later source migration.

## Verification

- Runtime Stability Phase 1 guard: **Passed**
- Existing source/regression guards: **12 passed, 0 failed**
- JavaScript syntax: **246 files checked, 0 errors**
- Legacy localization calls remain absent.
- No database schema, Supabase RPC, authentication, permissions, payroll calculations, or report calculations were changed.

## Important Scope Note

This phase fixes the runtime race, overwrite, mixed-cache, and competing-engine causes. It does not claim that all hardcoded Arabic source renderers are migrated. Remaining source-level Arabic must be addressed in the next Source Migration Audit phase.
