const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const legacy=fs.readFileSync(path.join(root,'inline-extracted/legacy-application-core.js'),'utf8');
const controller=fs.readFileSync(path.join(root,'smart/smart-reports-runtime-controller.js'),'utf8');
const checks=[
  ['deterministic revision function',/function\s+petatoeSalesCommitRevision\s*\(/.test(legacy)],
  ['duplicate revision guard',/previous&&previous\.revision===revision/.test(legacy)],
  ['duplicate commit does not dispatch',/previous\.duplicateCount=[\s\S]*?return true;/.test(legacy)],
  ['commit state is published',/__PETATOE_SALES_REPORTS_COMMIT_STATE__=\{/.test(legacy)],
  ['commit event carries revision',/revision:revision/.test(legacy)],
  ['controller tracks rendered revision',/var\s+lastRenderedRevision=/.test(controller)],
  ['controller ignores rendered revision events',/revision&&revision===lastRenderedRevision/.test(controller)],
  ['controller exposes revision status',/lastRenderedRevision:lastRenderedRevision/.test(controller)]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('Smart Reports idempotent commit certification: FAILED');
  failed.forEach(([name])=>console.error('- '+name));
  process.exit(1);
}
console.log(`Smart Reports idempotent commit certification: PASSED (${checks.length}/${checks.length})`);
