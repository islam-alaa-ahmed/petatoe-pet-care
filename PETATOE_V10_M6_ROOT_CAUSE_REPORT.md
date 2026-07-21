# PETATOE Mobile Enterprise UI v10 — M6 Root Cause Report

## Scope
Final CI certification and production-lock protection for the cumulative Mobile Enterprise UI v10 layers (M1–M5).

## Root Cause
The project had strong localization and JavaScript syntax gates, but no dedicated CI gate validating the Mobile v10 architecture itself. A future commit could therefore accidentally:

- remove a required mobile asset;
- reference the same asset more than once;
- omit a Mobile v10 file from the Service Worker app shell;
- introduce hard-coded Arabic UI text into a mobile runtime file;
- remove the phone-only runtime guard;
- break the CSS phone boundary or brace balance;
- change the required V10 runtime load order;
- remove `viewport-fit=cover` and degrade iPhone Safe Area behavior.

The existing localization workflow would not reliably detect all of those mobile-specific regressions.

## Implemented Fix
A new read-only certification script was added:

`./scripts/mobile-enterprise-v10-certification-check.js`

It validates 59 mobile production conditions across the 10 cumulative V10 assets and writes a machine-readable result file:

`./MOBILE_ENTERPRISE_V10_CERTIFICATION_RESULTS.json`

The script is now executed automatically by:

`./.github/workflows/localization-lockdown.yml`

No UI, routing, Supabase, calculations, permissions, reports, payroll, appointments, Desktop, or Tablet behavior was modified.
