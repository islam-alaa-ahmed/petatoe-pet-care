# Root Cause Report — V10-N3

The Capacitor wrapper had no native release lifecycle. Relying on the PWA Service Worker inside an iOS binary would not update the signed native application, while downloading replacement executable web code would introduce integrity and App Store compliance risks.

The fix adds a metadata-only update coordinator. It compares the installed native version with a remote release manifest and directs users to an approved App Store, TestFlight, or GitHub release URL. It does not replace code at runtime and does not modify or clear the Face ID Keychain session.
