# PETATOE v10.0.22 — Mobile Dashboard Controls Hotfix

## Root Cause
- Legacy mobile topbar controls (`#topbarSearch` and `#topPawBackToTopBtn`) remained available under overlapping mobile CSS layers, so they appeared below the canonical header.
- The mobile dashboard adapter converted the complete dashboard filter row into a bottom sheet, although only the year selector is required on the mobile home screen.
- The year selector stayed inside that bottom sheet and therefore appeared near the end of the page instead of directly below the payroll shortcuts.

## Scope
Phone layout only (`max-width: 760px`). Desktop and tablet markup and behavior remain unchanged.
