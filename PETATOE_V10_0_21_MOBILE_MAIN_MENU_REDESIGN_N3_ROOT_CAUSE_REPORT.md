# PETATOE v10.0.21 — Mobile Main Menu Redesign N3

## Root Cause
The mobile drawer flattened every permitted desktop navigation button into one continuous list. The source navigation already contains direct entries and four semantic groups, but the mobile builder discarded that hierarchy. Combined with large card-like rows, strong gradients, and repeated visual weight, this made the menu crowded and slower to scan.

## Scope
Mobile drawer presentation only. No route, permission, data, Supabase, calculation, desktop, or tablet logic was changed.

## Fix
- Preserve the existing navigation hierarchy in the mobile drawer.
- Keep direct destinations in a compact two-column priority area.
- Render each source navigation group as a lightweight labeled section.
- Use smaller rows, quieter surfaces, compact icons, and a single active indicator.
- Preserve search, permissions, hidden-state filtering, active-route sync, RTL/LTR, light/dark mode, and current click handlers.
- No new visible wording was introduced; existing localized source labels are reused.
