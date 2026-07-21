# PETATOE Mobile Enterprise UI v10 — M3 Root Cause Report

## Scope
Mobile presentation of Sales, Vans, Services, Smart Reports, charts, filters, and report tables on phone screens only.

## Confirmed Root Cause
The report screens were still rendered with the desktop information architecture and desktop-width tables. Existing responsive rules reduced sizes but did not provide a dedicated mobile report layer. The same generated Smart Reports DOM could also change after initial page load, so one-time CSS/JS initialization was insufficient.

## Responsible Surfaces
- `index.html`: no v10 report presentation layer was loaded.
- `service-worker.js`: no v10 report assets were pre-cached.
- Report DOM generated under `#smartReportsArea`: cards, filter controls, charts, and wide tables retained desktop layout.

## Impact
- Wide tables were compressed or clipped.
- Filters and year selectors wrapped into crowded multi-line groups.
- Desktop multi-column report cards became difficult to scan on a phone.
- Dynamically rendered Smart Reports did not consistently receive mobile enhancements.

## Implemented Fix
- Added a phone-only report stylesheet scoped to `max-width: 760px`.
- Added a mobile report enhancer that observes dynamically generated report content and applies presentation classes only.
- Added horizontal touch rails for filters/actions.
- Added dedicated chart heights and one-column mobile report grids.
- Added horizontally scrollable table viewports with sticky headers and first-column support.
- Updated PWA cache version and pre-cache assets.

## Exclusions
No business calculations, Supabase queries, permissions, report datasets, export logic, desktop layout, or tablet layout were changed.
