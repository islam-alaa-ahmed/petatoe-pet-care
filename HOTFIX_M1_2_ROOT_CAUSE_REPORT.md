# PETATOE v9.4.24 — Hotfix M1.2 Root Cause Report

## Issue 1: Mobile header overlaps page content

**Root cause:** The mobile header is fixed, but its rendered height is not constant. Safe-area padding and wrapped header controls make the real height substantially larger than the legacy fixed CSS offsets (`68px`–`78px`). The main container therefore starts before the actual bottom edge of the header.

**Responsible files:**
- `css/themes/liquid-glass.css` — legacy static header offsets.
- `css/mobile/mobile-enterprise-m1.css` — safe-area rules increased the actual header height without a matching runtime content offset.

**Fix:** Added a mobile-only runtime coordinator that measures `.topbar` with `ResizeObserver` and writes the exact content offset to CSS variables. The main container and scroll padding now use the measured value.

## Issue 2: System toast covers KPI content on iPhone

**Root cause:** The shared `#toast` used desktop positioning and inherited large Liquid Glass typography/panel rules. On the narrow iPhone viewport it appeared as a large centered overlay over report cards.

**Responsible files:**
- `css/main.css` — generic desktop toast positioning.
- inherited theme rules affecting the toast presentation.

**Fix:** Added strict mobile-only `#toast` rules that render it as a compact, non-interactive notification immediately below the measured header.

## Scope protection

No authentication, Supabase, reports, payroll, permissions, localization dictionaries, or business calculations were changed.
