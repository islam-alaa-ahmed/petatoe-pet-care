# PETATOE Mobile — Phase P1 Startup Black Screen Elimination

## Baseline
- Source: petatoe-pet-care-main (6)(1).zip
- Release preserved: PETATOE v10.0.25
- Version token preserved: 10.0.25-navigation-runtime-isolation-c2-3

## Root Cause
The mobile boot overlay was activated at the start of `index.html` but its normal release was owned by `security/auth-session.js`, which executes late in the document after a large parser-blocking startup chain. Any delay or authentication dependency therefore prolonged the full-screen boot layer.

## Limited Fix
- Added a critical-shell boot controller to `performance/mobile-startup-loading-gate.js`.
- The boot layer now releases after the first stable critical-shell paint instead of waiting exclusively for authentication.
- Added a 1400 ms JavaScript safety deadline.
- Added a compositor-friendly CSS safety fade at 1.05 seconds so the overlay cannot remain visually stuck even while JavaScript is busy.
- Authentication still calls the canonical boot release method when ready, preserving existing auth behavior.
- No business logic, authentication flow, Supabase, routing, service worker, desktop/tablet behavior, localization text, or release version was changed.

## Modified Files
- index.html
- performance/mobile-startup-loading-gate.js
- security/auth-session.js

## Verification
- JavaScript syntax: PASSED
- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Runtime Translation Completion: PASSED
- Smart Reports Translation Stability: PASSED — 11/11
- Mobile Enterprise UI v10 Certification: PASSED — 61/61

## Runtime Note
This phase caps and decouples the visible boot overlay. It does not yet split the large parser-blocking script chain; that is the scope of Phase P2.
