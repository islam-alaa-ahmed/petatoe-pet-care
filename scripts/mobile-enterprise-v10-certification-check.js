#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const failures = [];
const checks = [];

function pass(name) { checks.push({ name, status: 'PASS' }); }
function fail(name, detail) {
  checks.push({ name, status: 'FAIL', detail });
  failures.push(`${name}: ${detail}`);
}
function requireCheck(condition, name, detail) {
  if (condition) pass(name); else fail(name, detail);
}
function count(text, token) {
  return text.split(token).length - 1;
}

const cssAssets = [
  'css/mobile/mobile-enterprise-v10-shell.css',
  'css/mobile/mobile-enterprise-v10-dashboard.css',
  'css/mobile/mobile-enterprise-v10-reports.css',
  'css/mobile/mobile-enterprise-v10-management.css',
  'css/mobile/mobile-enterprise-v10-experience.css'
];
const jsAssets = [
  'mobile/mobile-enterprise-v10-shell.js',
  'mobile/mobile-enterprise-v10-dashboard.js',
  'mobile/mobile-enterprise-v10-reports.js',
  'mobile/mobile-enterprise-v10-management.js',
  'mobile/mobile-enterprise-v10-experience.js'
];
const allAssets = [...cssAssets, ...jsAssets];
const index = read('index.html');
const worker = read('service-worker.js');
const pwaManager = read('pwa/pwa-manager.js');
const workflow = read('.github/workflows/localization-lockdown.yml');

for (const asset of allAssets) {
  requireCheck(exists(asset), `Asset exists: ${asset}`, 'Required V10 mobile asset is missing.');
  requireCheck(count(index, asset) === 1, `Single index reference: ${asset}`, `Expected exactly one index.html reference, found ${count(index, asset)}.`);
  requireCheck(worker.includes(`'./${asset}'`), `Service Worker pre-cache: ${asset}`, 'Asset is not listed in APP_SHELL.');
}

for (const cssFile of cssAssets) {
  const css = read(cssFile);
  requireCheck(/@media\s*\(max-width:\s*760px\)/.test(css), `Phone boundary: ${cssFile}`, 'Missing max-width: 760px mobile boundary.');
  const desktopBlocks = [...css.matchAll(/@media\s*\(min-width:\s*761px\)\s*\{([\s\S]*?)\n\}/g)].map((match) => match[1]);
  requireCheck(desktopBlocks.every((block) => /display\s*:\s*none\s*!important/.test(block) && !/body\s*\{|#dashboard\s*\{/.test(block)), `Desktop cleanup isolation: ${cssFile}`, 'A min-width:761px block may only hide V10 mobile-only controls.');
  let balance = 0;
  for (const character of css) {
    if (character === '{') balance += 1;
    if (character === '}') balance -= 1;
    if (balance < 0) break;
  }
  requireCheck(balance === 0, `CSS brace balance: ${cssFile}`, `Unbalanced CSS braces (${balance}).`);
}

for (const jsFile of jsAssets) {
  const js = read(jsFile);
  requireCheck(!/[\u0600-\u06FF]/.test(js), `No hard-coded Arabic UI: ${jsFile}`, 'Arabic source text must be resolved through the canonical localization center.');
  const hasNamedGuard = /PHONE_QUERY\s*=\s*['"]\(max-width:\s*760px\)['"]/.test(js) && /matchMedia\(PHONE_QUERY\)/.test(js);
  const hasDirectGuard = /matchMedia\(['"]\(max-width:\s*760px\)['"]\)/.test(js);
  requireCheck(hasNamedGuard || hasDirectGuard, `Phone runtime guard: ${jsFile}`, 'Missing an explicit max-width:760px runtime guard.');
}

requireCheck(worker.includes("const APP_VERSION = '10.0.0-pwa-update-engine-p1';"), 'Service Worker version lock', 'Unexpected Service Worker APP_VERSION; update the certification rule with an intentional release change.');
requireCheck(worker.includes('NETWORK_FIRST_EXTENSIONS'), 'PWA network-first source policy', 'Service Worker must use a network-first policy for HTML, JavaScript, CSS and JSON resources.');
requireCheck(worker.includes('PETATOE_SW_ACTIVATED'), 'PWA activation broadcast', 'Service Worker must broadcast activation to controlled clients.');
requireCheck(pwaManager.includes("updateViaCache: 'none'"), 'PWA update bypass', 'Service Worker registration must bypass the HTTP cache during update checks.');
requireCheck(pwaManager.includes('registration.update()'), 'PWA active update checks', 'PWA Manager must actively request Service Worker update checks.');
requireCheck(pwaManager.includes('visibilitychange'), 'PWA foreground update check', 'PWA Manager must check for updates when the installed app returns to the foreground.');
requireCheck(index.includes('viewport-fit=cover'), 'iOS Safe Area viewport', 'viewport-fit=cover is required for installed iPhone PWA mode.');
requireCheck(workflow.includes('node scripts/mobile-enterprise-v10-certification-check.js'), 'GitHub Actions mobile certification gate', 'The mobile certification script is not wired into GitHub Actions.');
requireCheck(index.indexOf('mobile-enterprise-v10-shell.js') < index.indexOf('mobile-enterprise-v10-dashboard.js') &&
  index.indexOf('mobile-enterprise-v10-dashboard.js') < index.indexOf('mobile-enterprise-v10-reports.js') &&
  index.indexOf('mobile-enterprise-v10-reports.js') < index.indexOf('mobile-enterprise-v10-management.js') &&
  index.indexOf('mobile-enterprise-v10-management.js') < index.indexOf('mobile-enterprise-v10-experience.js'),
  'V10 runtime load order', 'Expected shell → dashboard → reports → management → experience order.');

const report = {
  certification: failures.length === 0 ? 'PASSED' : 'FAILED',
  suite: 'PETATOE Mobile Enterprise UI v10',
  checks: checks.length,
  failures: failures.length,
  assets: allAssets.length,
  generatedAt: new Date().toISOString(),
  details: checks
};
fs.writeFileSync(path.join(root, 'MOBILE_ENTERPRISE_V10_CERTIFICATION_RESULTS.json'), JSON.stringify(report, null, 2) + '\n');

if (failures.length) {
  console.error('PETATOE Mobile Enterprise UI v10 certification: FAILED');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('PETATOE Mobile Enterprise UI v10 certification: PASSED');
console.log(JSON.stringify({ checks: checks.length, failures: 0, assets: allAssets.length }, null, 2));
