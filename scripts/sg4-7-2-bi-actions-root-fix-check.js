const fs = require('fs');
const bi = fs.readFileSync('inline-extracted/bi-kpi-chart.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const checks = [
  ['explicit customer actions', /data-bi-customer-action="customer360"/.test(bi) && /data-bi-customer-action="open"/.test(bi) && /data-bi-customer-action="follow"/.test(bi)],
  ['customer name carried by button', /data-bi-client=/.test(bi)],
  ['customer360 lazy hydration', /ensureGroup\('customer360'\)/.test(bi)],
  ['stable BI customer opener', /PETATOEOpenBICustomer360/.test(bi)],
  ['show more explicit action', /data-bi-action="show-more"/.test(bi) && /data-bi-more=/.test(bi)],
  ['queued render recovery', /queued:false/.test(bi) && /requestBusinessIntelligenceRender/.test(bi)],
  ['BI cache invalidation on more', /biTableCache\.key='';requestBusinessIntelligenceRender\(\)/.test(bi)],
  ['no text-only row routing', !/\/Customer 360\|فتح\|متابعة\//.test(bi)],
  ['cache token updated', index.includes("inline-extracted/bi-kpi-chart.js?v=10.0.25-sg4-7-6-smart-reports-consolidated-regression-1")]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
  if (!ok) failed++;
}
console.log(`SG-4.7.2 BI Actions Root Fix: ${checks.length-failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
