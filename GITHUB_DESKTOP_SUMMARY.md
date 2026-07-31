# GitHub Desktop Summary

## Commit title
`feat: add startup runtime error attribution diagnostics`

## Summary
- Attribute lazy script network failures to the exact group and source file.
- Capture synchronous runtime errors and immediate unhandled rejections during script execution.
- Distinguish loading, executing, loaded, failed, and provider-contract phases.
- Preserve failed script, last loaded script, readiness snapshot, line, column, and stack metadata.
- Expose bounded diagnostics through `PETATOEMobileStartupGate.getRuntimeDiagnostics()` and `snapshot()`.
- Update release/cache certification locks to SG-4.5.

## Scope exclusions
No business logic, loading order, readiness requirements, UI, localization, Supabase, SQL, or permissions behavior was changed.
