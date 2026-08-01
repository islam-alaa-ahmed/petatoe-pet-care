# PETATOE Phase 2 — Canonical Data Ownership

This phase introduces `PETATOERecordsReadFacade` as the canonical read-only interface for sales records while retaining `PETATOEDataSource` as the sole mutable cache owner.

Migrated consumers in this phase:
- Smart Reports read adapter
- Smart Reports runtime controller
- Smart Reports router
- Smart customer controller

No business calculations, filters, Supabase queries, normalization rules, or write paths were changed.
Legacy `window.records` remains published by `PETATOEDataSource` for compatibility but is no longer used by the migrated consumers as a read source.
