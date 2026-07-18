const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const failures=[];
const router=read('smart/smart-router.js');
const core=read('smart/smart-reports-core.js');
const i18n=read('i18n/index.js');
const residual=read('i18n/global-screen-translator.js');
const guard=read('smart/smart-reports-open-refresh-guard.js');
function expect(ok,msg){if(!ok)failures.push(msg);}

// Render performance architecture introduced in v9.4.13.
expect(router.includes('__PETATOE_SMART_RENDER_BATCH__'),'Smart render batch guard missing.');
expect(router.includes('__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__'),'Localization suspension missing.');
expect(router.includes('requestAnimationFrame(function(){var target=queuedTab'),'Render coalescing missing.');
expect(router.includes('renderRunning')&&router.includes('queuedTab'),'Render lock/queue missing.');
expect(core.includes('!window.__PETATOE_SMART_RENDER_BATCH__'),'Per-fragment localization suppression missing.');
expect(i18n.includes('window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__'),'Primary localization observer suspension missing.');
expect(residual.includes("language()==='en'&&!window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__"),'Residual translator suspension missing.');
expect(!guard.includes('setTimeout(function(){ setSmartTabSafe(tab); }, 180);'),'Duplicate delayed tab restore remains.');

// v9.4.14 replaces the old eight-retry cap with an event-aware readiness window.
expect(/DATA_WAIT_TIMEOUT_MS\s*=\s*30000/.test(guard),'30-second data readiness window missing.');
expect(/if\s*\(\s*existing\.length\s*&&\s*!force\s*\)/.test(guard),'Readiness wait does not stop immediately when runtime data is available.');
expect(/dataLayerReady\(\)/.test(guard)&&/confirmed\s*:\s*false\s*,\s*empty\s*:\s*false/.test(guard),'Data-layer loading may still be treated as confirmed empty.');
expect(/readiness-final-check/.test(guard),'Final synchronized readiness check missing.');

const result={status:failures.length?'FAILED':'PASSED',checks:12,failures};
console.log('Smart Reports Render Performance:',result.status);
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
