# Phase SR5.3 — Smart Reports Refresh De-duplication

## Root Cause
The Smart Reports controller serialized requests, but repeated refresh actions arriving while a remote refresh was active could still create another queued request with `forceRemote=true`. After the active request completed, the queued request could perform a second Supabase refresh and a second render for the same user action window.

## Scope
Only Smart Reports refresh request ownership and in-flight de-duplication were changed. No Supabase query, report calculation, payroll logic, authentication, permissions, localization text, UI, release version, or bootstrap order was changed.

## Implementation
- Added explicit `activeRequest` ownership.
- Added one shared `remoteRefreshPromise` for the current remote refresh cycle.
- Repeated refresh actions now join the active refresh promise instead of queuing another Supabase request.
- A duplicate queued remote refresh is coalesced into the existing request.
- The remote lock is always released through `finally` after success or failure.
- Added diagnostics:
  - `activeRemoteRefresh`
  - `remoteRefreshInFlight`
  - `remoteRefreshCount`
  - `coalescedRefreshCount`

## Verification
- JavaScript syntax check: PASSED.
- Refresh de-duplication static contract: PASSED (9/9).
- Refresh de-duplication runtime test: PASSED.
  - 3 concurrent refresh calls.
  - 1 remote Supabase bridge call.
  - 1 Smart Reports render.
  - 2 refresh calls coalesced.
- Idempotent canonical commit certification: PASSED (8/8).
- Smart Reports event ownership certification: PASSED (7/7).

## Runtime Acceptance Test
After deployment:
1. Open Smart Reports from a cold start.
2. Press Refresh repeatedly before the first refresh finishes.
3. Confirm the reports render once when the refresh completes.
4. Run `PETATOESmartReportsRuntime.getStatus()` in the console.
5. Confirm `remoteRefreshCount` increases once for that cycle and `coalescedRefreshCount` records the extra clicks.
6. Confirm there are no runtime errors and all tabs remain functional.
