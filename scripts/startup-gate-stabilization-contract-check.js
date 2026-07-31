'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const gate = fs.readFileSync(path.join(root, 'performance/mobile-startup-loading-gate.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
let passed = 0;
function check(condition, message){
  if(!condition){ console.error('FAIL:', message); process.exitCode = 1; return; }
  passed += 1; console.log('PASS:', message);
}
const contracts = ['xlsx','operations','warehouses','treasury','children','commission','settingsSetup','diagnostics','fleet','obligations','movement','localizationRemote','payroll','smartReports','customer360','reportsUI','sales','printing'];
contracts.forEach(name => check(new RegExp('\\b'+name+': function\\(\\)').test(gate), 'readiness contract: '+name));
check(gate.includes("return typeof contract === 'function' ? contract() === true : false;"), 'unknown groups are not treated as ready');
check(gate.includes("throw new Error('Dependency not ready: ' + dependency + ' -> ' + name)"), 'failed dependencies stop dependent group loading');
check(gate.includes("if(el.id === 'sideLauncher'"), 'sidebar launcher excluded from lazy classification');
check(gate.includes("var panel = el.closest ? el.closest('.panel,[data-panel]') : null;"), 'internal controls inherit active panel group');
check(gate.indexOf("data-pet-nav-screen") >= 0 && gate.indexOf('screenGroupMap') >= 0, 'explicit screen identity mapping');
check(gate.includes("appointmentsMaster:'operations'"), 'reference data maps to operations');
check(gate.includes("vehicleOperationsReports:'operations'"), 'vehicle reports map to operations');
check(gate.includes("childrenExpenses:'children'"), 'children expenses map to children');
check(gate.includes("customer360:'customer360'"), 'Customer 360 owns an isolated lazy group');
check(index.includes("registerOrWrite('customer360','inline-extracted/customer360-runtime-data-binding-fix.js"), 'Customer 360 runtime registered in its isolated group');
check(gate.includes("window.PETATOEOperationsVehicles") && gate.includes("window.PETATOEOperationsReports") && gate.includes("window.PETATOEOperationsStatus") && gate.includes("window.PETATOEOperationsPayments"), 'operations contract covers all primary providers');
check(index.includes('performance/mobile-startup-loading-gate.js?v=10.0.25-sg4-6-operations-children-ownership-1'), 'HTML uses stabilization cache token');
check(worker.includes("const APP_VERSION = '10.0.25-sg4-6-operations-children-ownership-1';"), 'service worker cache namespace matches');
if(process.exitCode) process.exit(process.exitCode);
console.log(`Startup Gate Stabilization Contract: PASSED — ${passed} checks`);
