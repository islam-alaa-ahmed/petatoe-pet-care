# Root Cause Report — Phase A3.2

## Confirmed root cause
Appointment actions and vehicle-status rendering still contained visible Arabic messages, labels, history captions, and date/number locale choices directly inside operational modules. Runtime translation could translate some messages after execution, but the source remained dependent on Arabic literals and did not provide deterministic English output for all generated templates.

## Responsible files
- `operations/operations-appointments.js`
- `operations/operations-status.js`

## Resolution
A dedicated bilingual localization catalog was added and visible strings were replaced with explicit translation keys. Canonical Arabic workflow status values were deliberately preserved because they are stored and compared by Business Logic. Only their displayed labels are localized.

## Business-logic protection
No status transition, validation, storage, collection calculation, query, or Supabase behavior was changed.
