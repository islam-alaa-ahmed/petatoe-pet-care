'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
let remoteCalls=0;
let renders=0;
const listeners={};
const window={
  addEventListener:(name,fn)=>{listeners[name]=fn;},
  PETATOESmartRuntimeRegistration:{ensure:()=>Promise.resolve(true)},
  PETATOESmartServices:{__ready:true,scopedData:()=>[]},
  PETATOESmartTabs:{__ready:true,setSmartTab:()=>true},
  setSmartTab:()=>true,
  renderSmartReports:()=>{renders+=1;},
  clearSmartReportCaches:()=>{},
  petatoeSyncSalesReportsFromSupabase:()=>{
    remoteCalls+=1;
    return new Promise(resolve=>setTimeout(resolve,20));
  },
  petatoeApplySalesRecordsFromRuntime:()=>true,
  records:[]
};
const document={
  addEventListener:(name,fn)=>{listeners[name]=fn;},
  querySelector:()=>null,
  getElementById:()=>null
};
const context={window,document,console,CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;},setTimeout,clearTimeout,Promise};
vm.createContext(context);
const source=fs.readFileSync(path.resolve(__dirname,'../smart/smart-reports-runtime-controller.js'),'utf8');
vm.runInContext(source,context);
Promise.all([
  window.PETATOESmartReportsRuntime.refresh('overview'),
  window.PETATOESmartReportsRuntime.refresh('overview'),
  window.PETATOESmartReportsRuntime.refresh('overview')
]).then(()=>{
  const status=window.PETATOESmartReportsRuntime.getStatus();
  const ok=remoteCalls===1&&renders===1&&status.remoteRefreshCount===1&&status.coalescedRefreshCount===2;
  console.log(`${ok?'PASS':'FAIL'} - concurrent refresh requests share one remote request and one render`);
  console.log(JSON.stringify({remoteCalls,renders,remoteRefreshCount:status.remoteRefreshCount,coalescedRefreshCount:status.coalescedRefreshCount}));
  if(!ok) process.exit(1);
}).catch(error=>{console.error(error);process.exit(1);});
