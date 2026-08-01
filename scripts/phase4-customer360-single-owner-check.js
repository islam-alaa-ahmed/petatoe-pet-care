'use strict';
const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=read('inline-extracted/customer360-runtime-data-binding-fix.js');
const ret=read('inline-extracted/customer360-return.js');
const exec=read('inline-extracted/exec-alerts-block.js');
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
let ok=0,fail=0;function check(name,cond){if(cond){ok++;console.log('PASS',name)}else{fail++;console.error('FAIL',name)}}
check('canonical runtime exported',/window\.PETATOECustomer360Runtime\s*=\s*Object\.freeze\(runtime\)/.test(runtime));
check('canonical runtime owns render show export open back',/render:renderPanel/.test(runtime)&&/show:renderDetail/.test(runtime)&&/exportExcel:exportExcel/.test(runtime)&&/open:open/.test(runtime)&&/back:back/.test(runtime));
check('canonical runtime reads records facade first',runtime.includes('PETATOERecordsReadFacade')&&runtime.includes("consumer:'customer360'"));
check('return module is context only',ret.includes('PETATOECustomer360ReturnContext')&&!ret.includes('window.openPetClient360=')&&!ret.includes('window.renderCustomer360Panel='));
check('exec alerts does not implement customer360 renderer',!exec.includes('window.renderCustomer360Panel=function')&&!exec.includes('window.showCustomer360=function')&&!exec.includes('window.exportCustomer360Excel=function'));
check('exec alerts delegates customer360 core',exec.includes('PETATOECustomer360Runtime')&&exec.includes("typeof runtime.open==='function'"));
check('compatibility globals published only by canonical runtime',[
  'renderCustomer360Panel','showCustomer360','exportCustomer360Excel','openPetClient360','petBackFromCustomer360'
].every(n=>runtime.includes('window.'+n+'=')&&!ret.includes('window.'+n+'=')&&!exec.includes('window.'+n+'=function')));
check('startup gate readiness validates canonical owner',gate.includes("runtime.__owner === 'inline-extracted/customer360-runtime-data-binding-fix.js'"));
check('startup gate refresh delegates canonical runtime',gate.includes("customer360Runtime.render()"));
check('customer360 return context preserved',runtime.includes('ctxApi.capture()')&&runtime.includes('ctxApi.set(ctx)')&&runtime.includes('ctxApi.get()')&&runtime.includes('ctxApi.clear()'));
check('smart tab return uses canonical tabs api',runtime.includes('PETATOESmartTabs.setSmartTab'));
check('phase4 cache tokens applied',index.includes('customer360-return.js?v=10.0.25-phase4-customer360-single-owner-1')&&index.includes('customer360-runtime-data-binding-fix.js?v=10.0.25-phase4-customer360-single-owner-1')&&index.includes('exec-alerts-block.js?v=10.0.25-phase4-customer360-single-owner-1'));
console.log(`Phase 4 Customer 360 Single Owner: ${ok}/${ok+fail} PASSED`);if(fail)process.exit(1);
