const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const gate=read('performance/mobile-startup-loading-gate.js');
const core=read('smart/smart-reports-core.js');
const interactions=read('smart/smart-reports-interactions-real.js');
const index=read('index.html');
const smartIndex=gate.indexOf("if(el.getAttribute('data-smart-tab')) return 'smartReports';");
const declaredIndex=gate.indexOf("var declared = el.getAttribute('data-pet-lazy-group');");
const checks=[
 ['Smart sub-tabs resolve before declared lazy groups',smartIndex>=0&&declaredIndex>=0&&smartIndex<declaredIndex],
 ['Sales invoice tab is not capture-blocked by sales group',!/data-smart-tab="salesInvoices"[^>]*data-pet-lazy-group="sales"/.test(core)],
 ['Sales invoice tab opens immediately',/const target=.*?setSmartTab\(target\)/s.test(interactions)],
 ['Sales runtime hydrates from sub-tab handler',/ensureGroup\('sales'\)/.test(interactions)],
 ['Sales invoice report activates after hydration',/injectSalesInvoiceReport\('salesInvoices'\)/.test(interactions)],
 ['Modified cache tokens synchronized',['performance/mobile-startup-loading-gate.js','smart/smart-reports-core.js','smart/smart-reports-interactions-real.js'].every(f=>index.includes(f+'?v=10.0.25-sg4-6-12-sales-invoice-subtab-runtime-1'))]
];
const failed=checks.filter(([,ok])=>!ok);
console.log(`SG-4.6.12 Sales Invoice Sub-tab Runtime: ${failed.length?'FAILED':'PASSED'}`);
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length) process.exit(1);
