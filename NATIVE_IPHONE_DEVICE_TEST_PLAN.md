# PETATOE v10 — Native iPhone Device Certification Plan

## Mandatory environment
- macOS with current supported Xcode.
- Physical iPhone with Face ID and device passcode enabled.
- Development signing team selected in Xcode.
- Supabase production or isolated certification environment.

## Release blockers
1. First login succeeds with username/password.
2. Native Face ID enrollment stores no password.
3. Cold launch prompts Face ID once and opens Dashboard after success.
4. Cancelling Face ID exposes the normal login screen without a loop.
5. Three failed biometric attempts do not corrupt the stored session.
6. Manual logout removes the protected Keychain session.
7. Changing enrolled Face ID invalidates the protected session.
8. App upgrade preserves the Keychain session.
9. App deletion removes the local protected session.
10. Offline launch handles a still-valid local session safely and clearly.
11. Expired/revoked server session falls back to login after Face ID.
12. Background/foreground return does not trigger duplicate Face ID prompts.
13. Update prompts open only approved App Store, TestFlight, or GitHub links.
14. Dark and light mode remain readable on the biometric flow.
15. No Passkey/github.io dialogs appear in the native biometric flow.

## Evidence required
- Screen recording of cold-launch Face ID success.
- Screen recording of cancellation fallback.
- Xcode console log without uncaught native or JavaScript errors.
- Screenshot of Keychain/session revocation behavior after logout.
- GitHub Actions native iOS workflow passing.

## Certification rule
The native wrapper cannot be marked Production Certified until every release blocker above has passed on a physical iPhone.
