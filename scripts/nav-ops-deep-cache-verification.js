const fs = require('fs');
function read(path){ return fs.readFileSync(path, 'utf8'); }
function assert(ok, message){ if(!ok){ console.error('FAIL:', message); process.exitCode = 1; } else console.log('PASS:', message); }
const defaultToken = '10.0.25-reference-data-runtime-fix-2';
const navigationToken = '10.0.25-reference-data-active-state-fix-5';
const serviceWorkerToken = '10.0.25-sg4-6-1-smart-reports-data-render-recovery-1';
const ownershipToken = serviceWorkerToken;
const routeRegistryToken = '10.0.25-sg2-runtime-validation-1';
const index = read('index.html');
const sw = read('service-worker.js');
const requiredAssets = [
  'navigation/navigation.js','navigation/navigation-state.js','navigation/navigation-schema.js',
  'router/navigation-controller.js','router/route-registry.js',
  'operations/operations-legacy-engine.js','inline-extracted/appointments-core.js'
];
requiredAssets.forEach((asset) => {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expectedToken = asset === 'navigation/navigation.js' ? navigationToken : (asset === 'router/route-registry.js' ? routeRegistryToken : ((asset === 'operations/operations-legacy-engine.js' || asset === 'inline-extracted/appointments-core.js') ? ownershipToken : defaultToken));
  assert(new RegExp(escaped + '\\?v=' + expectedToken).test(index), `${asset} uses its certified cache token`);
});
assert(sw.includes(`const APP_VERSION = '${serviceWorkerToken}';`), 'service worker cache namespace matches the current runtime release');
assert(sw.includes('navigation\\/(?:navigation|navigation-state|navigation-schema)'), 'navigation runtime files are classified as critical');
assert(sw.includes('router\\/(?:navigation-controller|route-registry)'), 'router runtime files are classified as critical');
assert(sw.includes('operations\\/operations-legacy-engine'), 'operations owner is classified as critical');
assert(sw.includes('inline-extracted\\/appointments-core'), 'appointments core is classified as critical');
assert(/if \(criticalRuntimeAsset\) \{\s*event\.respondWith\(networkFirst\(request\)\)/.test(sw), 'critical navigation assets use network-first');
assert(/await deleteLegacyCaches\(\)/.test(sw), 'activation removes previous PETATOE cache namespaces');
if(process.exitCode) process.exit(process.exitCode);
