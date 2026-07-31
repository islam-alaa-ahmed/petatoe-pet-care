const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const router=read('smart/smart-router.js');
const runtime=read('smart/smart-reports-runtime-controller.js');
const index=read('index.html');
const failures=[];
function check(ok,msg){if(!ok)failures.push(msg);}
check(router.includes('var legacyRender = window.renderSmartReports'),'router must capture the proven full renderer before publishing the bridge');
check(router.includes('window.renderSmartReports = function(tab)'),'router must publish the stable synchronous render bridge');
check(router.includes('return renderEngine.apply(this, arguments)'),'render bridge must invoke the internal render engine directly');
check(!runtime.includes('window.renderSmartReports=function'),'runtime must not replace the stable synchronous render bridge');
check(runtime.includes("if(typeof window.renderSmartReports==='function') window.renderSmartReports(tab)"),'public open must build the dashboard body immediately');
check(runtime.includes("requestRender(tab,'public-smart-open',false)"),'runtime must retain asynchronous readiness and synchronization ownership');
check(index.includes('smart/smart-router.js?v=10.0.25-sg4-6-5-smart-reports-nonblocking-navigation-1'),'router cache token must be rotated');
check(index.includes('smart/smart-reports-runtime-controller.js?v=10.0.25-sg4-6-5-smart-reports-nonblocking-navigation-1'),'runtime cache token must be rotated');
if(failures.length){console.error('SG-4.6.3 Smart Reports Render Bridge Recovery: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('SG-4.6.3 Smart Reports Render Bridge Recovery: PASSED (8/8)');
