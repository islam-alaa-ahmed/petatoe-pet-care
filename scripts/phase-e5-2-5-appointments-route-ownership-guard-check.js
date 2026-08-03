'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const ops=read('operations/operations-legacy-engine.js');
const router=read('router/navigation-controller.js');
const nav=read('navigation/navigation.js');
const checks=[];
function check(name,ok){checks.push({name,ok:!!ok});console.log((ok?'PASS':'FAIL')+' - '+name);}
check('operations engine reads canonical router-owned appointments sub-route',/function\s+routerOwnedAppointmentsSubTab\s*\(/.test(ops)&&/router\.currentIntent/.test(ops));
check('master route rejects delayed resets to add',/routerOwnedTab==='master'&&tab!=='master'/.test(ops));
check('explicit router navigation retains canonical master identity',/appointmentsSubTab==='master'\|\|navigationScreen==='appointmentsMaster'/.test(router));
check('router stores current intent and route sequence',/PETATOERouter\.currentIntent=canonicalIntent/.test(router)&&/PETATOERouter\.currentRouteSequence=routeSequence/.test(router));
check('canonical navigation publishes master sub-route',/appointmentsSubTab:'master',screen:'appointmentsMaster'/.test(nav));
check('route hydration replay remains sequence guarded',/router\.currentRouteSequence!==d\.routeSequence/.test(ops));
const failed=checks.filter(x=>!x.ok);
console.log(`Phase E5.2.5 appointments route ownership guard: ${checks.length-failed.length}/${checks.length} PASSED`);
if(failed.length)process.exit(1);
