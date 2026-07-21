# PETATOE Mobile Enterprise UI v10 — M2 Root Cause Report

## Scope
Dashboard presentation on phone screens only (`max-width: 760px`). No business logic, calculations, Supabase queries, permissions, payroll, appointments, or desktop/tablet layouts were changed.

## Root Cause
The Dashboard was still rendered using the desktop information architecture and then compressed by overlapping legacy media queries. The same desktop filter row, wide KPI cards, fixed chart geometry, ranking charts, payment layout, vehicle comparison, and insights grid were all forced into a narrow phone viewport.

This caused:

- crowded filters and controls;
- KPI cards with weak reading hierarchy;
- chart labels and plot areas competing for limited width;
- payment and ranking sections behaving as compressed desktop blocks;
- inconsistent spacing between Dashboard sections;
- KPI detail popovers escaping the phone viewport.

## Responsible Surfaces

- `index.html`: Dashboard structure and v10 asset registration.
- `css/mobile/mobile-enterprise-v10-dashboard.css`: new phone-only Dashboard presentation layer.
- `mobile/mobile-enterprise-v10-dashboard.js`: filter bottom-sheet controller and phone chart presentation tuning.
- `service-worker.js`: cache version and precache registration for the new M2 assets.

## Implemented Resolution

- Added a dedicated phone-only Dashboard layer instead of adding more generic desktop overrides.
- Converted the existing Dashboard filter controls into a mobile bottom sheet without cloning or replacing their original event handlers.
- Rebuilt KPI layout as a readable two-column mobile grid.
- Normalized cards, spacing, chart containers, payment rows, vehicle cards, and quick insights for phone widths.
- Tuned existing Chart.js instances only at presentation level: responsive sizing, tick density, legend scale, and mobile-safe padding.
- Preserved the canonical Dashboard data, rendering functions, filters, calculations, and router.
