# PETATOE v10.0.12 — Runtime Ownership P2.5 Root Cause Report

## Scope
Mobile-only startup ownership audit. No business logic, Supabase, SQL, permissions, security, desktop, or tablet behavior was changed.

## Confirmed Root Cause
The mobile startup path still loaded multiple runtime audit, shadow ownership validation, localization pilot, settings audit, and observability modules before the user opened any diagnostic screen.

These modules inspect or report the active runtime; they are not required to establish authentication, render the mobile shell, open the dashboard, or navigate normal business screens. Loading them during startup added parsing, initialization, listeners, and audit work to the mobile main thread.

## Proven Ownership Split
- Active runtime owners retained in startup: router controller, route registry, navigation controller, module registry/ownership foundations, business modules, authentication, localization runtime, and mobile shell.
- Diagnostic owners moved behind the mobile diagnostics gate: five module ownership validators, four router/finalization audits, enterprise baseline audit, settings audit, two localization pilots, i18n audit, and enterprise observability.

## Fix
Fifteen diagnostic-only scripts (113,812 local bytes) are registered in the existing mobile startup gate under the `diagnostics` group. They load sequentially when an audit/diagnostics/observability control is opened. Desktop keeps the original parser order through `document.write`.

No source file was deleted.
