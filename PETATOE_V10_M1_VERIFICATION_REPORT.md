# PETATOE Mobile Enterprise UI v10 — M1 Verification

## Files
- Modified: `index.html`
- Modified: `service-worker.js`
- New: `css/mobile/mobile-enterprise-v10-shell.css`
- New: `mobile/mobile-enterprise-v10-shell.js`

## Checks
- `node --check mobile/mobile-enterprise-v10-shell.js`: PASS
- `node --check service-worker.js`: PASS
- CSS brace balance: PASS (49/49)
- HTML script open/close count: PASS (246/246)
- v10 stylesheet linked exactly once: PASS
- v10 script linked exactly once: PASS
- Both new files included in Service Worker app shell: PASS
- Service Worker cache version updated to `10.0.0-mobile-shell-m1`: PASS
- Mobile scope limited to `max-width: 760px`: PASS

## Functional Boundaries
- Uses existing `PETATOERouter.openTab()`.
- Mobile drawer mirrors visible canonical navigation entries, preserving permission behavior.
- Desktop and tablet remain unchanged at widths above 760px.
