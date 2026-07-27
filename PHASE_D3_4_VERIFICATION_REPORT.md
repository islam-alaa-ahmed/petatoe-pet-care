# PETATOE Phase D3.4 — Mobile Root Dependency Trace

## Scope
Diagnostic instrumentation only. No business logic, Supabase, authentication, permissions, navigation behavior, styling, or release version changes.

## Root-cause observation that shaped the trace
`#petV10MobileRoot` is static markup in `index.html`; it is not normally created by an auth/permissions/dashboard callback. Therefore the decisive question is whether the HTML parser is delayed before reaching the body/root markup, and what the mobile shell sees when it evaluates.

## Added evidence
- Parser checkpoints: profiler loaded, end of head, body start, static root parsed, mobile shell completed.
- Mobile root call/creation trace with stack snippets.
- Dependency snapshots at every checkpoint: document state, body/root availability, device profile, startup gate, auth, localization, navigation schema, and runtime coordinator.
- Existing report export now includes `parserCheckpoints`, `mobileRootTrace`, and `dependencySnapshots`.

## Verification
- `node --check performance/startup-clean-profiler.js`: PASS
- `node --check mobile/mobile-enterprise-v10-shell.js`: PASS
- Existing release number/name unchanged.
- No new user-visible text added; localization dictionary change not required.
