# PETATOE v9 — Final2 Deep English Zero-Arabic Audit

## Baseline
`petatoe-pet-care(11).zip`

## Confirmed root causes
1. The prior global translator handled DOM text and common attributes but did not intercept text rendered directly on Canvas, so Chart.js labels/tooltips generated from Arabic source values could remain Arabic.
2. Several modules used the Arabic `MAR[...]` map directly when building month buttons, chart periods, commission labels, customer-period labels, vehicle rows, invoice-entry periods and executive alerts.
3. The translator loaded after Smart Reports scripts, so persistent English mode could allow early chart rendering before the Canvas translation bridge existed.
4. The observer did not recursively scan Shadow DOM and did not cover several tooltip/accessibility attributes.

## Implemented architectural fix
- Load the global translation bridge before Smart Reports rendering.
- Read the persisted language directly from `petatoe.ui.language` before the main i18n runtime is ready.
- Intercept `CanvasRenderingContext2D.fillText()` and `strokeText()` so Arabic chart labels are translated before being painted.
- Recursively scan normal DOM and open Shadow DOM.
- Translate dynamic text nodes and these attributes: title, aria-label, aria-description, placeholder, data-label, data-title, data-tooltip, data-original-title and alt.
- Re-scan after language changes, tab changes, navigation building, localization readiness and page load.
- Add a centralized English month resolver covering month keys, numeric months and Arabic month names.
- Replace direct month rendering in affected Smart Reports, New Customers, Vehicle Analytics, invoice entry, commissions, executive alerts and children expenses.
- Add `assertEnglishClean()` runtime certification helper.

## Modified production files
- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/global-screen-translator.js`
- `smart/smart-reports-filters-real.js`
- `smart/smart-reports-new-customers-real.js`
- `smart/smart-vehicles.js`
- `sales/invoice-manual-multi-items.js`
- `inline-extracted/commission-inline.js`
- `inline-extracted/exec-alerts-block.js`
- `children-expenses/children-legacy-engine.js`

## Verification
- JavaScript files checked: 234
- JavaScript syntax failures: 0
- Direct month-producing paths identified in the targeted runtime surfaces were routed through the bilingual month resolver.
- Business formulas, database access, Supabase, authentication, permissions and report calculations were not changed.

## Runtime certification command
After switching to English and opening each screen, run:

```javascript
PETATOE_GLOBAL_SCREEN_TRANSLATOR.assertEnglishClean()
```

Expected successful result:

```javascript
{ passed: true, count: 0, items: [] }
```

The command checks visible DOM text, supported attributes and open Shadow DOM. Canvas text is translated before drawing through the patched Canvas API.

## Release
`PETATOE v9.0.0`

`ELC_FINAL2_DEEP_ENGLISH_ZERO_ARABIC_AUDIT`
