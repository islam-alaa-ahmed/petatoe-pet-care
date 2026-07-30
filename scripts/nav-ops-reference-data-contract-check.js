#!/usr/bin/env node
'use strict';
const fs = require('fs');
function read(p){ return fs.readFileSync(p,'utf8'); }
function check(ok, label){ if(!ok){ console.error('FAIL:', label); process.exitCode=1; } else console.log('PASS:', label); }
const perms=read('navigation/navigation-permissions.js');
const nav=read('navigation/navigation.js');
const router=read('router/navigation-controller.js');
const state=read('navigation/navigation-state.js');
const registry=read('router/route-registry.js');
const ops=read('operations/operations-legacy-engine.js');
check(/'appointments-master':'appointments', appointmentsMaster:'appointments'/.test(perms), 'reference-data permission aliases use appointments permission');
check(/appointmentsSubTab:'master',screen:'appointmentsMaster'/.test(nav), 'reference-data button carries master sub-route');
check(/requestedId==='appointmentsMaster'\|\|requestedId==='appointments-master'/.test(router), 'router recognizes reference-data aliases');
check(/routeIntent\.appointmentsSubTab='master'/.test(router), 'router infers master sub-route from aliases');
check(/buttonSubTab===requestedAppointmentsSubTab/.test(router), 'router active marker distinguishes appointments sub-routes');
check(/screenForPanel\(panel, appointmentsTab\)/.test(state), 'navigation state checks composite appointments identity');
check(/canOpenPanel\(s\.panel, s\.appointmentsTab\)/.test(state), 'state restore permission uses saved appointments sub-route');
check(/aliasIntents:\{appointmentsMaster:\{appointmentsSubTab:'master'\}/.test(registry), 'route registry records alias sub-route contract');
check(/setTab\(requestedSubTab\)/.test(ops), 'operations applies requested sub-route');
if(process.exitCode){ console.error('PETATOE reference-data navigation contract: FAILED'); process.exit(process.exitCode); }
console.log('PETATOE reference-data navigation contract: PASSED');
