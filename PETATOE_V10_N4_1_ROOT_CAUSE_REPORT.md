# PETATOE v10 N4.1 — Root Cause Report

## Confirmed failure

The `Native iOS Certification` workflow failed inside `actions/setup-node@v4` before any PETATOE certification command ran.

## Root cause

The workflow enabled npm dependency caching with `cache: 'npm'`, but the repository did not contain a supported dependency lock file (`package-lock.json`, `npm-shrinkwrap.json`, or `yarn.lock`). `setup-node` therefore terminated the job while attempting to resolve the npm cache key.

## Responsible file

`.github/workflows/native-ios-certification.yml`

## Responsible configuration

Both Node setup steps contained:

```yaml
cache: 'npm'
```

Both jobs also used `npm ci`, which requires a lock file.

## Impact

- `static-certification` stopped before `npm run native:certify`.
- `ios-simulator-build` was skipped because it depends on `static-certification`.
- The failure did not prove any defect in the Swift plugins, Face ID layer, Keychain layer, or certification script.

## Applied correction

Until a committed npm lock file is introduced, npm caching is disabled and `npm ci` is replaced with `npm install --no-audit --no-fund` in both jobs. This matches the repository's current dependency-management state and allows the certification jobs to proceed.
