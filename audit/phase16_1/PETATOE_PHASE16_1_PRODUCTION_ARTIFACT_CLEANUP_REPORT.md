# PETATOE Phase 16.1 — Production Artifact Cleanup

This corrective package removes three obsolete production artifacts that remained after Phase 16 because copying a ZIP over an existing repository does not delete old files.

Deleted paths:
- `index-css-control-test.html`
- `index-css-fontless-test.html`
- `maintenance/navigation-permissions.js`

The package now includes `scripts/phase16-production-contract-check.js` and the cleanup script restores it into the repository when missing, then runs the contract check.
