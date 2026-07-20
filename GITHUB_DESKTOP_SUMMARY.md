# GitHub Desktop Summary

## Summary

Prevent startup Arabic/English translation flash by replacing the fixed first-paint timeout with a deterministic localization readiness coordinator. Add explicit i18n bindings to stable Application Shell elements and add a production-gate startup test.

## Suggested Commit Title

`fix(i18n): eliminate startup translation flash race`

## Suggested Commit Description

- replace the 1.5s i18n boot failsafe with deterministic engine readiness
- record successful versus degraded startup reveal states
- apply persisted language and direction before first paint
- add explicit topbar and global-search translation bindings
- add startup first-paint localization production gate
- keep business logic, Supabase, calculations, and report rendering unchanged
