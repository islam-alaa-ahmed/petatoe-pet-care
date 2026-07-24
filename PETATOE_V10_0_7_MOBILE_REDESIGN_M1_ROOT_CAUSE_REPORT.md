# PETATOE v10.0.7 — Mobile Redesign M1 Root Cause Report

## Scope
Mobile phones only (`max-width: 760px`): application shell, header, drawer, bottom navigation and dashboard presentation. Desktop and tablet behavior remain outside the modified CSS scope.

## Confirmed Root Cause
The current mobile experience was not a single coherent mobile layout. It was produced by multiple historical mobile override layers applied over the desktop DOM. The existing shell worked functionally, but the visual hierarchy remained fragmented:

1. The header, drawer, bottom navigation and dashboard used separate surface, spacing and elevation systems.
2. Mobile navigation occupied the full bottom edge and visually competed with page content instead of behaving as a contained native navigation surface.
3. Dashboard cards inherited several desktop-oriented visual values, producing dense spacing and weak mobile hierarchy.
4. Light mode still inherited dark/navy mobile surfaces in parts of the shell and dashboard.
5. The header subtitle displayed user identity instead of the currently active screen, reducing navigation context on small screens.

## Responsible Files
- `css/mobile/mobile-enterprise-v10-shell.css`: existing functional shell styling.
- `css/mobile/mobile-enterprise-v10-dashboard.css`: existing dashboard mobile overrides.
- `mobile/mobile-enterprise-v10-shell.js`: mobile header, drawer and bottom navigation construction.
- `index.html`: mobile asset loading and release metadata.
- `service-worker.js`: PWA cache manifest and version.

## Fix Strategy
A new final mobile-only presentation layer was introduced after the existing mobile styles. It does not replace desktop markup, routing or business logic. The runtime shell received only isolated presentation-support changes: active-screen title, application-logo drawer avatar and notification badge synchronization.

## Explicitly Unchanged
- Supabase schema and queries.
- SQL files.
- Business calculations.
- Payroll, commissions, operating and report logic.
- Permissions and security rules.
- Desktop and tablet CSS behavior.
