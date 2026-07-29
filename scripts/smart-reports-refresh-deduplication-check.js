'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const controller=fs.readFileSync(path.join(root,'smart/smart-reports-runtime-controller.js'),'utf8');
const checks=[
  ['tracks active request ownership',controller.includes('var activeRequest=null;')&&controller.includes('activeRequest=request;')&&controller.includes('activeRequest=null;')],
  ['tracks one shared remote refresh promise',controller.includes('var remoteRefreshPromise=null;')&&controller.includes('if(!remoteRefreshPromise)')],
  ['remote request is created once per in-flight cycle',controller.includes('remoteRefreshPromise=Promise.resolve(window.petatoeSyncSalesReportsFromSupabase())')],
  ['remote lock is released in finally',controller.includes("remoteRefreshPromise=null;")&&controller.includes('.finally(function(){')],
  ['repeat refresh clicks join active refresh',controller.includes('forceRemote&&activePromise&&activeRequest&&activeRequest.forceRemote')&&controller.includes('return activePromise;')],
  ['queued duplicate remote refresh is coalesced',controller.includes('forceRemote&&pendingRequest&&pendingRequest.forceRemote')&&controller.includes('return activePromise||drainQueue();')],
  ['refresh diagnostics are exposed',controller.includes('remoteRefreshInFlight:!!remoteRefreshPromise')&&controller.includes('remoteRefreshCount:remoteRefreshCount')&&controller.includes('coalescedRefreshCount:coalescedRefreshCount')],
  ['public refresh still uses canonical request path',controller.includes("refresh:function(tab){return requestRender(tab||currentTab(),'public-refresh',true);}")],
  ['report calculations remain outside controller',!controller.includes('total_inc')&&!controller.includes('payroll')]
];
let failed=0;
for(const [name,ok] of checks){
  console.log(`${ok?'PASS':'FAIL'} - ${name}`);
  if(!ok) failed++;
}
console.log(`Smart Reports Refresh De-duplication: ${checks.length-failed}/${checks.length} PASSED`);
if(failed) process.exit(1);
