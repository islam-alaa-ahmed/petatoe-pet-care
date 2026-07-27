# PETATOE v10.0.25 — Phase D3.6 Verification Report

## Phase
Earliest Bootstrap Trace

## Scope
Diagnostics only. No business logic, Supabase, authentication, permissions, design, desktop/tablet behavior, or release metadata was changed.

## Root-cause gap addressed
The D3.5 profiler loaded after the first startup segment, so it could not see the 7–18 second interval preceding runtime-module evaluation. D3.6 establishes a timestamp at the first executable point in `<head>` and records parser/script/resource progress from there.

## Changes
- Added an inline seed timestamp immediately after `<meta charset>`.
- Added `performance/earliest-bootstrap-trace.js` before every application script.
- Added start/end spans around the blocking scripts on the critical path through Mobile Shell.
- Added parser checkpoints for end of `<head>` and start of `<body>`.
- Added the `earliestBootstrap` section to the existing startup diagnostics export.
- Captured resource request/response timing independently of later runtime initialization.

## New report section
`earliestBootstrap`

Contains:
- `navigation`
- `spans`
- `events`
- `resources`

## Verification
- `node --check performance/earliest-bootstrap-trace.js`: passed.
- `node --check performance/startup-clean-profiler.js`: passed.
- HTML parse check: passed; `<head>`, `<body>`, and earliest tracer script detected.
- Release version/name unchanged.

## Expected diagnostic decision
The next reports will distinguish among:
1. initial document/network delay;
2. delay fetching the earliest tracer;
3. one blocking script's download/evaluation time;
4. parser gap before `<body>` or Mobile Shell;
5. delay after Mobile Shell and before runtime readiness.
