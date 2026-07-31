# PETATOE Module Ownership Matrix — SG-4.6

This file documents ownership only. It does not change business logic.

| Module | Canonical Route | Navigation Owner | Lazy Group | Runtime Owner | Panel Owner | Permission Key |
|---|---|---|---|---|---|---|
| Fleet Management | `fleet` | `navigation/navigation.js` | `fleet` | `inline-extracted/fleet-inline.js` (`PETATOEFleet`) | Fleet runtime (`#fleet`) | `vehicles` |
| Vehicle Operations | `vehicleOperations` | `navigation/navigation.js` | `operations` | Operations runtime | Static `#vehicleOperations` | `vehicleOperations` |
| Smart Reports | `smart` | `navigation/navigation.js` | `smartReports` | `smart/smart-reports-runtime-controller.js` | Static `#smart` | `reports` |
| Operations / Appointments | `appointments` | `navigation/navigation.js` | `operations` | `inline-extracted/appointments-core.js` (`PETATOEAppointments`) | Static `#appointments` | `appointments` |
| Children Expenses | `childrenExpenses` | `navigation/navigation.js` | `children` | `inline-extracted/children-expenses-core.js` (`PETATOEChildrenExpenses`) | Static `#childrenExpenses` | `childrenExpenses` |
| Commissions | `commissions` | `navigation/navigation.js` | `commission` | `PETATOECommissionRuntime` | Commission bootstrap | `commissions` |

## Fleet ownership rules

1. `fleet` is a dedicated canonical route and is not an alias of `vehicleOperations`.
2. Only `navigation/navigation.js` may create or bind the Fleet navigation button.
3. `fleet-inline.js` owns runtime rendering and the dynamic `#fleet` panel only.
4. Startup Gate maps `fleet` exclusively to the `fleet` lazy group.


## SG-4.3 Smart Reports ownership

- Lifecycle/Open/Refresh/Data synchronization owner: `smart/smart-reports-runtime-controller.js`.
- Stable synchronous dashboard/body render bridge owner: `smart/smart-router.js` through `window.renderSmartReports` and `PETATOESmartReportsRenderEngine`.
- `smart-router.js` does not own open, refresh, readiness, remote synchronization, or navigation lifecycle.
- Tab rendering owner: `smart/smart-tabs.js` through `PETATOESmartTabs`.
- Compatibility globals `PETATOEOpenSmartReports` and `PETATOESmartReportsRefresh` delegate only to the canonical runtime.
- Navigation state restoration delegates to `PETATOESmartReportsRuntime.activateTab()`.


## SG-4.6 Operations and Children ownership

### Operations
- Canonical public runtime owner: `inline-extracted/appointments-core.js` through `window.PETATOEAppointments`.
- Legacy implementation owner: `operations/operations-legacy-engine.js` through `window.__PETATOEAppointmentsLegacyEngine` only.
- The legacy engine must never assign `window.PETATOEAppointments`.
- Controlled migration may wrap the canonical facade but must preserve its `__owner` marker and delegate through the canonical API.
- Startup readiness is based on the canonical facade plus the quarantined legacy engine and extracted Operations providers.

### Children Expenses
- Canonical public runtime owner: `inline-extracted/children-expenses-core.js` through `window.PETATOEChildrenExpenses`.
- Legacy implementation owner: `children-expenses/children-legacy-engine.js` through `window.__PETATOEChildrenExpensesLegacyEngine` only.
- The legacy engine must never assign `window.PETATOEChildrenExpenses`.
- Controlled migration may wrap the canonical facade but must preserve its `__owner` marker and delegate through the canonical API.
- Startup readiness is based on the canonical facade plus the quarantined legacy engine.
