#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const opsLegacy=read('operations/operations-legacy-engine.js');
const opsFacade=read('inline-extracted/appointments-core.js');
const childLegacy=read('children-expenses/children-legacy-engine.js');
const childFacade=read('inline-extracted/children-expenses-core.js');
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const matrix=read('architecture/PETATOE_MODULE_OWNERSHIP_MATRIX.md');
const checks=[];
function check(name,ok){checks.push({name,ok:!!ok});}
check('Operations legacy publishes legacy namespace',/window\.__PETATOEAppointmentsLegacyEngine\s*=\s*appointmentsPublicApi/.test(opsLegacy));
check('Operations legacy does not publish canonical namespace',!/window\.PETATOEAppointments\s*=\s*appointmentsPublicApi/.test(opsLegacy));
check('Operations facade owns canonical namespace',/__owner:\s*'inline-extracted\/appointments-core\.js'/.test(opsFacade)&&/window\.PETATOEAppointments\s*=\s*facade/.test(opsFacade));
check('Operations facade loads immediately after legacy engine',index.indexOf("operations/operations-legacy-engine.js")<index.indexOf("inline-extracted/appointments-core.js")&&index.indexOf("inline-extracted/appointments-core.js")<index.indexOf("operations/operations-appointments.js"));
check('Operations readiness requires canonical owner',/appointments\.__owner\s*===\s*'inline-extracted\/appointments-core\.js'/.test(gate));
check('Operations readiness requires quarantined legacy engine',/__PETATOEAppointmentsLegacyEngine\.__legacyEngine\s*===\s*true/.test(gate));
check('Children legacy publishes legacy namespace',/window\.__PETATOEChildrenExpensesLegacyEngine\s*=\s*legacyApi/.test(childLegacy));
check('Children legacy does not publish canonical namespace',!/window\.PETATOEChildrenExpenses\s*=\s*legacyApi/.test(childLegacy));
check('Children facade owns canonical namespace',/__owner:\s*'inline-extracted\/children-expenses-core\.js'/.test(childFacade)&&/window\.PETATOEChildrenExpenses\s*=\s*api/.test(childFacade));
check('Children facade loads immediately after legacy engine',index.indexOf("children-expenses/children-legacy-engine.js")<index.indexOf("inline-extracted/children-expenses-core.js")&&index.indexOf("inline-extracted/children-expenses-core.js")<index.indexOf("children-expenses/children-expenses-facade.js"));
check('Children readiness requires canonical owner',/children\.__owner\s*===\s*'inline-extracted\/children-expenses-core\.js'/.test(gate));
check('Children readiness requires quarantined legacy engine',/__PETATOEChildrenExpensesLegacyEngine\.__legacyEngine\s*===\s*true/.test(gate));
check('Ownership matrix documents Operations canonical owner',matrix.includes('Canonical public runtime owner: `inline-extracted/appointments-core.js`'));
check('Ownership matrix documents Children canonical owner',matrix.includes('Canonical public runtime owner: `inline-extracted/children-expenses-core.js`'));
const failed=checks.filter(x=>!x.ok);
checks.forEach(x=>console.log(`${x.ok?'PASS':'FAIL'}: ${x.name}`));
console.log(`\n${checks.length-failed.length} / ${checks.length} PASSED`);
if(failed.length) process.exit(1);
