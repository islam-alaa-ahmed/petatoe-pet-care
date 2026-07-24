# PETATOE v10.0.9 — Mobile Runtime Consolidation P2.2

## Root Cause
The mobile shell created two independent MutationObserver instances for navigation and identity updates, while the mobile experience layer created a third body-wide MutationObserver for reveal effects. These observers ran independently and scheduled overlapping animation-frame work during navigation and DOM rendering.

## Impact
- Repeated observer callbacks during screen rendering.
- Multiple animation-frame queues for the same DOM change burst.
- Extra main-thread work on mobile devices.
- Increased risk of duplicated initialization after responsive lifecycle changes.

## Scope
Mobile runtime only. Desktop, tablet, business logic, Supabase, SQL, payroll, operations, warehouse, permissions, and security logic were not changed.

## Fix
- Added one shared mobile runtime coordinator.
- Replaced three mobile MutationObserver instances with one shared observer.
- Preserved targeted observation for navigation visibility and identity text.
- Batched mutation delivery into one animation-frame flush.
- Reused the shared mutation stream for reveal effects.
