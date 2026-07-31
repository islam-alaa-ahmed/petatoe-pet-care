#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const gatePath = path.join(root, 'performance/mobile-startup-loading-gate.js');
const gate = fs.readFileSync(gatePath, 'utf8');
const version = '10.0.25-sg4-6-2-smart-reports-initial-data-hydration-1';
const checks = [
  ['runtime diagnostics state is bounded', /runtimeDiagnostics\s*=\s*\{[\s\S]*history:\s*\[\]/.test(gate) && /history\.length\s*>\s*40/.test(gate)],
  ['window runtime errors are captured', /addEventListener\(['"]error['"][\s\S]*captureActiveRuntimeError/.test(gate)],
  ['unhandled rejections are captured', /addEventListener\(['"]unhandledrejection['"][\s\S]*captureActiveRuntimeError/.test(gate)],
  ['diagnostics are restricted to active script', /runtimeDiagnostics\.active/.test(gate) && /diagnosticSourceMatches/.test(gate)],
  ['script load receives group and state context', /function loadOne\(item, group, state\)/.test(gate)],
  ['script nodes expose lazy group attribution', /dataset\.petatoeLazyGroup\s*=\s*group/.test(gate)],
  ['network failures carry attribution', /kind:\s*['"]network['"]/.test(gate) && /phase:\s*['"]loading['"]/.test(gate)],
  ['execution failures identify source file', /Runtime execution failed in/.test(gate) && /failedScript\s*=\s*item\.src/.test(gate)],
  ['successful scripts are recorded', /loadedScripts\.push\(item\.src\)/.test(gate) && /lastLoadedScript\s*=\s*item\.src/.test(gate)],
  ['desktop contract timeout is attributed', /Desktop group not ready:[\s\S]*errorAttribution\s*=\s*\{[\s\S]*provider-contract/.test(gate)],
  ['mobile contract timeout is attributed', /Mobile group provider contract not ready:[\s\S]*errorAttribution\s*=\s*\{[\s\S]*provider-contract/.test(gate)],
  ['caught failures preserve detailed attribution', /error\.petatoeAttribution/.test(gate)],
  ['public diagnostics API is exported', /getRuntimeDiagnostics:\s*function/.test(gate)],
  ['release version is synchronized in gate', gate.includes(version)]
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
console.log(`SG-4.5 Startup Runtime Error Attribution: ${failures.length ? 'FAILED' : 'PASSED'}`);
console.log(JSON.stringify({ status: failures.length ? 'FAILED' : 'PASSED', checks: checks.length, passed: checks.length - failures.length, failures }, null, 2));
process.exit(failures.length ? 1 : 0);
