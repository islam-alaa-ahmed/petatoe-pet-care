# PETATOE Mobile Enterprise UI v10 — M1 Root Cause Report

## Root Cause
The phone experience was assembled from multiple legacy desktop overrides (`main.css`, liquid-glass rules, M1/M2 mobile patches) while the original desktop header and sidebar remained the canonical shell. This caused duplicated layout ownership, runtime header-height compensation, an oversized fixed header, and no native bottom navigation or dedicated mobile menu.

## Resolution
A dedicated phone-only App Shell was added at `max-width: 760px`:

- One compact safe-area-aware header.
- Five-item bottom navigation.
- Dedicated searchable mobile drawer generated from the canonical sidebar navigation.
- Existing router and permission-filtered navigation remain the source of truth.
- Unified layer positions for toast and PWA update notifications.
- Legacy desktop sidebar is hidden on phones only.

No business logic, Supabase queries, reports, payroll, permissions, or desktop/tablet layout was modified.
