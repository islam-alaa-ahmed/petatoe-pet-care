# PETATOE Mobile Enterprise UI v10 — P1 PWA Update Engine

## Root Cause

The installed iPhone PWA could continue using old JavaScript and CSS because the existing Service Worker returned cached application assets before checking the network. The registration manager also depended mainly on the browser's normal Service Worker update cycle and did not actively check when the application returned to the foreground.

This made updates appear only after deleting the Home Screen app or clearing Safari website data, even though those actions should not be required.

## Responsible Files

- `service-worker.js`
- `pwa/pwa-manager.js`
- `scripts/mobile-enterprise-v10-certification-check.js`

## Confirmed Technical Causes

1. Cache-first behavior was applied to JavaScript, CSS, JSON and manifest resources.
2. No periodic or foreground-triggered `registration.update()` checks existed.
3. Service Worker registration did not explicitly use `updateViaCache: 'none'`.
4. The update lifecycle did not force a cache-busted reload after the new worker took control.
5. The mobile certification gate did not verify the PWA update engine requirements.

## Scope of Fix

The fix changes only the PWA caching and update lifecycle. It does not change authentication, Supabase, reports, payroll, permissions, calculations, Desktop UI or Tablet UI.
