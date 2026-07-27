# PETATOE Phase D3.3 — Clean Startup Probe Verification

## Baseline
PETATOE v10.0.25 — Navigation Runtime Isolation C2.3.

## Scope completed
- Added a lightweight in-memory startup profiler loaded before the critical CSS gate.
- No repeated `localStorage` writes occur during startup.
- A single diagnostic snapshot is persisted after `window.load` plus the stabilization delay.
- Added Long Task observation, paint/navigation milestones, mobile-root detection, resource timing, and runtime error capture.
- Added a mobile Startup Diagnostics section inside About App.
- Added an Arabic/English localized button for copying the advanced diagnostic report.
- Preserved the existing performance-trace button.

## Modified files
- `index.html`
- `performance/startup-clean-profiler.js` (new)
- `mobile/about-app.js`
- `css/mobile/mobile-about-app.css`
- `i18n/localization-center/dictionary-store.js`

## Safety boundaries
- No business logic changed.
- No Supabase, authentication, permissions, payroll, or reporting logic changed.
- No desktop About App UI is exposed; the current mobile-only media boundary remains in place.
- Release version and release name were not changed.

## Static verification
- JavaScript syntax checks passed for the new profiler, About App module, and localization dictionary.
- All new visible Arabic and English strings were registered in the canonical localization dictionary.
- Updated asset query tokens ensure GitHub Pages/PWA requests the changed files.

## Device verification required
After publishing, open PETATOE on the iPhone, wait for the home screen to finish loading, then open:

`الإعدادات → حول التطبيق → تشخيص بدء التشغيل → نسخ تقرير التشخيص المتقدم`

Send the copied JSON report for Root Cause analysis.
