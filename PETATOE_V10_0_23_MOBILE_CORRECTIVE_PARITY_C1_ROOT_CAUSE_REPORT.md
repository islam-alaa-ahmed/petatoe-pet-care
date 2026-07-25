# PETATOE v10.0.23 — Mobile Corrective Parity C1

## Confirmed root causes

1. Native biometric startup was only injected into the generated `www/index.html` during `npm run native:build:web`; the source `index.html` still loaded WebAuthn authentication normally. A native build that was not rebuilt/synced therefore continued to show the passkey flow.
2. The native biometric runtime waited for `DOMContentLoaded`, allowing the normal authentication overlay to initialize first.
3. The native pending style hid the body with `opacity:0`, leaving the WebView/launch surface exposed during startup.
4. Legacy search and paw controls remained real topbar nodes. Their visibility depended on runtime classes and CSS cascade timing, so they could leak below the reconstructed mobile header.
5. The mobile drawer subscribed to broad mutations on the desktop navigation tree. Active/permission/class updates could rebuild the entire drawer during navigation.
6. The dashboard used a subtree MutationObserver that repeatedly retuned charts during DOM changes.
7. The N3 menu rendered all desktop groups expanded, which did not preserve the desktop accordion hierarchy and produced a visually dense mobile menu.

## Scope

- Native iOS biometric startup and launch surface.
- Phone-only legacy control suppression.
- Phone-only navigation work reduction.
- Phone-only menu structure aligned with desktop groups.
- No business calculations, Supabase queries, SQL, permissions, or desktop/tablet design changes.
