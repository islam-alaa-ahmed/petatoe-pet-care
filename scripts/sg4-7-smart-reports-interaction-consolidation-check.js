const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const tabs=read('smart/smart-tabs.js');
const interactions=read('smart/smart-reports-interactions-real.js');
const invoice=read('sales/sales-invoice-report.js');
const dark=read('sales/contract-candidates-dark-fix.js');
const checks=[];
function ok(name,pass){checks.push({name,pass:!!pass}); if(!pass) console.error('FAIL:',name)}
ok('Independent smartSalesInvoices group is registered',index.includes("registerOrWrite('smartSalesInvoices','sales/sales-invoice-report.js")&&index.includes("registerOrWrite('smartSalesInvoices','sales/invoice-print-preview.js"));
ok('Invoice report is not owned by full sales group',!index.includes("registerOrWrite('sales','sales/sales-invoice-report.js"));
ok('Startup gate has independent readiness contract',gate.includes('smartSalesInvoices: function()')&&gate.includes("salesInvoices: 'smartSalesInvoices'"));
ok('Smart tabs use per-tab render tokens',tabs.includes('renderTokens: Object.create(null)')&&!tabs.includes('renderToken: 0'));
ok('Forecast inject and render share one activation job',tabs.includes('function activateForecast()')&&tabs.includes('forecast:activateForecast'));
ok('Sales invoices use one activation owner',tabs.includes('function activateSalesInvoices()')&&tabs.includes("ensureRuntime('smartSalesInvoices')"));
ok('Interaction layer delegates tab ownership only',!interactions.includes("ensureGroup('sales')")&&interactions.includes('setSmartTab(target)'));
ok('Retry action is wired',interactions.includes("case 'retry-sales-invoices'")&&tabs.includes('retrySalesInvoices: activateSalesInvoices'));
ok('Invoice injector no longer creates tab dynamically',!invoice.includes("document.createElement('button')")&&!invoice.includes("document.createElement('div')"));
ok('Dark compatibility file no longer creates canonical tab',!dark.includes("btn=document.createElement('button')")&&!dark.includes("sec=document.createElement('div')"));
ok('Touched cache tokens are updated',index.includes('mobile-startup-loading-gate.js?v=10.0.25-sg4-7-6-smart-reports-consolidated-regression-1')&&index.includes('smart/smart-tabs.js?v=10.0.25-sg4-7-6-smart-reports-consolidated-regression-1'));
const failed=checks.filter(x=>!x.pass); console.log(JSON.stringify({status:failed.length?'FAILED':'PASSED',checks:checks.length,failed:failed.map(x=>x.name)},null,2)); process.exit(failed.length?1:0);
