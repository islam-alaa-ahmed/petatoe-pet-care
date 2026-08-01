# PETATOE Phase 1B — Automated Version Synchronization Report

## Scope

Phase 1B activates controlled synchronization from `config/petatoe-version.json` without changing business logic, report calculations, data access, CSS, navigation behavior, or runtime compatibility contracts.

## Canonical values

- Release version: `10.0.25`
- Release label: `v10.0.25`
- Cache version: `10.0.25-sg4-7-6-smart-reports-consolidated-regression-1`
- Startup Gate runtime contract: `10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1`

The cache version and runtime contract remain intentionally independent.

## Changes

1. `runtime/version-manifest.js` is loaded before the Startup Gate.
2. `service-worker.js` cache namespace and Startup Gate APP_SHELL URL are synchronized to the canonical cache version.
3. The Startup Gate, Smart Router, and Smart Reports Runtime Controller cache tokens in `index.html` are synchronized.
4. Release globals remain generated from the canonical release fields.
5. The synchronization script now supports deterministic preview and `--write` modes.
6. Active CI certification reads cache and runtime-contract values from the central manifest instead of hard-coded literals.
7. GitHub Actions runs the version single-source gate before the remaining certification suite.

## Validation

- Phase 1B synchronization: 12/12 PASSED
- Version single-source strict audit: PASSED
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Fast Runtime: PASSED
- Smart Reports Fast Readiness: PASSED
- Smart Reports Public API: PASSED
- Smart Reports Translation Stability: 11/11 PASSED
- Mobile Enterprise UI v10: 61/61 PASSED
- Startup Gate Single Source: PASSED
- Runtime Readiness Contract: 9/9 PASSED
- Data-ready Screen Hydration: 13/13 PASSED
- Smart Reports Single Controller: 9/9 PASSED
- Smart Reports Event Ownership: 7/7 PASSED
- JavaScript/MJS syntax validation: PASSED for all files

## Regression controls

- Startup Gate runtime contract was not changed.
- No business logic, data, filters, report calculations, CSS, or user-visible localization text changed.
- Synchronization preview is idempotent and reports no drift after write.
- Existing component-specific compatibility tokens were not mass-replaced; only the centrally governed release/cache locations were migrated in this phase.

## Browser validation limitation

Static PWA cache contracts and certification checks passed. Cold-cache, warm-cache, and fully offline behavior still require live browser/PWA UAT after deployment; this phase does not claim that a real Service Worker session was executed in the container.
