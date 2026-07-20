# PETATOE v9.4.24 — Hotfix M1.1 Root Cause Report

## Confirmed root cause
The PWA manager `<script>` tag was inserted inside the JavaScript string that builds the Full Page PDF export document.

Because the inserted tag contained a literal `</script>`, the browser closed the outer inline script early and rendered the remaining JavaScript as visible page text.

## Fix
- Removed the accidental PWA manager tag from the PDF export HTML string.
- Restored the PDF document string closing sequence.
- Added the PWA manager script once before the real document `</body>`.
- Updated the Service Worker cache version so installed devices receive the corrected page.

## Scope
Only `index.html` and `service-worker.js` were modified. Business logic, Supabase, reports, payroll, permissions, translations, and calculations were not changed.
