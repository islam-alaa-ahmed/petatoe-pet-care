#!/usr/bin/env node
'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const customers=read('smart/smart-customers.js');
const interactions=read('smart/smart-reports-interactions-real.js');
const tabs=read('smart/smart-tabs.js');
const optimizer=read('smart/smart-reports-performance-optimizer.js');
const runtime=read('smart/smart-reports-runtime-controller.js');
const checks=[];
function add(name,ok){checks.push([name,!!ok]);}
add('customer interactions publish one canonical controller',customers.includes("__owner: 'smart/smart-customers.js#phase3'")&&customers.includes('window.petatoeSmartCustomersHandleAction = handleClick'));
add('smart-customers owns only one delegated click listener',(customers.match(/document\.addEventListener\('click'/g)||[]).length===1);
add('legacy v6.4.159 customer action owner removed',!customers.includes('__PETATOE_SMART_CUSTOMERS_ALL_FILTERS_V159__'));
add('new customer actions included in canonical owner',customers.includes("action === 'new-customer-year' || action === 'new-customer-period' || action === 'new-customer-more'"));
add('generic interactions delegate customer controls',interactions.includes('customerOwnedActions')&&interactions.includes('window.petatoeSmartCustomersHandleAction'));
add('generic interactions no longer mutate inactive customer state',!interactions.includes("case 'inactive-sort'")&&!interactions.includes("case 'inactive-more'"));
add('generic interactions no longer mutate new customer state',!interactions.includes("case 'new-customer-year'")&&!interactions.includes("case 'new-customer-period'")&&!interactions.includes("case 'new-customer-more'"));
add('smart tabs reads through canonical records facade',tabs.includes('window.PETATOERecordsReadFacade')&&tabs.includes("facade.readRows({consumer:'smart-tabs'})"));
add('optimizer never overwrites setSmartTab',!optimizer.includes('window.setSmartTab =')&&!optimizer.includes('PETATOESmartTabs.setSmartTab ='));
add('optimizer observes canonical rendered event',optimizer.includes("addEventListener('petatoe:smart-tab-rendered'"));
add('runtime remains sole public open owner',(runtime.match(/window\.PETATOEOpenSmartReports=/g)||[]).length===1);
add('runtime remains sole public refresh owner',(runtime.match(/window\.PETATOESmartReportsRefresh=/g)||[]).length===1);
let failed=checks.filter(x=>!x[1]);
checks.forEach(([n,ok])=>console.log(`${ok?'PASS':'FAIL'} - ${n}`));
console.log(`\nPhase 3 Smart Reports Runtime & Event Ownership: ${checks.length-failed.length}/${checks.length} PASSED`);
if(failed.length) process.exit(1);
