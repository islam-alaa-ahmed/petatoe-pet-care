const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
const controller=read('smart/smart-reports-runtime-controller.js');
const subscribers=read('components/tab-render-subscribers.js');
const filters=read('components/filters-finalization.js');
const index=read('index.html');
const failures=[];
function requireTrue(ok,msg){if(!ok)failures.push(msg);}
requireTrue(controller.includes('window.PETATOESmartReportsRuntime=api'),'canonical runtime API missing');
requireTrue(controller.includes("document.addEventListener('petatoe:tabchange'"),'controller must own tabchange');
requireTrue(controller.includes("window.addEventListener('petatoe:records-changed'"),'controller must own records-changed');
requireTrue(!subscribers.includes("if(tabId==='smart')"),'tab subscriber must not own Smart Reports render');
requireTrue(!subscribers.includes('PETATOESmartReportsReadyRender'),'tab subscriber still calls Smart Reports lifecycle API');
requireTrue(filters.includes('window.PETATOESmartReportsRuntime'),'filters must delegate to canonical runtime');
requireTrue(!filters.includes("ensure('smartReports'"),'filters must not own Smart Reports readiness');
requireTrue((index.match(/smart\/smart-reports-runtime-controller\.js/g)||[]).length===1,'runtime controller must load exactly once');
if(failures.length){console.error('Smart Reports single-controller certification: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Smart Reports single-controller certification: PASSED (8/8)');
