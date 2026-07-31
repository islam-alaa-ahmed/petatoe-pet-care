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
check(/operations:\s*function\(\)\{[\s\S]*PETATOEAppointments[\s\S]*typeof appointments\.setTab === 'function'[\s\S]*PETATOEOperationsVehicles[\s\S]*PETATOEOperationsReports[\s\S]*PETATOEOperationsStatus[\s\S]*PETATOEOperationsPayments/.test(gate), 'operations has a complete runtime readiness contract');
check(gate.includes("appointmentsMaster:'operations'") && gate.includes("vehicleOperationsReports:'operations'"), 'operations uses explicit screen identity mapping');
check(gate.includes("if(/appointment|vehicleoperations|operationkpis|operation/.test(marker)) return 'operations';") && gate.indexOf("if(/appointment|vehicleoperations|operationkpis|operation/.test(marker)) return 'operations';") < gate.indexOf("if(/report|analytics/.test(marker)) return 'reportsUI';"), 'operations panel fallback precedes generic reports fallback');
check(gate.includes("if(name === 'operations')") && gate.includes('appointmentsApi: !!appointments') && gate.includes('vehicles: !!window.PETATOEOperationsVehicles') && gate.includes('reports: !!window.PETATOEOperationsReports'), 'operations readiness diagnostics cover primary providers');
check(index.includes('performance/mobile-startup-loading-gate.js?v=10.0.25-sg4-infrastructure-hardening-1'), 'HTML loads the corrected startup gate token');
check(worker.includes("const APP_VERSION = '10.0.25-sg4-infrastructure-hardening-1';"), 'service worker namespace matches the runtime gate fix');
if(process.exitCode) process.exit(process.exitCode);
