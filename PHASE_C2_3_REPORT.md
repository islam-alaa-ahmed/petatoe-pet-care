# PETATOE v10.0.25 — Phase C2.3 Navigation Performance & Runtime Isolation

## Baseline
The working tree was reconstructed from the latest full PETATOE baseline, then overlaid with the approved C2.1-PWA and C2.2 modified files. KYUM was not modified.

## Confirmed root causes
1. The router changed the active panel and synchronously dispatched `petatoe:tabchange` in the same task. All subscribers could block the browser before the newly selected panel painted.
2. Repeated identical route requests could dispatch the same global event more than once within one interaction.
3. `runtime-ui-stabilization.js` destroyed charts belonging to hidden panels after every route change. Reopening those screens required chart recreation instead of reusing existing instances.
4. The liquid-glass runtime scanned dashboard controls and charts during unrelated route changes.
5. Two localization runtimes independently scheduled work for every route, without a shared route token or stale-task cancellation.

## Implemented changes
- Panel activation remains immediate, while the global route event is deferred to the next animation frame.
- Stale queued route events are cancelled and identical route events within 120 ms are deduplicated.
- Added route tokens and measurable `petatoe:routepainted` timing details.
- Hidden chart instances are preserved during normal navigation; cleanup is available on `pagehide` or through the explicit cleanup API.
- Liquid-glass enhancement is scoped to the active panel; dashboard chart/KPI work runs only on the dashboard.
- Active-screen localization passes cancel stale route work and run once per final route.
- Service Worker, cache tokens, runtime version, About screen, and certification lock synchronized to v10.0.25.

## Scope preserved
No changes were made to business logic, calculations, Supabase, SQL, permissions, visible UI text, desktop design, or navigation hierarchy.

## Verification
- JavaScript syntax: PASS
- Enterprise Localization Certification: PASS
- Production Localization Lockdown: PASS
- Runtime Translation Completion: PASS
- Smart Reports performance/readiness/public API/translation checks: PASS
- Mobile Enterprise UI v10: 61/61 PASS
- Static phase assertions: PASS

## Device verification still required
The perceived navigation improvement and exact route timings must be verified after GitHub Pages deployment on the user's iPhone PWA.
