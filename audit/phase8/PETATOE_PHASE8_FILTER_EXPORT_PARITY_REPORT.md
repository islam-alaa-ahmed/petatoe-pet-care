# PETATOE Phase 8 — Filter & Export Parity

## Scope
This phase aligns the exported dataset with the currently displayed filters for confirmed mismatches only. It does not change calculations, Supabase queries, stored data, permissions, or visual layout.

## Root causes
- Treasury movement table filtered `allMovements()` locally, while CSV exported `allMovements()` directly.
- Treasury statement view applied date/search filters locally, while CSV exported `statementRows(src)` directly.
- Warehouse movement table filtered `movementRows()` locally, while CSV exported `movementRows()` directly.
- Warehouse low-stock table filtered `rowsAll()` locally, while CSV exported `rowsAll()` directly.
- Obligations history table filtered `arr()` locally, while Excel exported `arr()` directly.

## Fix
Each affected report now owns a single filtered-row function used by both rendering and export:
- Treasury: `filteredMovementRows()` and `filteredStatementRows(src)`.
- Warehouses: `filteredMovementRows()` and low-stock `filteredRows()`.
- Obligations: `filteredHistoryRows()`.

## Behavior preserved
- Existing sorting order.
- Existing 500-row display cap for the Treasury table only. Export receives the complete filtered set, not the visual cap.
- Existing CSV/Excel columns and file names.
- Existing calculations, storage, Supabase reads/writes, and permissions.

## Regression validation
- Phase 8 parity check: 12/12 passed.
- Phase 7 readiness: 12/12 passed.
- Phase 6 navigation: 14/14 passed.
- Phase 5 sales runtime: 15/15 passed.
- Phase 4 Customer 360: 12/12 passed.
- Phase 3 Smart Reports ownership: 12/12 passed.
- Phase 2 canonical data ownership: 9/9 passed.
- Startup Gate single source: passed.
- Version single source: passed.
- Runtime translation completion: passed.
- JavaScript/MJS syntax: 405 files passed.

## Browser UAT required after deployment
For each affected screen, apply a filter that excludes known rows, verify the visible count, export, and confirm the exported rows and totals match the filtered screen:
1. Treasury movements: search, vehicle/vault, movement type.
2. Treasury statement: from date, to date, search.
3. Warehouse movements: search, store, movement type.
4. Warehouse low-stock alerts: search, store, alert level.
5. Obligations history: search, status, type.
