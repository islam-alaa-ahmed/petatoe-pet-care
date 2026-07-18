# PETATOE v9.4.13 — Smart Reports Render & Localization Performance

## Root Cause
Smart Reports refresh/navigation could trigger overlapping full renders. Every large DOM rebuild also activated the primary localization observer and residual translator, while individual Smart Reports fragments applied localization repeatedly. The refresh guard additionally retried up to 30 times and restored the active tab twice.

## Implementation
- Added requestAnimationFrame render coalescing and an in-flight render lock.
- Queued only the latest requested Smart Reports tab during an active render.
- Preserved local tab routing after the first full bootstrap.
- Suspended localization mutation observers during Smart Reports DOM construction.
- Applied localization to the Smart Reports root once after each completed render.
- Suppressed per-fragment localization while a batched Smart Reports render is active.
- Reduced data-readiness retries from 30 to 8.
- Removed the duplicate delayed active-tab restoration.
- Added a CI regression validator for the performance architecture.

## Validation
- Smart Reports Render Performance: PASSED (9/9)
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Key Resolution: PASSED
- JavaScript syntax: 280 passed / 0 failed
- Arabic entries: 3,427
- English entries: 3,427
- Missing counterparts: 0
- Legacy direct calls: 0

## Runtime Note
Browser-level timing and the absence of the Page Unresponsive dialog must be confirmed after deploying these files against the live dataset. The included runtime API `PETATOESmartRenderPerformance.stats()` exposes recent render timings and render state.
