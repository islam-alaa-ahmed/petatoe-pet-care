# PETATOE v9.4.24 — Mobile Enterprise UI Phase M1

## Confirmed root causes

1. **Dynamic Island / status-bar overlap**
   - The viewport already used `viewport-fit=cover`, but the application top bar and authentication overlay did not consistently consume `env(safe-area-inset-top)`.
   - Result: top-bar content could enter the iPhone status-bar area when launched in standalone mode.

2. **Authentication layout not safe-area aware**
   - Authentication positioning used fixed pixel offsets and fixed footer padding.
   - Result: the brand, card and footer could become too close to the notch, home indicator or small viewport boundaries.

3. **Excessive Dashboard vertical spacing on narrow screens**
   - Existing mobile rules collapsed Dashboard sections but retained desktop-sized card/filter spacing and control heights.
   - Result: the first report required unnecessary scrolling.

4. **Missing referenced PWA stylesheet in the provided baseline package**
   - `index.html` referenced `css/pwa/pwa-enterprise.css`, but the file was absent from the uploaded baseline ZIP.
   - Result: PWA install/update UI could render without its intended presentation.

## Scope protection

No business logic, Supabase integration, reports calculations, payroll workflow, permissions, authentication logic or localization dictionaries were changed.
