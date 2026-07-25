# PETATOE Mobile — Enterprise Header & Glass Bottom Navigation

## Baseline
- PETATOE v10.0.25
- PETATOE_V10_0_25_NAVIGATION_RUNTIME_ISOLATION_C2_3
- Version unchanged.

## Root Cause
1. The mobile header was generated as menu + brand/copy + search/notification actions, so its structure could not provide the requested physical left/center/right arrangement.
2. The logo action routed to Dashboard rather than owning scroll-to-top / scroll-to-bottom behavior.
3. Each bottom-nav item rendered its own active background. There was no shared movable bubble layer.
4. Bottom navigation used click-only routing. No pointer tracking engine existed, so continuous finger-following and release-to-activate were unavailable.
5. The bottom navigation had a fixed size and did not respond to scroll direction.

## Scope
- Mobile header presentation and interaction only.
- Mobile bottom navigation presentation, animation and gesture handling only.
- No changes to routing, business logic, Supabase, database, APIs, service worker, authentication, OTP, biometrics or permissions.
- Desktop and tablet remain outside the media-query scope.

## Files
- mobile/mobile-enterprise-v10-shell.js
- css/mobile/mobile-enterprise-v10-consolidated.css

## Risk Controls
- Existing router entry points are reused.
- Gesture listeners are attached only to the bottom navigation.
- Pointer tracking runs only between pointerdown and pointerup/cancel.
- Bubble rendering is limited to one requestAnimationFrame per frame.
- Positioning uses translate3d only.
- Scroll state updates are passive and requestAnimationFrame throttled.
