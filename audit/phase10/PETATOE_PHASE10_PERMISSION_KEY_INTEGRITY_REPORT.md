# PETATOE Phase 10 — Permission Key Integrity

## Scope
Canonicalize permission record identity across read, save, apply, reset, Supabase sync and runtime refresh without changing the permission matrix or role defaults.

## Confirmed root cause
Permissions may exist under historical aliases for the same user (`id`, `userId`, `uid`, `supabase_id`, username, login or email). Runtime reading already searched several aliases, but saving selected one key and reset deleted only the currently selected `uid`. A legacy alias could therefore survive reset and reappear after identity reload or auto refresh.

## Changes
- Added a canonical permission key resolver and stable alias descriptor.
- Permission reads now match aliases case-insensitively.
- Permission saves upsert the canonical key and remove stale aliases.
- Permission reset deletes every known alias locally and from `app_user_permissions` in one operation.
- Supabase repository now exposes `replacePermission` and `deletePermissionAliases`.
- Reset reports failure instead of showing success if persistent deletion fails.
- Permission change events include reset metadata and affected aliases.

## Compatibility
Legacy permission keys remain readable during migration. The first successful save migrates them to the canonical key. No screen, action, special permission, vehicle scope, role template or Supabase query shape was changed.

## Runtime contract
`10.0.25-phase10-canonical-permission-key-contract-1`

## Validation
- Phase 10 Permission Key Integrity: 14/14 PASSED
- Phase 2 Canonical Data Ownership: 9/9 PASSED
- Phase 3 Smart Reports Ownership: 12/12 PASSED
- Phase 4 Customer 360: 12/12 PASSED
- Phase 5 Sales Runtime: 15/15 PASSED
- Phase 6 Navigation: 14/14 PASSED
- Phase 7 Readiness: 12/12 PASSED
- Phase 8 Filter/Export Parity: 12/12 PASSED
- Phase 9 Inventory Safety: 12/12 PASSED
- Version Single Source: PASSED
- Startup Gate Single Source: PASSED
- Runtime Translation Completion: PASSED
- JavaScript/MJS syntax: 407 files PASSED

## Live verification still required
A browser/Supabase UAT should save a user's permissions, reload, reset the user, reload again, and confirm no row remains under old username/email/id aliases. No live Supabase data was modified during this phase.
