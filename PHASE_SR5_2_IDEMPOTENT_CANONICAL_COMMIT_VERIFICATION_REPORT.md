# Phase SR5.2 — Idempotent Canonical Commit

## Root Cause
The canonical sales bridge could normalize and commit the same runtime dataset repeatedly. Each repeated commit could emit `petatoe:sales-records-committed`, while the Smart Reports controller had no revision memory and could schedule another render for an already-rendered dataset.

## Scope
Only Smart Reports sales commit de-duplication was changed. No Supabase query, report calculation, payroll logic, authentication, permission, localization text, UI, release version, or bootstrap order was changed.

## Implementation
- Added a deterministic revision for normalized sales rows.
- Added a canonical commit state with revision and sequence.
- Suppressed duplicate commits and duplicate commit events for an unchanged revision.
- Added revision and sequence to the committed event payload and source status.
- Added `lastRenderedRevision` to the Smart Reports controller.
- Ignored committed events whose revision has already been rendered.

## Verification
- JavaScript syntax checks: PASSED.
- Smart Reports event ownership certification: PASSED (7/7).
- Smart Reports idempotent commit certification: PASSED (8/8).

## Runtime Acceptance Test
After deployment, verify from a cold start:
1. Smart Reports opens normally.
2. One refresh produces one remote request, one canonical commit sequence increment, and one report render.
3. Re-emitting the same cached rows does not increment the commit sequence or render count.
4. A genuinely changed dataset creates a new revision and renders once.
