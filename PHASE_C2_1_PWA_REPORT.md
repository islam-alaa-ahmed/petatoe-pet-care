# PETATOE v10.0.23 — Phase C2.1-PWA

## Scope
Fast PWA startup and saved-session restoration for the GitHub Pages / iPhone Home Screen deployment. No Xcode, Swift, native plugin, SQL, Supabase schema, business calculation, or KYUM project files were changed.

## Confirmed root causes
1. The application session was stored only in `sessionStorage`; iOS can discard it when the PWA is closed, forcing the login/Passkey path on the next launch.
2. `scheduleAutomaticBiometricLogin()` invoked WebAuthn automatically when a biometric enrollment existed, causing the iOS “Use Passkey” sheet during normal startup.
3. The mobile boot gate covered the first paint with a dark full-screen layer, perceived as a black screen.
4. Critical authentication JavaScript used stale-while-revalidate caching, allowing an older auth runtime to execute once before the updated asset arrived.

## Implemented changes
- Added a 30-day persistent application-session envelope in localStorage containing the existing safe user session object only; no password or passkey credential is stored.
- Hydrates sessionStorage from the persistent session and validates the user through the existing validation path before opening the application.
- Clears both transient and persistent application sessions on logout, revocation, expiry, or invalid data.
- Disabled automatic WebAuthn invocation during normal PWA startup. Passkey remains available only through the explicit biometric login button.
- Replaced the dark mobile boot cover and loader with a PETATOE-colored startup shell.
- Changed critical startup assets (`security/auth-session.js`, the mobile startup gate, and `css/main.css`) to network-first caching.
- Bumped and synchronized release metadata to v10.0.23.

## Expected first-run behavior
After publishing this phase, an existing device may require one normal login because older builds did not create the new persistent session. After that successful login, reopening the PWA should restore the application session without automatically showing the Passkey sheet, subject to normal session validation.

## Verification completed
- JavaScript syntax validation: PASS
- Enterprise Localization Certification: PASS
- Production Localization Lockdown: PASS
- Runtime Translation Completion: PASS
- Mobile Enterprise UI v10 certification: 61/61 PASS

## Device verification still required
The final startup timing, iOS PWA lifecycle behavior, and absence of the Passkey sheet must be confirmed on the user’s iPhone after GitHub Pages publishes the updated files and the new Service Worker activates.
