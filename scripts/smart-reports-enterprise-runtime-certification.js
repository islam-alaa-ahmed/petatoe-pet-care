#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const warnings = [];
const checks = [];

function check(name, condition, detail = '') {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const index = read('index.html');
const legacy = read('inline-extracted/legacy-application-core.js');
const controller = read('smart/smart-reports-runtime-controller.js');
const adapter = read('smart/smart-reports-read-adapter.js');
const sw = exists('service-worker.js') ? read('service-worker.js') : '';

const order = [
  'smart/smart-services.js',
  'smart/smart-reports-core.js',
  'smart/smart-tabs.js',
  'smart/smart-runtime-registration.js',
  'smart/smart-reports-runtime-controller.js',
  'smart/smart-reports-read-adapter.js'
].map((needle) => index.indexOf(needle));

check('critical Smart Reports modules are loaded exactly once', order.every((pos) => pos >= 0) && [
  'smart/smart-services.js',
  'smart/smart-reports-core.js',
  'smart/smart-tabs.js',
  'smart/smart-runtime-registration.js',
  'smart/smart-reports-runtime-controller.js',
  'smart/smart-reports-read-adapter.js'
].every((needle) => index.split(needle).length - 1 === 1));

check('critical modules preserve certified boot order', order.every((pos, i) => i === 0 || pos > order[i - 1]), JSON.stringify(order));
check('deprecated open/refresh guard is not loaded', !index.includes('smart-reports-open-refresh-guard.js'));
check('SR4 data provider is not loaded in critical boot', !index.includes('smart-reports-data-provider.js'));
check('legacy core exclusively owns raw records-changed commit', legacy.includes("addEventListener('petatoe:records-changed'") || legacy.includes('addEventListener("petatoe:records-changed"'));
check('runtime controller does not own raw records-changed', !controller.includes("addEventListener('petatoe:records-changed'") && !controller.includes('addEventListener("petatoe:records-changed"'));
check('runtime controller consumes committed event', controller.includes('petatoe:sales-records-committed'));
check('canonical commit emits revision metadata', legacy.includes('revision') && legacy.includes('petatoe:sales-records-committed'));
check('controller suppresses duplicate revisions', controller.includes('lastRenderedRevision'));
check('controller coalesces concurrent remote refresh', controller.includes('remoteRefreshPromise') && controller.includes('coalescedRefreshCount'));
check('read adapter is read-only', !/supabase|fetch\s*\(|renderSmartReports\s*\(/i.test(adapter));
check('read adapter is optional and has legacy fallback', controller.includes('PETATOESmartReportsReadAdapter') && legacy.includes('PETATOESmartReportsReadAdapter'));
check('adapter is outside Startup Gate', !index.match(/registerOrWrite\([^\n]*smart-reports-read-adapter/));
check('release version remains unchanged', /"version"\s*:\s*"10\.0\.25"/.test(read('package.json')));

const smartTokens = [...index.matchAll(/smart\/(?:smart-services|smart-reports-core|smart-tabs|smart-runtime-registration|smart-reports-runtime-controller|smart-reports-read-adapter)\.js\?v=([^"']+)/g)].map((m) => m[1]);
if (new Set(smartTokens).size > 1) {
  warnings.push(`Critical Smart Reports cache query tokens are not unified: ${[...new Set(smartTokens)].join(', ')}`);
}
if (sw && !sw.includes("APP_VERSION = '10.0.25")) {
  warnings.push('Service worker APP_VERSION is not aligned with release 10.0.25.');
}

const result = {
  status: failures.length ? 'FAILED' : 'PASSED_WITH_WARNINGS',
  checks: checks.length,
  passed: checks.filter((item) => item.passed).length,
  failures,
  warnings
};

for (const item of checks) {
  console.log(`${item.passed ? 'PASS' : 'FAIL'} - ${item.name}${item.detail ? ` (${item.detail})` : ''}`);
}
for (const warning of warnings) console.warn(`WARN - ${warning}`);
console.log(`Smart Reports Enterprise Runtime Certification: ${result.status} (${result.passed}/${result.checks})`);
console.log(JSON.stringify(result));
process.exit(failures.length ? 1 : 0);
