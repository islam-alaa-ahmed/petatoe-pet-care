# PETATOE v10.0.11 — PWA Cache Strategy P2.4

## Scope
Read and modify only the PWA caching and release synchronization surfaces. No business logic, Supabase, SQL, permissions, security, payroll, operations, warehouse, desktop layout, or tablet layout changes.

## Confirmed Root Cause
`service-worker.js` classified HTML, JavaScript, CSS, JSON, and webmanifest resources under one `NETWORK_FIRST_EXTENSIONS` rule. For every same-origin JavaScript and CSS request, the Service Worker attempted a fresh network request before consulting the cached response. With the mobile startup still containing many static source requests, this added avoidable network wait on repeat launches even when the exact asset already existed in Cache Storage.

The audit did **not** find uncontrolled accumulation of PETATOE version caches. `deleteLegacyCaches()` already deletes prior `petatoe-pwa-*` caches during activation. Therefore, old-cache accumulation was not the primary cause.

## Responsible File
- `service-worker.js`

## Responsible Runtime Areas
- `NETWORK_FIRST_EXTENSIONS`
- Fetch routing in the `fetch` event
- Runtime cache writes

## Impact Before Fix
- Repeat mobile launches could wait for the network for every JavaScript and CSS request.
- PWA caching did not provide immediate reuse of already cached static sources.
- Runtime cache had no explicit maximum entry count.
- The Service Worker source itself shared the broad source-routing branch instead of having an explicit no-store network path.

## Minimal Fix
- Keep navigation, HTML, JSON, and webmanifest as Network First.
- Route JavaScript, MJS, and CSS through Stale-While-Revalidate.
- Continue serving images and fonts from cache immediately while revalidating.
- Fetch `service-worker.js` explicitly with `cache: no-store`.
- Add a bounded runtime cache limit of 420 entries.
- Preserve versioned cache names and existing old-cache deletion.
