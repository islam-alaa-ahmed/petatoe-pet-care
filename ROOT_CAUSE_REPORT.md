# Root Cause Report — Phase A3.5.1

## Confirmed Root Cause
Several Smart Reports fast/local renderers generated Arabic UI text directly inside JavaScript templates and Chart.js dataset/axis labels. The generic Smart Reports runtime translated those nodes only after rendering, so changing filters or rebuilding a local report could briefly recreate Arabic text before the runtime pass.

## Responsible Files
- `smart/smart-services.js`
- `smart/smart-customers.js`
- `smart/smart-reports-new-customers-real.js`

## Impact
- Possible mixed-language frames after local filter changes.
- Repeated DOM translation work for content that could be resolved before render.
- Chart labels depended on post-render localization.

## Fix
A bilingual source catalog was added and the affected renderers now resolve visible labels before creating HTML or chart configuration. Stored customer, service, invoice, and workflow values were not changed.
