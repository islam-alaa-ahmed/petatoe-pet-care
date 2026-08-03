const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const ops = read('operations/operations-legacy-engine.js');
const version = JSON.parse(read('config/petatoe-version.json'));
const checks = [
  ['appointment tab initializes base controls before render', /function setTab\(tab\)\{[\s\S]{0,900}initBase\(\)/.test(ops)],
  ['empty appointment form creates first animal row', /appointmentAnimalsRows'[\s\S]{0,120}renderAppointmentAnimalsRows\(\[\{\}\]\)/.test(ops)],
  ['empty appointment form creates first service row', /appointmentServicesRows'[\s\S]{0,120}renderAppointmentServicesRows\(\[\{\}\]\)/.test(ops)],
  ['appointment form hydrates payroll runtime', /ensureAppointmentFormSources[\s\S]{0,700}ensureGroup\('payroll'\)/.test(ops)],
  ['appointment form hydrates isolated setup reference runtime', /ensureAppointmentFormSources[\s\S]{0,700}ensureSetupReferenceSource\(\)/.test(ops)],
  ['appointment controls refresh after payroll data', /payroll-read-facade-refreshed[\s\S]{0,180}refreshAppointmentFormScreen/.test(ops)],
  ['appointment controls refresh after reference data', /reference-registry-updated[\s\S]{0,180}refreshAppointmentFormScreen/.test(ops)],
  ['appointment controls refresh after localization', /localization-center-ready[\s\S]{0,180}refreshAppointmentFormScreen/.test(ops)],
  ['animal lookup values are preserved during refresh', /refreshAppointmentAnimalLookups[\s\S]{0,700}typeValue[\s\S]{0,500}breedValue[\s\S]{0,500}sizeValue/.test(ops)],
  ['operation assignment lookups are refreshed', /refreshAppointmentFormScreen[\s\S]{0,700}refreshLookupSelects\(\)/.test(ops)],
  ['appointment certification contract is registered', version.runtimeContracts.appointmentScreenCertification === '10.0.25-phase-e5-2-appointment-readiness-contract-1']
];
let passed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
  if (ok) passed++;
}
console.log(`Phase E5.2 Appointment Screen Certification: ${passed}/${checks.length} PASSED`);
if (passed !== checks.length) process.exit(1);
