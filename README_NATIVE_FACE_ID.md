# PETATOE v10 — N2 Native Face ID

## Security model
- Passwords are never stored by the native layer.
- After a successful normal PETATOE login, the existing session payload is stored in iOS Keychain.
- The Keychain item uses `WhenPasscodeSetThisDeviceOnly` and `biometryCurrentSet`.
- Changing or removing the enrolled Face ID invalidates the protected item.
- Manual logout deletes the protected native session.

## macOS setup
```bash
bash scripts/setup-native-ios.sh
```
Then select your Apple development team in Xcode and run on a physical iPhone. Face ID cannot be fully certified in this Linux environment.

## Expected flow
1. First launch: sign in normally once.
2. The successful session is protected in Keychain.
3. Next launch: Face ID appears directly and unlocks PETATOE.
4. Cancelling Face ID leaves the regular login screen available.
