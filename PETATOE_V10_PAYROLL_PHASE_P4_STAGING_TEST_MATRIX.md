# Payroll Phase P4 — Staging Test Matrix

| ID | Scenario | Expected result | Actual | Evidence | Status |
|---|---|---|---|---|---|
| P4-01 | Create unlinked employee | Persists with no userId; shows Not linked |  |  | Pending |
| P4-02 | Edit employee | Awaited save; survives refresh |  |  | Pending |
| P4-03 | Delete historical employee | Blocked; use Stopped/Resigned |  |  | Pending |
| P4-04 | Unauthorized employee mutation | UI and Supabase/RLS reject |  |  | Pending |
| P4-05 | Unauthorized salary slip mutation | UI and Supabase/RLS reject |  |  | Pending |
| P4-06 | Chairman authorization | Stable role/permission only |  |  | Pending |
| P4-07 | Failed persistence rollback | No success; previous UI state restored |  |  | Pending |
| P4-08 | Certified snapshot capture | ID/hash/revision and frozen amount saved |  |  | Pending |
| P4-09 | Snapshot replacement | Existing slip amount remains unchanged |  |  | Pending |
| P4-10 | Reject slip | Actor, time, and reason persist |  |  | Pending |
| P4-11 | Cancel approval | Actor, time, old/new state, reason persist |  |  | Pending |
| P4-12 | Mark paid | Actor, time, payment reference persist |  |  | Pending |
| P4-13 | Mudad labels | Arabic مدد / English Mudad |  |  | Pending |
| P4-14 | Financial reconciliation | All views/exports/Supabase match exactly |  |  | Pending |
