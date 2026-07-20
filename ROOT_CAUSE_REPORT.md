# Root Cause Report — Phase A3.5.4

## Root Cause
The executive recommendation area still generated its visible chrome directly inside `smart-reports-core.js`. The CEO briefing description, action headings, recommendation metric labels, action buttons, execution-plan heading, and contract export labels were created as Arabic or English literals during every Smart Reports render.

These strings were not part of recommendation calculations, but they depended on the runtime translation layer after DOM creation. This could leave mixed-language controls after report refreshes, tab changes, or recommendation filtering.

## Responsible Files
- `smart/smart-reports-core.js`
- `index.html`

## Fix
- Added a source-level translation helper for the A3.5.4 catalog.
- Added an Arabic/English catalog for recommendation and export chrome.
- Resolved the visible strings before creating the report DOM.
- Loaded the catalog before Smart Reports runtime execution.

## Business Logic Protection
No recommendation score, category, priority, confidence, financial impact, report target, filter, query, or Supabase operation was changed.
