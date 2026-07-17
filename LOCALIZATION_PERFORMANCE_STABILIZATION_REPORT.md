# PETATOE v9.4.5 — Localization Performance Stabilization

## Confirmed code-level bottlenecks

1. The Global Screen Translator patched `Node.textContent`, `Element.innerHTML`, `outerHTML`, `setAttribute`, and `insertAdjacentHTML` globally. Every DOM write could therefore execute translation work during normal navigation and rendering.
2. Mixed-text fallback scanned the complete phrase list for each Arabic text value.
3. English hydration called the complete `PETATOE_I18N.apply('en')` lifecycle again, causing duplicate whole-page work.
4. Language change scheduled multiple overlapping scans and residual-cleanup retries.
5. Tab navigation reapplied localization to the full document instead of the currently active surfaces.

## Implemented fixes

- Disabled installation of the global DOM property-setter bridge.
- Added token-indexed phrase buckets so fallback matching evaluates only relevant phrase candidates.
- Removed recursive full-language application from English hydration.
- Reduced language-change processing to one active-surface queue.
- Replaced full-document tab-change translation with active-root translation.
- Limited nav rebuild translation to the navigation root.
- Preserved the MutationObserver residual translator for dynamically inserted text.
- Synchronized release and runtime metadata to v9.4.5.

## Verification

- Enterprise Localization Certification: PASSED
- Production Localization Lockdown: PASSED
- Performance Stabilization checks: PASSED (9/9)
- JavaScript syntax: 272 files passed
- Arabic dictionary entries: 3336
- English dictionary entries: 3336
- Missing language counterparts: 0
- Legacy localization references: 0

## Runtime note

Static and source-level verification passed. Browser timing must be confirmed after deploying the files because this environment does not reproduce the user's production dataset, browser rendering workload, and navigation session.
