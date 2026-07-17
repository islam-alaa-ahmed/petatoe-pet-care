# PETATOE v9.3.2 — Runtime Localization Cleanup

## Scope
This stage hardens the runtime localization layer after the bulk localization refactor.

## Implemented
- Localizes global runtime message APIs (`toast`, `toastSafe`, `showToast`, `notify`, `showNotification`, `petatoeToast`) without changing their call signatures.
- Re-patches message APIs safely when modules redefine them after startup.
- Adds bounded residual cleanup passes after major module render events.
- Adds cleanup after tab changes and localization lifecycle events.
- Keeps the existing MutationObserver batching and recursion protection.
- Synchronizes release version/name and runtime cache tokens to v9.3.2.
- Updates earlier regression guards to accept the newer runtime release.

## Verification
- JavaScript syntax checks passed.
- All project localization and migration checks passed.
- New runtime localization cleanup regression check passed.
