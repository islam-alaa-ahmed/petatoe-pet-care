# PETATOE Phase 14 — CSS Ownership & Visual Regression

## Scope
Visual ownership only. No JavaScript event, business state, calculations, filters, exports, or Supabase logic changed.

## Root cause
Critical Smart Reports controls had final overrides split between `css/main.css`, `css/themes/liquid-glass.css`, mobile CSS, and inline `<style>` blocks in `index.html`. Later layers could hide labels, cover them with pseudo-elements, or change active-state readability.

## Resolution
- Added `css/components/interaction-ownership.css` as the last stylesheet.
- Moved the accepted Smart Reports active-state and inactive-customer sort contracts out of `index.html` into the component file without changing their values.
- Added label visibility, non-intercepting decorative pseudo-elements, focus-visible, loading, failed, and retry contracts.
- Scoped the rules to Smart Reports and the critical financial modules.
- Added RTL/LTR direction coverage.

## Regression boundaries
- No data source changes.
- No action handler changes.
- No DOM creation changes.
- No report calculation changes.
- No export changes.
- No localization keys added.

## Required browser UAT
Desktop and mobile, Arabic and English, dark and light:
- Smart Reports tab pills.
- Customer comparison controls.
- Inactive-customer sort labels and active state.
- Show-more, Customer 360, Open, Follow-up.
- Loading, failure, and retry states.
- Keyboard focus and touch activation.
