'use strict';
const fs = require('fs');
const path = require('path');
const { rootDir, readUtf8, readManifest, writeJson, relative, walk, sha256 } = require('./version-manifest-lib');
const root = rootDir();
const strict = process.argv.includes('--strict');
const { data: manifest } = readManifest(root);
const textExtensions = new Set(['.js','.mjs','.html','.json','.txt','.md','.ts','.css','.webmanifest','.yml','.yaml']);
const excludePrefixes = ['audit/phase1/'];
const files = walk(root).filter(file => textExtensions.has(path.extname(file).toLowerCase())).filter(file => !excludePrefixes.some(p => relative(root,file).startsWith(p)));
const tokenPattern = /\b(?:v)?10\.0\.\d+(?:-[A-Za-z0-9._-]+)?\b/g;
const occurrences = [];
for (const file of files){
  let text; try { text = readUtf8(file); } catch { continue; }
  const rel = relative(root,file);
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const matches = line.match(tokenPattern) || [];
    for (const token of matches) occurrences.push({file: rel, line: index+1, token, excerpt: line.trim().slice(0,240)});
  });
}
function readOptional(rel){ const f=path.join(root,rel); return fs.existsSync(f)?readUtf8(f):''; }
const index = readOptional('index.html');
const sw = readOptional('service-worker.js');
const releaseTxt = readOptional('RELEASE_VERSION.txt');
const native = (()=>{ try{return JSON.parse(readOptional('native-release.json'));}catch{return null;} })();
const swVersion = (sw.match(/\bAPP_VERSION\s*=\s*['"]([^'"]+)['"]/)||[])[1] || null;
const indexRelease = (index.match(/PETATOE_RELEASE_VERSION\s*=\s*['"]([^'"]+)['"]/)||[])[1] || null;
const indexReleaseName = (index.match(/PETATOE_RELEASE_NAME\s*=\s*['"]([^'"]+)['"]/)||[])[1] || null;
const startupGateToken = (index.match(/performance\/mobile-startup-loading-gate\.js\?v=([^'"&<\s]+)/)||[])[1] || null;
const runtimeSource = readOptional('runtime/version-manifest.js');
const checks = [
  {id:'manifest.release.index', expected:manifest.releaseLabel, actual:indexRelease, aligned:indexRelease===manifest.releaseLabel},
  {id:'manifest.release.name.index', expected:manifest.releaseName, actual:indexReleaseName, aligned:indexReleaseName===manifest.releaseName},
  {id:'manifest.release.file', expected:`PETATOE v${manifest.releaseVersion}`, actual:releaseTxt.split(/\r?\n/)[0]||null, aligned:releaseTxt.includes(`PETATOE v${manifest.releaseVersion}`)},
  {id:'manifest.cache.serviceWorker', expected:manifest.cacheVersion, actual:swVersion, aligned:swVersion===manifest.cacheVersion},
  {id:'manifest.cache.startupGateUrl', expected:manifest.cacheVersion, actual:startupGateToken, aligned:startupGateToken===manifest.cacheVersion},
  {id:'manifest.contract.startupGate', expected:manifest.runtimeContracts.startupGate, actual:null, aligned:true, note:'Contract is intentionally independent from cache version; exact runtime field is audited in Phase 1B.'},
  {id:'manifest.native.latest', expected:manifest.native.latestVersion, actual:native&&native.latestVersion, aligned:!!native&&native.latestVersion===manifest.native.latestVersion},
  {id:'manifest.native.minimum', expected:manifest.native.minimumSupportedVersion, actual:native&&native.minimumSupportedVersion, aligned:!!native&&native.minimumSupportedVersion===manifest.native.minimumSupportedVersion},
  {id:'runtime.manifest.generated', expected:'generated from canonical JSON', actual:runtimeSource?sha256(runtimeSource):null, aligned:runtimeSource.includes('Generated from config/petatoe-version.json')}
];
const uniqueTokens = [...new Set(occurrences.map(x=>x.token))].sort();
const drift = checks.filter(x=>!x.aligned);
const report = {
  generatedAt:new Date().toISOString(), mode:strict?'strict':'audit', manifest,
  summary:{filesScanned:files.length, occurrences:occurrences.length, uniqueTokens:uniqueTokens.length, alignedChecks:checks.length-drift.length, driftChecks:drift.length},
  checks, uniqueTokens, occurrences
};
writeJson(path.join(root,'audit/phase1/PETATOE_PHASE1A_VERSION_AUDIT.json'), report);
const md = [
  '# PETATOE Phase 1A — Version Single Source Audit', '',
  `Generated: ${report.generatedAt}`, '',
  '## Summary','',
  `- Files scanned: ${report.summary.filesScanned}`,
  `- Version occurrences: ${report.summary.occurrences}`,
  `- Unique version tokens: ${report.summary.uniqueTokens}`,
  `- Aligned checks: ${report.summary.alignedChecks}`,
  `- Drift checks: ${report.summary.driftChecks}`,'',
  '## Canonical values','',
  `- Release: ${manifest.releaseLabel}`,
  `- Release name: ${manifest.releaseName}`,
  `- Build: ${manifest.buildVersion}`,
  `- Cache: ${manifest.cacheVersion}`,
  `- Startup Gate contract: ${manifest.runtimeContracts.startupGate}`,'',
  '## Alignment checks','',
  '| Check | Expected | Actual | Result |','|---|---|---|---|',
  ...checks.map(c=>`| ${c.id} | ${String(c.expected)} | ${String(c.actual)} | ${c.aligned?'PASS':'DRIFT'} |`), '',
  '## Phase 1A decision','',
  'Phase 1A is audit-only. Detected drift is documented and intentionally not rewritten. Phase 1B will perform controlled synchronization after regression verification.', ''
].join('\n');
fs.writeFileSync(path.join(root,'audit/phase1/PETATOE_PHASE1A_VERSION_SINGLE_SOURCE_REPORT.md'),md);
console.log(`PETATOE Version Single Source Audit: ${drift.length?'DRIFT DETECTED':'ALIGNED'}`);
for(const c of drift) console.log(`- ${c.id}: expected=${c.expected} actual=${c.actual}`);
if(strict && drift.length) process.exit(1);
