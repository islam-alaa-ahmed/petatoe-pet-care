const fs = require('fs');
function read(path){ return fs.readFileSync(path,'utf8'); }
const nav = read('router/navigation-controller.js');
const index = read('index.html');
const sw = read('service-worker.js');
const version = '10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1';
const checks = [
  ['route hydration helper exists', nav.includes('function hydrateRouteRuntime(tabId)')],
  ['smart route owns hydration', nav.includes("gate.ensureGroup('smartReports')")],
  ['hydration runs from openTab', nav.includes('hydrateRouteRuntime(tabId);')],
  ['hydration is non-blocking', nav.includes(".catch(function(error)") && !nav.includes("return gate.ensureGroup('smartReports')")],
  ['navigation controller cache token synchronized', index.includes('router/navigation-controller.js?v='+version)],
  ['service worker release synchronized', sw.includes("const APP_VERSION = '"+version+"';")]
];
const failed = checks.filter(([,ok])=>!ok);
console.log('PETATOE SG-4.6.7 Router-owned Smart Reports Hydration');
checks.forEach(([name,ok])=>console.log(`${ok?'PASS':'FAIL'} - ${name}`));
if(failed.length){ process.exit(1); }
console.log(`${checks.length} / ${checks.length} PASSED`);
