const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const router=fs.readFileSync(path.join(root,'router/navigation-controller.js'),'utf8');
const nav=fs.readFileSync(path.join(root,'navigation/navigation.js'),'utf8');
const ops=fs.readFileSync(path.join(root,'operations/operations-legacy-engine.js'),'utf8');
let passed=0;
function check(ok,msg){if(!ok){console.error('FAIL - '+msg);process.exitCode=1;}else{passed++;console.log('PASS - '+msg);}}
check(router.includes("appointmentsSubTab='master';\n        navigationScreen='appointmentsMaster';"),'router canonicalizes master sub-route identity');
check(router.includes('currentIntent=canonicalIntent'),'router owns the current route intent');
check(router.includes('currentRouteSequence=routeSequence'),'router owns a monotonic route sequence');
check(router.includes("new CustomEvent('petatoe:routehydrated'"),'router replays exact intent after lazy hydration');
check(nav.includes("window.PETATOERouter.currentIntent.appointmentsSubTab"),'navigation resolves appointments intent from router ownership');
check(ops.includes("document.addEventListener('petatoe:routehydrated'"),'operations runtime consumes hydration replay');
check(ops.includes("router.currentRouteSequence!==d.routeSequence"),'stale hydration cannot switch appointment sub-routes');
if(!process.exitCode)console.log('Phase E5.2.3 Appointments Sub-route Ownership: '+passed+'/7 PASSED');
