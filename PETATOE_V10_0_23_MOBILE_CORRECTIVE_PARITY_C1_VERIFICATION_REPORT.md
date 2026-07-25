# Verification — PETATOE v10.0.23

- JavaScript syntax checks: PASS
- package.json validation: PASS
- Native web bundle generation: PASS
- Native biometric script injected before auth-session in generated bundle: PASS
- Native iOS static certification: 27/27 PASS
- Legacy search/paw controls suppressed by direct DOM state and phone-only CSS: PASS
- Drawer broad MutationObserver removed: PASS
- Dashboard subtree MutationObserver removed: PASS
- Desktop navigation group order reused by mobile accordion: PASS
- No new visible localization strings added: PASS

## Device requirement

The Face ID behavior and launch background require rebuilding/syncing the native iOS package and installing the new app build. Updating only GitHub Pages or an old installed native package cannot replace the Swift plugin or the generated native `www` bundle.
