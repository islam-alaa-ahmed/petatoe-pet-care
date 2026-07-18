# PETATOE v9.4.14 — Smart Reports Data Readiness Recovery

## Root causes corrected

1. The v9.4.13 readiness guard reduced the retry window to eight attempts, allowing a slow authenticated data hydration to be treated as no data.
2. The render router marked Smart Reports as bootstrapped immediately after a full render attempt, even if the result was loading or empty.
3. The router directly rendered tab charts before the canonical tab controller made their sections visible, producing zero-size/blank Chart.js canvases and duplicate work.

## Safeguards

- Last-known-good rows and dashboard remain visible during refresh.
- Empty state is allowed only after the full readiness window returns a confirmed empty source.
- Bootstrapping requires real rows and a valid Smart Reports DOM.
- Lazy tab rendering runs through `setSmartTab()` after visibility changes.
- Existing render and localization batching remains enabled.
