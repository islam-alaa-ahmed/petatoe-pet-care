# PETATOE v9 — Final Global English Screen Purge

## Baseline
`petatoe-pet-care(10).zip`

## Root Cause
The existing runtime translated exact keys and exact phrases, but mixed dynamic strings could still contain Arabic when they combined translated UI text with numbers, dates, generated labels, or text inserted after the first render. The existing observer primarily handled newly added elements and did not comprehensively process character-data changes and dynamic attributes.

## Implemented Fix
A global screen translator was added at `i18n/global-screen-translator.js`.

It performs the following when English is active:

- Builds an Arabic-to-English phrase index from the main Arabic/English dictionaries.
- Adds the dedicated Smart Reports Arabic/English dictionary.
- Applies longest-phrase-first replacement inside mixed dynamic text.
- Processes visible text nodes and UI attributes such as `title`, `aria-label`, `placeholder`, `alt`, and button values.
- Observes newly added DOM nodes, direct character-data changes, and dynamic attribute changes.
- Rescans after language changes, tab changes, navigation rebuilds, and localization readiness events.
- Excludes scripts, styles, code blocks, editable fields, and explicitly ignored elements.
- Exposes `PETATOE_GLOBAL_SCREEN_TRANSLATOR.remainingArabic()` for visual-runtime diagnostics.

## Modified Production Files
- `index.html`
- `RELEASE_VERSION.txt`
- `i18n/global-screen-translator.js` (new)

## Release
- Version: `PETATOE v9.0.0`
- Release Name: `ELC_FINAL_GLOBAL_ENGLISH_SCREEN_PURGE`

## Verification
- `node --check` executed against every JavaScript file in the project.
- JavaScript syntax errors: `0`
- Business calculations changed: No
- Filters changed: No
- Supabase or database logic changed: No
- Authentication or permissions changed: No

## Browser Verification Required
After uploading the modified files, hard refresh with `Ctrl + Shift + R`, switch to English, and navigate through all screens. Open the browser console and run:

```js
PETATOE_GLOBAL_SCREEN_TRANSLATOR.remainingArabic()
```

The returned array identifies any Arabic text still visible in the current screen. Remaining results should be reviewed only if they are intentional business names or user-entered content.
