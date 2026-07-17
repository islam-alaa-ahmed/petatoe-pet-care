# PETATOE v9.4.7 — Navigation & Language Performance

## Confirmed root causes

1. The primary i18n runtime and the Global Screen Translator could both react to DOM changes, causing overlapping translation work.
2. Language switching reapplied automatic translations across the full document instead of limiting work to the persistent shell and active screen.
3. Dynamic DOM roots were queued in an array without ancestor/descendant deduplication, so the same subtree could be processed more than once per frame.
4. Dashboard, Smart Reports and Payroll could rerender on every language change even while their panels were hidden.
5. Residual English cleanup used repeated active-surface scans and retry cycles after render events.

## Implemented corrections

- Kept one primary MutationObserver in `i18n/index.js`.
- Converted Global Screen Translator into a passive residual fallback without installing a second observer.
- Changed language reapply to process persistent shell and active visible surfaces only.
- Added Set-based subtree queue deduplication and ancestor collapsing.
- Guarded Dashboard, Smart Reports and Payroll rerenders by active-panel state.
- Replaced repeated residual retry scans with one deferred visible-surface pass.
- Synchronized release/runtime/cache metadata to v9.4.7.

## Static verification

- Performance architecture checks: 11/11 passed.
- JavaScript syntax checks: 274 files passed, 0 failures.
- Browser runtime timing still requires testing on the deployed project with production data.
