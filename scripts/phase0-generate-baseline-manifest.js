#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'audit', 'phase0');
fs.mkdirSync(outDir, { recursive: true });

const excludedPrefixes = [
  '.git/', 'node_modules/', 'www/', 'ios/', 'audit/phase0/'
];
const excludedExact = new Set([
  'scripts/phase0-generate-baseline-manifest.js',
  'scripts/phase0-regression-guard.js',
  'scripts/phase0-regression-matrix.json'
]);

function rel(p) { return path.relative(root, p).split(path.sep).join('/'); }
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const r = rel(full);
    if (excludedPrefixes.some(p => r === p.slice(0, -1) || r.startsWith(p))) continue;
    if (excludedExact.has(r)) continue;
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.isFile()) acc.push(full);
  }
  return acc;
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function text(file) { return fs.readFileSync(file, 'utf8'); }

const files = walk(root).sort((a,b) => rel(a).localeCompare(rel(b)));
const manifest = files.map(file => {
  const buf = fs.readFileSync(file);
  const r = rel(file);
  return { path: r, bytes: buf.length, sha256: sha256(buf), ext: path.extname(r).toLowerCase() || '(none)' };
});

const indexPath = path.join(root, 'index.html');
const index = text(indexPath);
const scripts = [];
const styles = [];
let m;
const scriptRe = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
while ((m = scriptRe.exec(index))) scripts.push({ order: scripts.length + 1, src: m[1], cleanPath: m[1].split('?')[0].replace(/^\.\//,'') });
const styleRe = /<link\b[^>]*\brel=["'][^"']*stylesheet[^"']*["'][^>]*\bhref=["']([^"']+)["'][^>]*>|<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi;
while ((m = styleRe.exec(index))) {
  const href = m[1] || m[2];
  styles.push({ order: styles.length + 1, href, cleanPath: href.split('?')[0].replace(/^\.\//,'') });
}
const idMatches = [...index.matchAll(/\bid=["']([^"']+)["']/gi)].map(x => x[1]);
const idCounts = idMatches.reduce((a,id) => (a[id]=(a[id]||0)+1,a),{});
const duplicateIds = Object.entries(idCounts).filter(([,n]) => n > 1).map(([id,count]) => ({id,count}));

function localRefStatus(item, key) {
  const p = item[key];
  if (/^(https?:|data:|blob:|\/\/)/i.test(p)) return { ...item, external: true, exists: null };
  return { ...item, external: false, exists: fs.existsSync(path.join(root, p)) };
}
const scriptOrder = scripts.map(x => localRefStatus(x, 'cleanPath'));
const cssOrder = styles.map(x => localRefStatus(x, 'cleanPath'));

const artifactCandidates = manifest.filter(x => {
  const p = x.path.toLowerCase();
  return p === 'index-css-control-test.html' || p === 'index-css-fontless-test.html' ||
    /(^|\/)(tmp|temp|debug|diagnostic|test-output)(\/|$)/.test(p) ||
    /(^|\/)(.*audit.*report|.*verification.*report|github_desktop_summary.*)\.(md|txt|json)$/.test(p);
});

const jsFiles = manifest.filter(x => x.ext === '.js' || x.ext === '.mjs');
const cssFiles = manifest.filter(x => x.ext === '.css');
const htmlFiles = manifest.filter(x => x.ext === '.html');

const summary = {
  generatedAt: new Date().toISOString(),
  baseline: 'petatoe-pet-care-main (34).zip',
  totals: {
    files: manifest.length,
    bytes: manifest.reduce((s,x)=>s+x.bytes,0),
    javascript: jsFiles.length,
    css: cssFiles.length,
    html: htmlFiles.length,
    scriptReferences: scriptOrder.length,
    stylesheetReferences: cssOrder.length
  },
  integrity: {
    duplicateHtmlIds: duplicateIds,
    missingLocalScripts: scriptOrder.filter(x => x.external === false && !x.exists),
    missingLocalStyles: cssOrder.filter(x => x.external === false && !x.exists),
    productionArtifactCandidates: artifactCandidates.map(x => x.path)
  }
};

fs.writeFileSync(path.join(outDir, 'PETATOE_PHASE0_BASELINE_MANIFEST.json'), JSON.stringify({ summary, files: manifest }, null, 2));
fs.writeFileSync(path.join(outDir, 'PETATOE_PHASE0_SCRIPT_LOAD_ORDER.json'), JSON.stringify(scriptOrder, null, 2));
fs.writeFileSync(path.join(outDir, 'PETATOE_PHASE0_CSS_LOAD_ORDER.json'), JSON.stringify(cssOrder, null, 2));
fs.writeFileSync(path.join(outDir, 'PETATOE_PHASE0_PRODUCTION_ARTIFACT_AUDIT.json'), JSON.stringify({ generatedAt: summary.generatedAt, candidates: artifactCandidates }, null, 2));
fs.writeFileSync(path.join(outDir, 'PETATOE_PHASE0_BASELINE_SUMMARY.json'), JSON.stringify(summary, null, 2));

console.log('PETATOE Phase 0 baseline generated');
console.log(JSON.stringify(summary.totals, null, 2));
if (duplicateIds.length || summary.integrity.missingLocalScripts.length || summary.integrity.missingLocalStyles.length) process.exitCode = 2;
