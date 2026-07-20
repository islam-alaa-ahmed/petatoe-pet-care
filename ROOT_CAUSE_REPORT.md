# Root Cause Report — Phase A3.4 Payroll Localization

## Root Cause
The Payroll module already used the central `payrollRuntime` dictionary for most UI content, but several workflow actions still emitted direct Arabic strings. The read-only payroll view-model facade also returned Arabic status, payment, fallback, and KPI labels directly.

## Responsible Areas
- `payroll/payroll-core.js`: direct workflow/toast/confirmation messages in job management, slip deletion, employee approval, and employee objection actions.
- `payroll/payroll-view-model-facade.js`: direct Arabic display labels used by dashboard/report view models.

## Impact
When English was active, these paths could expose Arabic text or depend on runtime phrase replacement after rendering, causing mixed-language UI and preventing source-level localization lock.

## Fix
- Routed remaining user-facing Payroll workflow messages through `payrollT(...)`.
- Added bilingual keys in a dedicated Phase A3.4 payroll catalog.
- Added localization lookup to the read-only view-model facade.
- Preserved all internal status codes and stored job/employee/payroll values.
