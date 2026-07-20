# PETATOE Phase PWA-1 — Root Cause Report

## Confirmed root cause
The project already contained a valid manifest and icon pack, but it had no Service Worker registration, no offline fallback, no install-event handling, no update lifecycle UI, and no explicit iPhone safe-area viewport support.

## Impact before correction
- Add to Home Screen worked only as a basic bookmark-style standalone launch.
- No controlled application cache or offline fallback existed.
- Users could remain on an outdated cached release after GitHub Pages deployment.
- iPhone users had no in-app installation guidance.
- Android/desktop browsers had no app-install action exposed by the application.

## Scope of correction
The correction is isolated to the PWA delivery layer. No business logic, Supabase queries, payroll, permissions, reports, or localization dictionary values were changed.
