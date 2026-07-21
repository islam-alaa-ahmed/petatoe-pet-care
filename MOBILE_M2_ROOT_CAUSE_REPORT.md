# PETATOE v9.4.24 — Mobile Enterprise UI Phase M2

## Confirmed Root Causes

### 1. Oversized iPhone header
The mobile header retained desktop controls and wrapping behavior. Safe-area padding was correct, but the visible header height stayed larger than necessary because multiple actions, labels, notification controls, language controls, and user metadata competed for the same mobile row.

### 2. Unreadable Quick Insights cards
The shared `.insights` layout forced four columns at mobile width. Each card became too narrow, causing Arabic and English values to wrap into multiple fragmented lines.

### 3. PWA update message behind the Home Indicator
`pwa-manager.js` creates `.petatoe-pwa-update`, but no dedicated stylesheet existed for that class. The browser therefore rendered the update element using inherited/default positioning, allowing it to appear at the bottom edge and overlap the iPhone Home Indicator.

## Scope
The fix is CSS-only for mobile presentation, plus the HTML stylesheet link and Service Worker cache revision. No business logic, authentication, Supabase, reports, payroll, permissions, or translations were changed.
