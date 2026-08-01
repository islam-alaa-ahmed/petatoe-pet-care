# PETATOE Phase 0 — Baseline & Regression Infrastructure

## Official baseline

`petatoe-pet-care-main (34).zip`

This phase adds audit and regression infrastructure only. It does not change application business logic, UI, calculations, routes, data queries, Supabase operations, or runtime ownership.

## Baseline inventory

- Total original files: 841
- Total original bytes: 15,594,573
- JavaScript and MJS files: 385
- CSS files: 41
- HTML files: 5
- External script references in `index.html`: 119
- Stylesheet references in `index.html`: 18
- Duplicate IDs in `index.html`: 0
- Missing local script references: 0
- Missing local stylesheet references: 0

## Infrastructure added

### `scripts/phase0-generate-baseline-manifest.js`

Generates a SHA-256 inventory of the official baseline and records:

- File path, size, extension and SHA-256.
- JavaScript load order from `index.html`.
- CSS load order from `index.html`.
- Missing local references.
- Duplicate HTML IDs.
- Candidate development or test artifacts present in the production tree.

### `scripts/phase0-regression-guard.js`

Compares the current repository against the official baseline manifest and fails on:

- Missing baseline files not declared as intentional deletions.
- Content changes not declared in an allow-list.
- Missing local scripts or stylesheets.
- Duplicate external script or stylesheet references.
- Duplicate IDs inside `index.html`.

Intentional changes can be declared with:

```bash
node scripts/phase0-regression-guard.js --allow=path/to/file.js
```

or through a newline-delimited allow-list:

```bash
node scripts/phase0-regression-guard.js --allow-file changed-files.txt
```

### `scripts/phase0-regression-matrix.json`

Defines the permanent minimum regression coverage for:

- Authentication and sessions.
- Navigation and operations screen identity.
- Smart Reports tabs, filters and actions.
- Customer 360 and sales invoices.
- Data, filter and export parity.
- Sales, commissions, payroll, treasury, warehouses and obligations.
- Permissions, localization, visual modes, PWA, security and console errors.

## Production artifact findings

The baseline still contains development artifacts. They were not deleted in Phase 0 because deletion must be reviewed and allow-listed separately.

Confirmed high-priority candidates:

- `index-css-control-test.html`
- `index-css-fontless-test.html`
- Historical verification and audit reports in the repository root.
- Numerous historical GitHub Desktop summary files.

The generated production artifact audit contains the complete candidate list.

## Verification

- Phase 0 baseline generator: PASSED
- Phase 0 regression guard: PASSED
- Duplicate IDs: PASSED
- Local script references: PASSED
- Local stylesheet references: PASSED
- JavaScript/MJS syntax for the entire repository: PASSED
- Application production files modified: 0

## Impact assessment

This phase is non-functional infrastructure. Existing application files are unchanged, so it cannot alter:

- Displayed data.
- Filters or exports.
- Buttons and event handlers.
- Calculations.
- Supabase reads or writes.
- Runtime loading order.
- CSS cascade.

Future phases must run the regression guard with an explicit changed-file allow-list before delivery.

## Next phase

`Phase 0.5 — Supabase Schema, RLS & Migration Verification`

This phase will verify the deployed database contract without running historical SQL files blindly.
