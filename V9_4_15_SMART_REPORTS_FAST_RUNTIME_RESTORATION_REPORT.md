# PETATOE v9.4.15 — Smart Reports Fast Runtime Restoration

## Confirmed root cause

The current runtime added multiple layers that did not exist in the older fast build:

- a render queue and in-flight lock around `renderSmartReports()`;
- a data-readiness retry guard with a 30-second window;
- repeated Smart Reports root localization passes;
- generic mutation/residual translation scans over the large Smart Reports DOM.

These layers caused delayed first-open behavior, repeated work, blank/late charts, and browser `Page Unresponsive` warnings.

## Implemented correction

- Restored the stable baseline router: one canonical full render, then local active-tab renders.
- Removed the readiness guard script from `index.html`.
- Removed Localization Center `.apply()` from each Smart Reports fragment insertion.
- Excluded `#smartReportsArea` from generic localization observers and residual scans.
- Preserved direct canonical translation key resolution inside Smart Reports builders.

## Validation

- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Fast Runtime: 9/9 PASSED
- Smart Reports Fast Readiness Path: 6/6 PASSED
- JavaScript syntax: 281 passed / 0 failed
- Arabic entries: 3,427
- English entries: 3,427
- Missing counterparts: 0
- Legacy localization calls: 0
