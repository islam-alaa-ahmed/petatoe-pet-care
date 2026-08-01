#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'audit', 'phase0', 'PETATOE_PHASE0_BASELINE_MANIFEST.json');

function fail(msg) { console.error('[FAIL]', msg); failures.push(msg); }
function pass(msg) { console.log('[PASS]', msg); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function normalize(p) { return p.split(path.sep).join('/').replace(/^\.\//,''); }

const failures = [];
if (!fs.existsSync(manifestPath)) {
  console.error('Baseline manifest missing. Run: node scripts/phase0-generate-baseline-manifest.js');
  process.exit(2);
}
const baseline = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const allowed = new Set();
const argIndex = process.argv.indexOf('--allow-file');
if (argIndex >= 0 && process.argv[argIndex + 1]) {
  const allowPath = path.resolve(process.cwd(), process.argv[argIndex + 1]);
  const content = fs.readFileSync(allowPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const v = line.trim();
    if (v && !v.startsWith('#')) allowed.add(normalize(v));
  }
}
for (const arg of process.argv.filter(x => x.startsWith('--allow='))) allowed.add(normalize(arg.slice(8)));

for (const entry of baseline.files) {
  const full = path.join(root, entry.path);
  if (!fs.existsSync(full)) {
    if (allowed.has(entry.path)) pass(`intentional deletion: ${entry.path}`);
    else fail(`baseline file missing: ${entry.path}`);
    continue;
  }
  const current = sha256(full);
  if (current !== entry.sha256) {
    if (allowed.has(entry.path)) pass(`intentional change: ${entry.path}`);
    else fail(`unexpected content change: ${entry.path}`);
  }
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...index.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
const duplicateIds = [...new Set(ids.filter((id,i) => ids.indexOf(id) !== i))];
if (duplicateIds.length) fail(`duplicate index.html IDs: ${duplicateIds.join(', ')}`); else pass('index.html IDs are unique');

for (const [kind, re] of [
  ['script', /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi],
  ['stylesheet', /<link\b[^>]*\b(?:href=["']([^"']+)["'][^>]*rel=["'][^"']*stylesheet|rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'])[^>]*>/gi]
]) {
  const seen = new Map(); let m;
  while ((m = re.exec(index))) {
    const ref = m[1] || m[2];
    const clean = ref.split('?')[0].replace(/^\.\//,'');
    if (/^(https?:|data:|blob:|\/\/)/i.test(clean)) continue;
    if (!fs.existsSync(path.join(root, clean))) fail(`missing local ${kind}: ${clean}`);
    seen.set(clean, (seen.get(clean)||0)+1);
  }
  const duplicates = [...seen].filter(([,n])=>n>1).map(([p,n])=>`${p} (${n})`);
  if (duplicates.length) fail(`duplicate ${kind} references: ${duplicates.join(', ')}`); else pass(`no duplicate local ${kind} references`);
}

const prohibitedProductionFiles = [
  'index-css-control-test.html',
  'index-css-fontless-test.html'
];
for (const p of prohibitedProductionFiles) {
  if (fs.existsSync(path.join(root, p))) console.warn('[WARN] production artifact candidate still present:', p);
}

if (failures.length) {
  console.error(`PETATOE Phase 0 Regression Guard: FAILED (${failures.length})`);
  process.exit(1);
}
console.log('PETATOE Phase 0 Regression Guard: PASSED');
