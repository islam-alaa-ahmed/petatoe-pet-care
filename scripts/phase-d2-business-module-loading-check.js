#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const gate=fs.readFileSync(path.join(root,'performance/mobile-startup-loading-gate.js'),'utf8');
const routes=fs.readFileSync(path.join(root,'router/route-registry.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
let passed=0,failed=0;
function check(ok,label){ if(ok){passed++;console.log('PASS - '+label);}else{failed++;console.error('FAIL - '+label);} }
check(gate.includes('function registryLoadGroup(routeId)'),'loader resolves route ownership from canonical registry');
check(gate.includes("var registryGroup = registryLoadGroup(screen) || registryLoadGroup(route)"),'route registry precedes legacy screen-map fallback');
check(gate.includes('var nonBlockingBusinessGroups = {'),'business navigation has an explicit non-blocking policy');
['operations','fleet','children','warehouses','treasury','payroll','commission','obligations','customer360','salesEntry','salesImport','salesRecords','salesAnalytics','smartSalesInvoices','smartReports'].forEach(group=>check(gate.includes(group+':true'),group+' navigation hydrates in background'));
check(!gate.includes("if(group === 'salesRecords') return false;"),'records route uses non-blocking canonical panel activation');
check(gate.includes("el.getAttribute('data-pet-lazy-blocking') === 'true'"),'actions may explicitly retain blocking dependency safety');
check(gate.includes('shouldHydrateRouteInBackground(el, group)'),'click interception distinguishes route navigation from business actions');
check(gate.includes('ensureRoute: ensureRoute'),'route hydration API is public');
check(gate.includes('registryLoadGroup: registryLoadGroup'),'registry load-group resolver is public for diagnostics');
['operations','warehouses','treasury','payroll','salarySlip','commissions','commissionStatement','entry','import','records','obligations'].forEach(route=>check(new RegExp("register\\('"+route+"'.*loadGroup:").test(routes),route+' has canonical loadGroup metadata'));
check(manifest.runtimeContracts.businessModuleLoading==='10.0.25-phase-d2-route-owned-business-hydration-contract-1','business module loading runtime contract is registered');
console.log(`Phase D2 business module loading: ${passed}/${passed+failed} PASSED`);
if(failed) process.exit(1);
