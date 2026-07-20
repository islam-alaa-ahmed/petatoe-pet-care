# Root Cause Report — Phase A3.5.5

## Confirmed Root Cause
The final Smart Reports customer-analysis surfaces still contained visible Arabic literals generated directly inside runtime templates. The remaining concentration was in customer year comparison, inactive-customer analysis, recovery opportunities, contract-candidate details, export titles/headers, pagination summaries, sorting buttons, and analytical tooltips.

These strings were rebuilt whenever filters, pagination, sorting, or report tabs changed. They therefore depended on post-render runtime translation and could display mixed language or Arabic fallback text in English mode.

## Responsible Files
- `smart/smart-reports-core.js`
- `index.html` for loading the new localization catalog.

## Fix
A new bilingual source catalog was added under `smartReportsSource.finalPass`. Runtime templates now resolve the active language before creating the HTML, tooltip, pagination summary, export metadata, or contract recommendation label.

## Business Logic Protection
No calculation, score, threshold, customer classification, filter, export row value, Supabase query, RPC, or stored workflow value was changed.
