# PETATOE v10.0.25 — Phase SR1
## Smart Reports State Machine Recovery

### Scope
Readiness state-machine correction only. No report calculations, Supabase queries, SQL, permissions, payroll logic, or UI design were changed.

### Confirmed root causes addressed
1. A failed/not-ready group stored a resolved false Promise in `states[name].promise`, causing every later attempt to reuse the stale failure.
2. Mobile group loading treated successful `<script onload>` as runtime readiness without checking provider contracts.
3. Mobile lazy click replay executed even when `ensureGroup()` resolved `false`.
4. Runtime readiness errors did not expose the individual missing provider conditions.

### Changes
- `performance/mobile-startup-loading-gate.js`
  - Failed readiness is retryable; stale false Promises are cleared.
  - Mobile script loading is followed by provider-contract verification.
  - Added detailed readiness snapshots and group status API.
  - Added group invalidation/recovery API and provider-ready event recovery.
  - Lazy click replay now runs only after readiness resolves `true`.
- `smart/smart-reports-runtime-controller.js`
  - Reports detailed failed readiness conditions.
  - Exposes `PETATOESmartReportsRuntimeStatus()` for runtime inspection.
- `index.html`
  - Updated cache tokens for the modified gate and runtime controller.
- `scripts/startup-gate-single-source-check.js`
  - Updated version expectation and added regression checks for retryable state and provider verification.

### Verification
- JavaScript syntax: PASSED
- Startup Gate Single Source Certification: PASSED
- Runtime Readiness Contract: 9/9 PASSED
- Data-ready Hydration Contract: 10/10 PASSED
- Mobile Enterprise UI v10: 61/61 PASSED
- Enterprise Localization Certification: PASSED
- Runtime Translation Completion: PASSED

### Live validation required
Open Smart Reports during the top-bar `Loading` state. If readiness fails initially, a subsequent open/refresh must perform a fresh readiness attempt rather than reusing the first failure. Use:

```js
PETATOESmartReportsRuntimeStatus()
```

to identify any remaining missing provider precisely.
