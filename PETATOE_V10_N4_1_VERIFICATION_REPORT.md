# PETATOE v10 N4.1 — Verification Report

## Static verification performed

- Confirmed that no `cache: 'npm'` declaration remains in the workflow.
- Confirmed that no `npm ci` command remains in the workflow.
- Confirmed that both jobs install dependencies with `npm install --no-audit --no-fund`.
- Confirmed that Node.js remains pinned to version 22.
- Confirmed that the workflow still runs `npm run native:certify`.
- Confirmed that the macOS job still performs the unsigned iOS Simulator build.
- Confirmed that Pages deployment files and application business logic were not modified.

## Expected result after push

1. `actions/setup-node@v4` completes without requiring a lock file for cache resolution.
2. Dependencies are installed in both jobs.
3. `static-certification` proceeds to the PETATOE certification script.
4. If static certification passes, `ios-simulator-build` starts.

## Remaining external verification

The final status must be confirmed by the next GitHub Actions run. This package does not claim that the remote workflow has passed before it is pushed and executed on GitHub.
