# PETATOE v10.0.8 — Mobile Startup Loading Gate P2.1

## Scope
Mobile-only startup loading optimization. Desktop loading order, business logic, Supabase schema, SQL, calculations, permissions, and security rules were not changed.

## Confirmed Root Cause

The production `index.html` directly requested 247 external JavaScript assets during parsing/startup. Heavy independent modules were loaded before the user opened their screens:

- Operations and appointments
- Payroll
- Treasury
- Warehouses
- Children expenses
- XLSX Excel runtime

These modules added approximately 990 KB of local JavaScript, excluding the external XLSX library, to the initial mobile startup path. Their initialization also installed screen-specific listeners and rendering work before those screens were needed.

The existing lazy-loading files did not prevent the original script tags from loading, so they acted as monitoring/readiness layers rather than a real loading gate.

## Files Responsible

- `index.html`: direct parser/startup script loading.
- `components/inline-handler-adapter.js`: assumed every module API was already available synchronously.
- Heavy module folders: `operations/`, `payroll/`, `treasury/`, `warehouses/`, and `children-expenses/`.
- External XLSX CDN reference: loaded before import/export was requested.

## Implemented Minimal Fix

A mobile-only startup gate was added:

- Desktop continues to receive the original scripts in their original parser order through `document.write` during parsing.
- Mobile registers selected scripts without downloading them at startup.
- A group is loaded sequentially when its panel is opened, when a related inline module action is invoked, or when Excel import/export is requested.
- A delayed idle fallback loads remaining groups gradually after startup to preserve compatibility with background integrations.
- After loading, the active panel is refreshed using its existing public API and `petatoe:tabchange` contract.

## Deferred Mobile Groups

| Group | Scripts | Local size removed from initial startup |
|---|---:|---:|
| Operations | 23 | 443.7 KB |
| Payroll | 8 | 173.0 KB |
| Warehouses | 10 | 142.3 KB |
| Children expenses | 13 | 104.7 KB |
| Treasury | 7 | 103.4 KB |
| XLSX | 1 external asset | CDN runtime deferred |
| **Total** | **62** | **990,318 bytes + XLSX CDN** |

## Runtime Impact

- Direct external scripts in the initial HTML path reduced from approximately 247 to 185 on mobile.
- Desktop behavior is preserved by writing the original tags at the same parser positions.
- No module source file or business calculation was rewritten.
