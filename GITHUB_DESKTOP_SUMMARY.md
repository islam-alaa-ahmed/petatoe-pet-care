PETATOE SG-2.1 Certification Version Lock Hotfix

Root Cause:
The Service Worker APP_VERSION was intentionally updated to 10.0.25-sg2-runtime-hydration-fix-2, while the Mobile Enterprise certification still expected the previous SG-2 version. This caused Localization Lockdown to stop before the remaining certification jobs.

File Modified:
- scripts/mobile-enterprise-v10-certification-check.js

Validation:
- Mobile Enterprise UI v10 certification: PASSED (61/61)

No runtime, business logic, localization dictionary, UI, router, or Service Worker behavior was changed.
