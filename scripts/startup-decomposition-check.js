'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const gate = fs.readFileSync(path.join(root, 'performance/mobile-startup-loading-gate.js'), 'utf8');
const checks = [
  ['gate cache token', index.includes('10.0.25-startup-gate-stabilization-1')],
  ['desktop lazy policy', gate.includes('desktopLazyGroups') && gate.includes('shouldLazyLoad')],
  ['generic triggers', gate.includes('function installTriggers(){\n    if(window.__PETATOE_MOBILE_STARTUP_GATE_TRIGGERS__) return;')],
  ['generic ensure loader', gate.includes("if(!isMobile) return waitForDesktopGroup(name);")],
  ['settings users deferred', index.includes("registerOrWrite('settingsSetup','settings/users.js',false)" )],
  ['settings permissions deferred', index.includes("registerOrWrite('settingsSetup','settings/permissions.js?v=9.4.8-settings-localization-phase61',false)" )],
  ['settings runtime deferred', index.includes("registerOrWrite('settingsSetup','settings/settings.js?v=9.4.8-settings-localization-phase61',false)" )],
  ['children bridge deferred', index.includes("registerOrWrite('children','inline-extracted/children-expenses-core.js',false)" )],
  ['sales candidates deferred', index.includes("registerOrWrite('sales','sales/contract-candidates-report.js',false)" )],
  ['xlsx demand loaded', gate.includes('xlsx: true')],
  ['operations demand loaded', gate.includes('operations: true')],
  ['smart reports demand loaded', gate.includes('smartReports: true')]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) failed++;
}
console.log(`Result: ${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
