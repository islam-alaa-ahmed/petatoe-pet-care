const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const gate=read('performance/mobile-startup-loading-gate.js');
const core=read('smart/smart-reports-core.js');
const interactions=read('smart/smart-reports-interactions-real.js');
const index=read('index.html');
const checks=[
  ['smart sub-tabs resolve to smartReports', gate.includes("if(el.getAttribute('data-smart-tab')) return 'smartReports';")],
  ['sales invoice tab exists canonically', core.includes('data-smart-tab="salesInvoices"')],
  ['sales invoice tab lazy-loads sales runtime', core.includes('data-smart-tab="salesInvoices" data-smart-action="smart-tab" data-pet-lazy-group="sales"')],
  ['sales invoice section exists canonically', core.includes('data-smart-section="salesInvoices"><div id="salesInvoiceReportArea"></div>')],
  ['smart action prefers data-smart-tab', interactions.includes("setSmartTab(el.dataset.smartTab||el.dataset.tab||'overview')")],
  ['sales invoice runtime remains registered', index.includes("registerOrWrite('sales','sales/sales-invoice-report.js")],
];
const failures=checks.filter(([,ok])=>!ok).map(([name])=>name);
console.log(JSON.stringify({status:failures.length?'FAILED':'PASSED',checks:checks.length,failures},null,2));
if(failures.length) process.exit(1);
