const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
const core=read('inline-extracted/legacy-application-core.js');
const controller=read('smart/smart-reports-runtime-controller.js');
const failures=[];
function ok(value,message){if(!value)failures.push(message);}
ok(core.includes("window.addEventListener('petatoe:records-changed'"),'canonical sales bridge must own raw records-changed');
ok(core.includes("new CustomEvent('petatoe:sales-records-committed'"),'canonical bridge must emit post-commit event');
ok(!controller.includes("window.addEventListener('petatoe:records-changed'"),'Smart Reports controller must not consume raw records-changed');
ok(controller.includes("window.addEventListener('petatoe:sales-records-committed'"),'Smart Reports controller must consume post-commit event');
ok(controller.includes("skipSync:skipSync===true"),'post-commit render must support sync bypass');
ok(controller.includes("if(request.skipSync===true) return true"),'post-commit render must not recommit rows');
ok(controller.includes("if(activePromise||!smartIsOpen()) return"),'controller must suppress duplicate render during active lifecycle request');
if(failures.length){console.error('Smart Reports event ownership certification: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Smart Reports event ownership certification: PASSED (7/7)');
