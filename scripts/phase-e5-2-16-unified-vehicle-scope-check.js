#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const perms=read('settings/permissions.js');
const ops=read('operations/operations-legacy-engine.js');
const com=read('inline-extracted/commission-inline.js');
let passed=0, failed=0;
function check(ok,msg){if(ok){console.log('PASS - '+msg);passed++;}else{console.error('FAIL - '+msg);failed++;}}
check(perms.includes('window.PETATOEVehicleScope=Object.freeze'), 'one canonical vehicle scope runtime is exported');
check(perms.includes('authorizedVehicleNames:authorizedVehicleNames')&&perms.includes('filterVehicleRows:filterVehicleRows'), 'permission API exposes name and row scope filters');
check(perms.includes('petatoeVehicleScopePrevious')&&perms.includes("c.checked=c.dataset.petatoeVehicleScopePrevious==='1'"), 'all-vehicles toggle restores only the prior explicit selection');
check(/function appointmentVehicleNames\(\)[\s\S]*vehicleScopeFilterNames/.test(ops), 'appointment vehicle selector is restricted to authorized vehicles');
check(ops.includes('return vehicleScopeFilterRows(window.PETATOEOperationsAppointments.filterRows(read(),filters))'), 'appointment log filters the underlying rows by vehicle scope');
check(ops.includes('var range=calendarRange(),rows=vehicleScopeFilterRows(read())'), 'timeline and monthly calendar rows are vehicle scoped');
check(ops.includes('var rows=vehicleScopeFilterRows(read()).filter(function(r){return String(r.date||\'\')===String(day)}'), 'dispatch screen is vehicle scoped');
check(ops.includes('return vehicleScopeFilterRows(read().map(function(r){return calcFinancials(r)}))'), 'daily operations and vehicle reports are vehicle scoped');
check(ops.includes("if(selectedVehicleForScope&&!vehicleScopeCanAccess(selectedVehicleForScope))"), 'appointment save rejects unauthorized vehicle injection');
check(com.includes("if(scope&&typeof scope.filterNames==='function')return scope.filterNames(user,cars)"), 'commission statement vehicle filter uses canonical vehicle scope');
check(com.includes('function commissionApplyDataScope')&&com.includes('commissionCanAccessCar(user,r.car)'), 'commission statement rows enforce employee and vehicle scope');
check(com.includes('function renderEmployees(){const st=readStore();const cars=commissionAllowedCars()'), 'commission vehicle selectors use authorized vehicles');
console.log(`Phase E5.2.16 unified vehicle scope: ${passed}/${passed+failed} PASSED`);
process.exit(failed?1:0);
