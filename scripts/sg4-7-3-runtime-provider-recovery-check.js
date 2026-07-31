const fs=require('fs');
const read=p=>fs.readFileSync(p,'utf8');
const gate=read('performance/mobile-startup-loading-gate.js');
const index=read('index.html');
const exec=read('inline-extracted/exec-alerts-block.js');
const checks=[];
function check(name, ok){checks.push({name,ok:!!ok}); if(!ok) console.error('FAIL:',name);}
check('Dedicated invoice runtime files are registered', index.includes("registerOrWrite('smartSalesInvoices','sales/sales-invoice-report.js") && index.includes("registerOrWrite('smartSalesInvoices','sales/invoice-print-preview.js"));
check('Invoice runtime is not registered only under sales', !index.includes("registerOrWrite('sales','sales/sales-invoice-report.js"));
check('Full sales depends on dedicated invoice runtime', gate.includes("sales: ['reportsUI', 'smartSalesInvoices']"));
check('Dedicated invoice readiness contract exists', gate.includes('smartSalesInvoices: function()') && gate.includes('window.PETATOESalesInvoiceReport'));
check('Customer360 actions use a safe loader', exec.includes('function petOpenCustomer360Safe(name)') && exec.includes("ensureGroup('customer360')"));
check('No direct undeclared openPetClient360 calls remain', !/[^.\w]openPetClient360\s*\(/.test(exec));
check('Explicit BI customer identity is preserved', exec.includes("getAttribute('data-bi-client')"));
check('Runtime provider cache tokens are fresh', index.includes('sg4-7-3-runtime-provider-recovery-1'));
const failed=checks.filter(x=>!x.ok);
console.log(JSON.stringify({status:failed.length?'FAILED':'PASSED',checks:checks.length,passed:checks.length-failed.length,failed:failed.map(x=>x.name)},null,2));
process.exit(failed.length?1:0);
