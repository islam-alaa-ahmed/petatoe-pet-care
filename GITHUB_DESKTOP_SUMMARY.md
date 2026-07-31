# GitHub Desktop Summary

## Commit title
fix: align Smart Reports public API certification with SG-4.3 runtime ownership

## Summary
- Validate the stable Smart Reports public API from the canonical runtime controller.
- Confirm legacy globals delegate to `PETATOESmartReportsRuntime`.
- Reject duplicate public API ownership from `smart-router.js`.
- Synchronize Smart Reports cache-token checks with `service-worker.js` `APP_VERSION`.
- Preserve the SG-4.3 Single Runtime Owner architecture.

## Modified files
- `scripts/smart-reports-public-api-check.js`
