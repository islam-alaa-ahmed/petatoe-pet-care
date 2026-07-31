const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const index = read('index.html');
const gate = read('performance/mobile-startup-loading-gate.js');
const runtime = read('smart/smart-reports-runtime-controller.js');
const router = read('smart/smart-router.js');
const lazy = read('performance/lazy-loading-enterprise.js');
const registration = read('smart/smart-runtime-registration.js');
const adapter = read('smart/smart-reports-read-adapter.js');

const checks = [];
const warnings = [];
const add = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const count = (text, needle) => text.split(needle).length - 1;

const critical = [
  'smart/smart-reports-core.js',
  'smart/smart-router.js',
  'smart/smart-runtime-registration.js',
  'smart/smart-reports-runtime-controller.js',
  'smart/smart-reports-read-adapter.js'
];

critical.forEach((file) => add(`critical asset loaded once: ${file}`, count(index, file) === 1, `count=${count(index, file)}`));

add('runtime controller has singleton guard', runtime.includes('if(window.__PETATOE_SMART_REPORTS_RUNTIME_CONTROLLER_SR2__) return;'));
add('router has singleton guard', router.includes('if(window.__PETATOE_SMART_REPORTS_ROUTER_B1__) return;'));
add('registration has singleton guard', registration.includes('if(window.__PETATOE_SMART_RUNTIME_REGISTRATION_SR3__) return;'));
add('canonical runtime exported once', count(runtime, 'window.PETATOESmartReportsRuntime=api;') === 1);
add('canonical render engine exported once', count(router, 'window.PETATOESmartReportsRenderEngine = Object.freeze') === 1);
add('runtime exclusively owns public open API', count(runtime, 'window.PETATOEOpenSmartReports=') === 1 && !index.includes('smart-reports-open-refresh-guard.js'));
add('runtime exclusively owns public refresh API', count(runtime, 'window.PETATOESmartReportsRefresh=') === 1 && !index.includes('smart-reports-open-refresh-guard.js'));
add('render bridge remains router-owned', router.includes('window.renderSmartReports = function(tab)') && !runtime.includes('window.renderSmartReports = function'));
add('smartReports has no blocking reportsUI dependency', /smartReports\s*:\s*\[\s*\]/.test(gate));
add('reportsUI remains optional for smartReports', /optionalDependencies[\s\S]*smartReports\s*:\s*\[\s*['"]reportsUI['"]\s*\]/.test(gate));
add('router-owned hydration remains non-blocking', /ensureGroup\(['"]smartReports['"]\)\.catch/.test(read('router/navigation-controller.js')));
add('remote refresh uses one shared in-flight promise', runtime.includes('var remoteRefreshPromise=null;') && runtime.includes('if(!remoteRefreshPromise)') && runtime.includes('remoteRefreshPromise=null;'));
add('duplicate refresh requests are coalesced', runtime.includes('coalescedRefreshCount+=1;') && runtime.includes('if(forceRemote&&activePromise&&activeRequest&&activeRequest.forceRemote)'));
add('committed revisions suppress duplicate render', runtime.includes('if(revision&&revision===lastRenderedRevision) return;'));
add('runtime listens to committed sales event once', count(runtime, "window.addEventListener('petatoe:sales-records-committed'") === 1);
add('runtime listens to smart tab change once', count(runtime, "document.addEventListener('petatoe:tabchange'") === 1);
add('read adapter is read-only', !/supabase|\.from\(|fetch\(/i.test(adapter));
add('lazy loader does not execute critical runtime assets', !/smart\/(smart-router|smart-reports-runtime-controller|smart-runtime-registration|smart-reports-read-adapter)\.js/.test(lazy));
add('lazy loader marks core as candidate-only', /smart\/smart-reports-core\.js[^\n]+candidate-only/.test(lazy));

const tokenFiles = ['smart/smart-reports-core.js','smart/smart-router.js','smart/smart-runtime-registration.js','smart/smart-reports-runtime-controller.js','smart/smart-reports-read-adapter.js'];
const tokens = {};
for (const file of tokenFiles) {
  const re = new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=([^\"\'&<]+)');
  const m = index.match(re);
  tokens[file] = m ? m[1] : null;
}
const distinctTokens = [...new Set(Object.values(tokens).filter(Boolean))];
if (distinctTokens.length > 1) warnings.push(`Critical Smart Reports cache tokens are not unified: ${distinctTokens.join(', ')}`);
add('all critical assets have cache tokens', Object.values(tokens).every(Boolean), JSON.stringify(tokens));

const failures = checks.filter((c) => !c.pass);
const status = failures.length ? 'FAILED' : warnings.length ? 'PASSED_WITH_WARNINGS' : 'PASSED';
console.log(`SG-4.6.10 Smart Reports Enterprise Certification: ${status}`);
checks.forEach((c) => console.log(`${c.pass ? 'PASS' : 'FAIL'} - ${c.name}${c.detail ? ` (${c.detail})` : ''}`));
warnings.forEach((w) => console.log(`WARN - ${w}`));
console.log(JSON.stringify({ status, checks: checks.length, passed: checks.length - failures.length, failures, warnings, tokens }, null, 2));
process.exit(failures.length ? 1 : 0);
