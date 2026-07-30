#!/usr/bin/env node
'use strict';
const fs = require('fs');
function read(path){ return fs.readFileSync(path, 'utf8'); }
function check(ok, label){
  if(ok) console.log('PASS: ' + label);
  else { console.error('FAIL: ' + label); process.exitCode = 1; }
}
const gate = read('performance/mobile-startup-loading-gate.js');
const index = read('index.html');
const worker = read('service-worker.js');
check(/operations:\s*function\(\)\{[\s\S]*PETATOEAppointments[\s\S]*typeof appointments\.setTab === 'function'/.test(gate), 'operations has an explicit runtime readiness contract');
check(gate.includes("if(/appointment|vehicleoperations|operationkpis|operation|موعد|تشغيل/.test(text)) return 'operations';\n    if(/report|analytics|dashboard report|تقرير|تقارير|تحليلات/.test(text)) return 'reportsUI';"), 'operations element classification precedes generic reports classification');
check(gate.includes("if(/appointment|vehicleoperations|operationkpis|operation/.test(marker)) return 'operations';\n    if(/report|analytics/.test(marker)) return 'reportsUI';"), 'operations panel classification precedes generic reports classification');
check(gate.includes("if(name === 'operations')") && gate.includes('appointmentsApi: !!appointments'), 'operations readiness diagnostics are exposed');
check(index.includes('performance/mobile-startup-loading-gate.js?v=10.0.25-operations-runtime-gate-fix-4'), 'HTML loads the corrected startup gate token');
check(worker.includes("const APP_VERSION = '10.0.25-operations-runtime-gate-fix-4';"), 'service worker namespace matches the runtime gate fix');
if(process.exitCode) process.exit(process.exitCode);
