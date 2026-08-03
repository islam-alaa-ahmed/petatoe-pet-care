'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const ops=fs.readFileSync(path.join(root,'operations/operations-legacy-engine.js'),'utf8');
const version=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
  ['permission isolation contract registered',version.runtimeContracts.appointmentPermissionIsolation==='10.0.25-phase-e5-2-1-reference-only-loader-contract-1'],
  ['reference-only setup loader exists',ops.includes('function ensureSetupReferenceSource()')],
  ['appointment source hydration does not load settings permission group',!(/function ensureAppointmentFormSources\(\)[\s\S]*?ensureGroup\('settingsSetup'\)/.test(ops))],
  ['vehicle staff source hydration does not load settings permission group',!(/function ensureVehicleStaffSources\(\)[\s\S]*?ensureGroup\('settingsSetup'\)/.test(ops))],
  ['reference loader targets setup module only',ops.includes("script.src='settings/setup.js?v='")],
  ['payroll dependency remains lazy hydrated',ops.includes("jobs.push(gate.ensureGroup('payroll'))")],
  ['appointment readiness contract retained',version.runtimeContracts.appointmentScreenCertification==='10.0.25-phase-e5-2-appointment-readiness-contract-1']
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)failed++;}
console.log(`Phase E5.2.1 Appointment Permission Isolation: ${checks.length-failed}/${checks.length} PASSED`);
if(failed)process.exit(1);
