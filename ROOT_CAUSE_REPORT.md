# Phase A5.1 — Root Cause Report

## Confirmed causes

1. `404.html` contained Arabic-only title and redirect text with a fixed `lang="ar"` / `dir="rtl"`. The page could display Arabic for users whose saved language is English.
2. `children-expenses/children-legacy-engine.js` generated visible labels, empty states, permission messages, budget statuses, KPI labels, export/print labels, and action buttons directly in Arabic after each render.
3. The static Children Expenses section in `index.html` still had filters, placeholders, and action labels without explicit translation bindings.
4. Runtime translation was therefore being used as a post-render safety layer instead of resolving these strings at source.

## Impact

- Mixed-language risk after filters or re-rendering.
- Arabic flash in the 404 redirect path.
- Source-surface audit remained open.
- English users could receive Arabic permission, budget, empty-state, print, or export messages.

## Fix approach

- Added a dedicated Arabic/English catalog: `childrenExpensesA51`.
- Added source-level translation resolution through `ceT()` before dynamic DOM creation.
- Added explicit `data-i18n`, `data-i18n-placeholder`, and `data-i18n-aria-label` bindings to confirmed static surfaces.
- Made `404.html` select language and direction from the saved language before DOM content is shown.
- Preserved stored Arabic business values such as expense categories and payment values; only visible presentation strings were localized.
