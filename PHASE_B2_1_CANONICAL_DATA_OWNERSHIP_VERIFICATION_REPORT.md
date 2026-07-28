# Phase B2.1 — Canonical Data Ownership Correction

- Smart Reports now has one lifecycle owner: `smart/smart-reports-open-refresh-guard.js`.
- Readiness is measured against legacy `records`, the exact source consumed by `smartData()`.
- Supabase refresh commits DataSource rows to legacy records before render.
- The B2 hydration bridge is payroll-only.
- Payroll exposes a stable `whenSupabaseReady()` promise and renders requested views after data readiness.
- No calculations, Supabase queries, permissions, or business rules were changed.
