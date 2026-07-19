# PETATOE v9.4.20 — Smart Reports Translation Stability & Performance Certification

## Confirmed issue
The prior Smart Reports language runtime deferred the complete localization pass with `requestAnimationFrame`. Newly rendered Arabic templates could therefore be painted before the English localization pass. Rapid language or tab events could also queue competing updates.

## Implemented correction
- Text nodes and translatable attributes in the visible Smart Reports tab are now localized synchronously in the same event turn.
- Chart labels remain deferred because canvas updates are heavier, but only one pending chart frame is allowed and stale revisions are rejected.
- The runtime remains scoped to the visible report tab.
- No report renderer, data loader, calculation-cache clear, or DOM observer was introduced.
- Business display localization now resolves the active language through `PETATOE_LOCALIZATION_CENTER`, then the approved global translator fallback.

## Performance protection
The following prohibited paths are covered by the new CI validator:
- `renderSmartReports()` from the language runtime.
- Smart Reports calculation-cache clearing on language change.
- `MutationObserver` inside the Smart Reports stability runtime.
- Legacy `PETATOE_I18N` calls in business display localization.

## Validation results
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Fast Runtime: PASSED — 9/9
- Smart Reports Fast Readiness Path: PASSED — 6/6
- Smart Reports Public API: PASSED — 6/6
- Smart Reports Translation Stability: PASSED — 10/10
- JavaScript syntax: 285 passed / 0 failed

## Files changed
- `.github/workflows/localization-lockdown.yml`
- `RELEASE_VERSION.txt`
- `index.html`
- `i18n/localization-center/business-data.js`
- `i18n/localization-center/runtime.js`
- `smart/smart-language-runtime.js`
- `scripts/enterprise-localization-certification-check.js`
- `scripts/localization-production-lockdown-check.js`
- `scripts/runtime-translation-completion-check.js`
- `scripts/smart-reports-public-api-check.js`
- `scripts/smart-reports-translation-stability-check.js`
