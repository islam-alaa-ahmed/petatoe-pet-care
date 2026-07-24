# PETATOE v10.0.17 — Core Bootstrap Split R5

## Confirmed runtime evidence
The v10.0.16 iPhone trace showed that sales loading completed once in about 3.4 seconds for 3,033 rows, while `DOMContentLoaded` did not occur until about 25.8 seconds and `load` until about 28.5 seconds. Payroll and Treasury were already removed from startup, but non-critical setup, obligations, fleet, movement-center, and remote localization parity modules were still parser-loaded during the initial document bootstrap.

## Root cause
`index.html` still loaded several non-dashboard business modules through normal parser-blocking `<script src>` elements. On mobile Safari, every such file had to be downloaded, parsed, and evaluated before document parsing could finish. Their initialization paths also started Supabase reads for `operations_master_data`, `system_settings`, and `get_localization_bundle` before first interactive startup completed.

## Scope of the fix
Only mobile startup ownership was changed:

- Fleet module: demand-loaded when Fleet is opened.
- Movement Center module: demand-loaded when its screen is opened.
- Obligations module: demand-loaded when Obligations is opened.
- Settings Setup module: demand-loaded when Settings/Setup is opened.
- Supabase localization parity loader: deferred until after `window.load` and an idle slot. The local canonical dictionary remains the first-paint localization source.

Desktop keeps the previous synchronous script order through `registerOrWrite()` desktop behavior.

## Excluded from change
No business calculations, SQL, Supabase schema, permissions, authentication, security policy, report formulas, sales queries, dashboard calculations, or UI design were changed.
