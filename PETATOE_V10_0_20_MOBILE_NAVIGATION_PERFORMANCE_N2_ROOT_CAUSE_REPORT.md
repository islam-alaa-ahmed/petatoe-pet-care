# PETATOE v10.0.20 — Mobile Navigation Performance N2

## Scope
Improve mobile tab switching only. No business logic, permissions, Supabase queries, calculations, screen design, or desktop behavior changes.

## Confirmed Root Cause
1. `i18n/global-screen-translator.js` requested a full visible-surface localization scan on every `petatoe:tabchange` event.
2. `i18n/localization-center/application-shell-pilot.js` re-translated all application-shell roots on every tab change even though route changes do not modify the shell.
3. `mobile/mobile-enterprise-v10-experience.js` searched the document for reveal targets after each route instead of restricting work to the active panel.
4. There was no route timing ledger to verify tap-to-paint latency on the physical iPhone.

These operations ran on the main thread at the exact moment the destination panel was being rendered, increasing perceived tab-switch latency.

## Fix
- Replaced the tab-change full localization scan with an active-surface-only scan.
- Removed redundant application-shell localization work from ordinary route changes; shell localization remains tied to language, localization-ready, and nav rebuild events.
- Limited reveal-target scanning to the active panel.
- Completed the route progress state after the destination panel receives two animation frames.
- Added a bounded mobile navigation timing history exposed through `PETATOEMobileNavigationPerformance`.

## Safety
- Existing localization dictionary and runtime translation rules remain unchanged.
- Lazy module loading remains unchanged.
- Existing `petatoe:tabchange` subscribers remain unchanged.
- No visual redesign was included in N2.
