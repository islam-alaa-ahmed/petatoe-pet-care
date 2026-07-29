'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const token = '10.0.25-smart-reports-sr6-1-cache-reconciliation';
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const index = read('index.html');
const sw = read('service-worker.js');
const registration = read('smart/smart-runtime-registration.js');
const critical = [
  'smart/smart-services.js',
  'smart/smart-reports-core.js',
  'smart/smart-tabs.js',
  'smart/smart-runtime-registration.js',
  'smart/smart-reports-runtime-controller.js',
  'smart/smart-reports-read-adapter.js',
  'components/tab-render-subscribers.js',
  'runtime/data-ready-screen-hydration.js',
  'components/filters-finalization.js'
];
let passed = 0;
const checks = [];
function check(name, ok) { checks.push([name, !!ok]); if (ok) passed++; }
for (const file of critical) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped + '\\?v=' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  check(`${file} uses the canonical token`, re.test(index));
}
check('runtime registration BUILD uses the canonical token', registration.includes(`var BUILD = '${token}';`));
check('service worker cache namespace uses the canonical token', sw.includes(`const APP_VERSION = '${token}';`));
const forbidden = [
  '10.0.25-smart-reports-sr3-registration',
  '10.0.25-runtime-restoration-b3',
  '10.0.25-smart-reports-sr5-4-read-adapter',
  '10.0.25-smart-reports-sr2-single-controller',
  '10.0.25-runtime-restoration-b2'
];
check('legacy Smart Reports cache tokens removed from critical references', forbidden.every(v => !index.includes(v)));
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
console.log(`RESULT: ${passed}/${checks.length} PASSED`);
if (passed !== checks.length) process.exit(1);
