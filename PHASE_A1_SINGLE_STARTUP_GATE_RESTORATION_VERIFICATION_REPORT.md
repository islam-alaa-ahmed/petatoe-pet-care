# PETATOE v10.0.25 — Phase A1 Verification Report
## Single Startup Gate Restoration

## Baseline

`petatoe-pet-care-main (18).zip`

## Scope

This phase only restores a single authoritative startup-gate source. It does not modify business logic, Supabase, SQL, authentication rules, permissions, Smart Reports calculations, Payroll calculations, UI design, or release number.

## Confirmed Root Cause

`index.html` contained a complete inline implementation of `window.PETATOEMobileStartupGate`, while `performance/mobile-startup-loading-gate.js` contained a different and newer implementation.

The runtime executed the inline implementation. That implementation returned `Promise.resolve(true)` immediately for desktop inside `ensureGroup()`. Therefore desktop consumers could run before Smart Reports and Payroll providers were ready. Previous fixes applied only to the external file and did not affect the runtime because the external file was not loaded by `index.html`.

## Changes

1. Removed the complete inline startup-gate implementation from `index.html`.
2. Loaded `performance/mobile-startup-loading-gate.js` exactly once, synchronously, in the same early bootstrap position.
3. Preserved the existing earliest-bootstrap trace around the external gate.
4. Aligned the gate diagnostic version to `10.0.25-runtime-restoration-a1`.
5. Added `scripts/startup-gate-single-source-check.js`.
6. Added the new check to `.github/workflows/localization-lockdown.yml`.

## Runtime Contract After Change

- One executable startup-gate reference in `index.html`.
- Zero inline definitions of `window.PETATOEMobileStartupGate`.
- One external definition in `performance/mobile-startup-loading-gate.js`.
- Desktop `ensureGroup()` now executes `waitForDesktopGroup(name)` from the active runtime source.
- The Service Worker already precaches the now-active external gate file.

## Verification Results

- Startup Gate Single Source Certification: PASSED
- Mobile Enterprise UI v10 Certification: PASSED — 61/61
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- JavaScript syntax validation for the modified gate: PASSED

## Modified Files

- `index.html`
- `performance/mobile-startup-loading-gate.js`
- `scripts/startup-gate-single-source-check.js`
- `.github/workflows/localization-lockdown.yml`

## Hashes

### index.html
- Before: `0b278bcb8c0df5f6e488fdc2ad8d8639983c19911b8af940c6b93c6e400d9db6`
- After: `a3c0bc81e320f5bc5d31e4d4c95c0d741ea452e76818d9e4a126bf657fd787f7`

### performance/mobile-startup-loading-gate.js
- Before: `96bc7f4b6b4dfe03e66238e70b3276ba273fc48d9cb8db7b0c087395eec2cc67`
- After: `988687d948022179f74a2bd939e9bad8cdf211f002da7891b39bb4f61bd41366`

### .github/workflows/localization-lockdown.yml
- Before: `d610bcfcfb43fb92839750ca95d0529a0097d3aedaf933dbdd9e3efa45cf9b50`
- After: `d1d90f5cc6513c755c069aae783cec1dd792ebb01cfb027e6133e917cf468f8f`

## Required Live Verification

After deployment, test desktop in this order:

1. Dashboard
2. Smart Reports
3. Smart Reports Refresh
4. Payroll Management
5. Payroll Statement
6. Payroll CSV/Excel export

Inspect Console for:

- `smartServicesScopedData is not defined`
- `PETATOEInlineHandlers.modules.payroll.* handler not found`
- Any new `Uncaught Error` or `ReferenceError`

Phase A1 is code-certified locally. Functional runtime certification on GitHub Pages requires the live test above.
