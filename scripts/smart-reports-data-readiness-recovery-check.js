const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const router=fs.readFileSync(path.join(root,'smart/smart-router.js'),'utf8');
const checks=[
  ['retry guard not loaded',!index.includes('smart-reports-open-refresh-guard.js')],
  ['first render uses canonical renderer',/legacyRender\.apply\(this, arguments\)/.test(router)],
  ['subsequent renders use local router',/routeSmartReport\(target\)/.test(router)],
  ['ready DOM check retained',/smartAreaReady\(\)/.test(router)],
  ['no 30-second blocking readiness window',!index.includes('DATA_WAIT_TIMEOUT_MS')],
  ['no requestAnimationFrame render queue',!router.includes('scheduleRender')]
];
const failed=checks.filter(x=>!x[1]);
console.log(`Smart Reports Fast Readiness Path: ${failed.length?'FAILED':'PASSED'}`);
checks.forEach(x=>console.log(`${x[1]?'PASS':'FAIL'} - ${x[0]}`));
if(failed.length)process.exit(1);
