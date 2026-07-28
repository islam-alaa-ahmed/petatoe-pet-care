#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const gatePath = 'performance/mobile-startup-loading-gate.js';
const gate = fs.readFileSync(path.join(root, gatePath), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/localization-lockdown.yml'), 'utf8');
const failures = [];

function count(text, token) {
  return text.split(token).length - 1;
}
function requireCheck(condition, message) {
  if (!condition) failures.push(message);
}

requireCheck(count(index, gatePath) === 3,
  `Expected one executable startup-gate reference plus two trace markers, found ${count(index, gatePath)} textual references.`);
requireCheck(count(index, `<script src="${gatePath}`) === 1,
  'Expected exactly one executable external startup-gate script reference.');
requireCheck(!index.includes('inline-mobile-startup-gate'),
  'Legacy inline startup-gate trace marker remains in index.html.');
requireCheck(!/window\.PETATOEMobileStartupGate\s*=/.test(index),
  'index.html still defines window.PETATOEMobileStartupGate inline.');
requireCheck(count(gate, 'window.PETATOEMobileStartupGate =') === 1,
  'External startup-gate must define window.PETATOEMobileStartupGate exactly once.');
requireCheck(gate.includes("if(!isMobile) return waitForDesktopGroup(name);"),
  'Desktop ensureGroup must use waitForDesktopGroup().');
requireCheck(gate.includes("version: '10.0.25-runtime-restoration-a1'"),
  'Startup-gate runtime version is not aligned with Phase A1.');
requireCheck(workflow.includes('node scripts/startup-gate-single-source-check.js'),
  'Startup-gate single-source check is not wired into GitHub Actions.');

if (failures.length) {
  console.error('PETATOE Startup Gate Single Source Certification: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PETATOE Startup Gate Single Source Certification: PASSED');
console.log(JSON.stringify({ executableReferences: 1, inlineDefinitions: 0, externalDefinitions: 1 }, null, 2));
