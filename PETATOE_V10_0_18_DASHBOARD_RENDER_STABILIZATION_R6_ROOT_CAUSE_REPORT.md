# PETATOE v10.0.18 — Dashboard Render Stabilization R6

## Runtime evidence
The v10.0.17 iPhone trace showed that `DOMContentLoaded` completed at 841 ms and the sales request completed at 5,672 ms with 3,033 rows. However, no dashboard render followed the `petatoe:records-changed` event at 5,702 ms. The dashboard was rendered repeatedly with an empty local records array before and long after the sales data became available.

## Confirmed root cause
`PETATOEDataSource` dispatches `petatoe:records-changed` on `window`, while the canonical sales bridge in `index.html` listened on `document`. Therefore the bridge did not receive the successful boot refresh event and did not transfer the runtime sales cache into the dashboard's local `records` array at the moment the data became ready.

The faster R5 bootstrap exposed this ownership mismatch because the dashboard boot routine now ran before the asynchronous sales refresh completed. It rendered the dashboard with zero rows, while later unrelated lifecycle events caused additional empty renders.

## Limited correction
- Moved the canonical sales bridge listener from `document` to `window`, matching the actual event dispatcher.
- Prevented the initial dashboard boot routine from rendering while the runtime sales source has not completed and the local records array is empty.
- Added a guard inside `renderDashboardAll()` to ignore premature empty startup renders before the sales source status exists.
- Preserved normal zero-data rendering after a completed source response, as well as manual refresh, filters, theme changes, CRUD, reports, and desktop behavior.

## Scope exclusions
No calculations, filters, Supabase queries, SQL, schema, authentication, permissions, security logic, localization content, or visual design were changed.
