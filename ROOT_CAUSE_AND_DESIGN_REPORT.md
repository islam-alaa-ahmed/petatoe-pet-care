# Phase P1.2 — Root Cause & Design Report

## Baseline
`petatoe-pet-care-main (10).zip` with the previously delivered F1, localization-version-gate, and P1.1 overlays applied in sequence.

## Root Cause
The project already contained diagnostics and runtime-hardening modules, but it had no unified, bounded observability layer that could correlate startup timing, network latency, duplicate requests, screen transitions, browser memory samples, and unhandled JavaScript failures in one runtime snapshot.

Production performance problems therefore had to be diagnosed manually from isolated browser logs, without a consistent exportable record.

## Implemented Design
A new isolated module was added:

`diagnostics/enterprise-observability.js`

It provides:

- Startup marks: script start, DOM ready, first frame, user ready, dashboard interactive, startup settled.
- Network profiling by wrapping the existing `fetch` function without changing request payloads or responses.
- Counters for failed, slow, and closely repeated requests.
- Bounded storage: maximum 100 records per monitored category.
- Screen transition sampling using a debounced `MutationObserver`.
- Global error and unhandled-promise-rejection capture.
- Browser heap sampling when `performance.memory` is supported.
- Exportable JSON runtime snapshot.
- An internal dashboard available to privileged users through `Ctrl+Shift+P`, or explicitly through `?petatoe_observability=1` for controlled diagnostics.

## Isolation and Safety
No business calculations, Supabase schema, SQL, payroll workflow, commission workflow, permissions, MFA, or session rules were changed.

The module does not transmit diagnostics externally. Data remains in the current browser memory and is cleared when the page closes.
