# PETATOE Mobile Enterprise UI v10 — M4 Root Cause Report

## Scope
Phone-only presentation audit and implementation for operational and management screens. No business logic, data queries, permissions, or desktop/tablet behavior was changed.

## Root Cause
The operational and administrative modules still inherited desktop-first layout rules. Their forms, action groups, tab strips, dynamically rendered cards, and wide tables were compressed into the phone viewport rather than receiving a dedicated mobile presentation layer.

The affected surfaces included operations, vehicle execution, operational KPIs, customer 360, obligations, treasury, warehouses, payroll, salary slips, commission statements, children expenses, settings, logs, data entry, imports, and records.

## Technical Cause
1. Multi-column form and KPI grids remained active below phone width.
2. Action groups wrapped unpredictably and produced uneven touch targets.
3. Dynamic modules rendered after navigation and therefore were not consistently enhanced by static CSS alone.
4. Wide management tables had no unified horizontal viewport, sticky header, or minimum readable width.
5. Tab groups such as warehouse, children expenses, payroll, and settings were designed for desktop width.

## Implemented Fix
- Added a phone-only management presentation stylesheet.
- Added a small enhancement controller with `MutationObserver` support for dynamically rendered modules.
- Standardized mobile cards, forms, filters, action groups, tab rails, tables, imports, and pagination.
- Updated the PWA cache version and pre-cache asset list.

## Files
- `css/mobile/mobile-enterprise-v10-management.css`
- `mobile/mobile-enterprise-v10-management.js`
- `index.html`
- `service-worker.js`
