# PETATOE Phase 16.1 — Production Artifact Cleanup

## Root cause
Phase 16 correctly listed three obsolete production artifacts for deletion, but copying an overlay ZIP cannot remove pre-existing repository files. The files therefore remained in Git and the active production contract failed.

## Required deletions
- `index-css-control-test.html`
- `index-css-fontless-test.html`
- `maintenance/navigation-permissions.js`

## Verification
After deleting the three files from the cumulative Phase 16 state:

- Phase 16 production contract: PASSED
- Active enterprise contract suite: 31/31 PASSED

## Important interpretation
The check `No CSS test HTML artifacts are published at repository root` requires those test HTML files to be absent. Adding another CSS test page would make the production-cleanliness requirement worse, not fix it.
