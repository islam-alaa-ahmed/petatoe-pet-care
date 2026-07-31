const fs = require('fs');
const gate = fs.readFileSync('performance/mobile-startup-loading-gate.js','utf8');
const failures = [];
function check(ok,msg){ if(!ok) failures.push(msg); }
check(/smartReports:\s*\[\]/.test(gate), 'Smart Reports still has a blocking reportsUI dependency.');
check(/var optionalDependencies\s*=\s*\{[\s\S]*smartReports:\s*\['reportsUI'\]/.test(gate), 'Smart Reports reportsUI soft dependency is missing.');
check(gate.includes("optionalDependencyQueue.forEach(function(dependency)"), 'Optional dependency hydration path is missing.');
check(gate.includes("ensureGroup(dependency).catch(function(error)"), 'Optional dependency hydration is not non-blocking.');
check(gate.includes("throw new Error('Dependency not ready: ' + dependency + ' -> ' + name)"), 'Required dependencies no longer fail closed.');
console.log('SG-4.6.9 Smart Reports soft UI dependency: ' + (failures.length ? 'FAILED' : 'PASSED'));
if(failures.length){ console.log(JSON.stringify({status:'FAILED',checks:5,failures},null,2)); process.exit(1); }
console.log(JSON.stringify({status:'PASSED',checks:5,failures:[]},null,2));
