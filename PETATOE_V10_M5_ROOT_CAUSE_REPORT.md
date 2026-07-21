# PETATOE Mobile Enterprise UI v10 — M5 Root Cause Report

## Scope
Mobile experience, accessibility, touch behavior, motion preferences, and PWA refresh behavior only.

## Root Cause
The M1–M4 layers established the mobile shell and screen layouts, but the mobile experience still depended on browser-default interaction behavior. There was no unified touch-feedback layer, no reduced-motion policy, no controlled standalone pull-to-refresh gesture, no route transition feedback, and no one-time viewport reveal policy for dynamically rendered cards.

## Affected Surfaces
- Mobile navigation and drawer actions.
- Dashboard, report, and management cards.
- Horizontally scrollable rails and wide tables.
- Standalone PWA refresh behavior.
- Keyboard focus visibility and motion accessibility.

## Fix Strategy
A phone-only enhancement layer was added. It does not change routes, calculations, Supabase queries, permissions, or any module workflow. The layer provides:

- Consistent touch targets and press feedback.
- Visible `:focus-visible` keyboard focus.
- Reduced-motion compliance.
- Horizontal scroll containment and hidden cosmetic scrollbars.
- Guarded standalone pull-to-refresh from the top of the page only.
- Lightweight route progress feedback.
- One-time IntersectionObserver card reveal.
- Dialog semantics for the existing mobile drawer.

## Files
- `css/mobile/mobile-enterprise-v10-experience.css` — new.
- `mobile/mobile-enterprise-v10-experience.js` — new.
- `index.html` — references the M5 assets.
- `service-worker.js` — updates the PWA cache and pre-cache list.
