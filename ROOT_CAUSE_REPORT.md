# Root Cause Report — Phase A3.6

## Confirmed Root Cause
The localization load chain contained 18 divergent rewrites of the same translation paths. Base values were installed by the central dictionary, then supplemental phase catalogs redefined the same paths with different wording. Runtime output therefore depended on script order rather than a single source of truth.

Affected surfaces included payroll approval messaging, Smart Reports search states, invoice labels, vehicle-analysis empty state, and recommendation navigation labels.

## Fix
- Kept the latest approved wording in the central dictionary.
- Removed the redundant shadow definitions from the supplemental Payroll and Smart Reports catalogs.
- No UI, calculations, queries, Supabase integration, or workflow values were changed.
