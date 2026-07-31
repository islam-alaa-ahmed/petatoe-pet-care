#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const registry = read('router/route-registry.js');
const fleet = read('inline-extracted/fleet-inline.js');
const nav = read('navigation/navigation.js');
const index = read('index.html');
const gate = read('performance/mobile-startup-loading-gate.js');
const matrix = read('architecture/PETATOE_MODULE_OWNERSHIP_MATRIX.md');
const tests = [
  ['vehicleOperations no longer claims fleet alias', !/vehicleOperations[\s\S]{0,500}aliases:\['vehicles','fleet'\]/.test(registry)],
  ['fleet has a dedicated canonical route', /register\('fleet',[\s\S]*?owner:'fleet'[\s\S]*?panelId:'fleet'/.test(registry)],
  ['navigation is the canonical fleet button owner', /\{tab:'fleet'/.test(nav)],
  ['fleet runtime does not create navigation', !/function ensureNav\s*\(/.test(fleet) && !/\.onclick\s*=\s*function\(\)\{window\.PETATOERouter\.openTab\('fleet'\)/.test(fleet)],
  ['fleet runtime retains guarded tab listener', /__PETATOE_FLEET_TABCHANGE_BOUND__/.test(fleet)],
  ['fleet button declares explicit lazy group', /data-tab="fleet"[^>]*data-pet-lazy-group="fleet"/.test(index)],
  ['startup gate maps fleet to fleet group', /fleet:'fleet'/.test(gate)],
  ['ownership matrix documents fleet and vehicle operations separately', /Fleet Management[\s\S]*Vehicle Operations/.test(matrix)],
  ['fleet runtime cache token is phase-specific', /fleet-inline\.js\?v=10\.0\.25-sg4-6-operations-children-ownership-1/.test(index)]
];
let failed = 0;
for (const [name, ok] of tests) {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
  if (!ok) failed++;
}
console.log(`\n${tests.length - failed}/${tests.length} PASSED`);
process.exit(failed ? 1 : 0);
