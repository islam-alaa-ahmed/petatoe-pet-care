# PETATOE v10.0.16 — Phase R4 Root Cause Report

## Scope
Mobile startup dependency loading only. No business calculations, SQL, Supabase schema, permissions, security rules, or screen design were changed.

## Evidence from the real iPhone trace
- Sales records completed once: 3,033 rows / 4 pages / 2,794 ms.
- DOMContentLoaded was delayed until about 31.3 seconds.
- window.load occurred at about 55.5 seconds.
- Payroll requests started around 69.7 seconds and Treasury around 79.2 seconds.
- The trace recorded 44 network requests during startup/runtime observation.

## Confirmed Root Cause
`performance/mobile-startup-loading-gate.js` was not strictly lazy on mobile.

1. Its MutationObserver and `petatoe:tabchange` listener could hydrate feature groups while the initial document was still loading, allowing startup class/tab changes to load Operations before the dashboard startup had settled.
2. Its `window.load` handler deliberately waited 12 seconds and then automatically loaded Operations, Payroll, Treasury, Warehouses, and Children sequentially. This exactly explains the post-load Payroll and Treasury request waves recorded by the trace.
3. Those background groups performed their own Supabase reads even though the user had not opened those screens.

## Fix
- Block non-user tab/mutation hydration until `DOMContentLoaded`.
- Preserve direct pointer/file-input demand loading.
- Remove automatic post-load preloading of all heavy mobile feature groups.
- Keep `ensureGroup()` single-promise ownership so repeated user triggers cannot load the same group twice.

## Expected effect
Dashboard startup is no longer accompanied by premature Operations hydration or delayed automatic Payroll/Treasury/Warehouse/Children loading. Each heavy group loads only when its screen or related action is actually requested.
