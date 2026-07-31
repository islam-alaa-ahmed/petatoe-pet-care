const fs=require('fs');
const index=fs.readFileSync('index.html','utf8');
const nav=fs.readFileSync('navigation/navigation.js','utf8');
const gate=fs.readFileSync('performance/mobile-startup-loading-gate.js','utf8');
const checks=[
 ['topbar reports declares smartReports lazy group',/class="reports-btn"[^>]*data-pet-lazy-group="smartReports"[^>]*data-tab="smart"/.test(index)],
 ['topbar reports declares canonical smart screen',/class="reports-btn"[^>]*data-pet-nav-screen="smart"/.test(index)],
 ['dynamic smart navigation declares lazy group',nav.includes("if(it.tab==='smart')b.setAttribute('data-pet-lazy-group','smartReports')")],
 ['gate maps smart route to smartReports',/smart:'smartReports'/.test(gate)],
 ['post-load refresh renders only active smart panel',gate.includes("if(tabId === 'smart' && smartRuntime")],
 ['post-load refresh does not reopen smart route',!gate.includes("smartRuntime.open('', 'lazy-hydration')")]
];
const failures=checks.filter(x=>!x[1]);
console.log(`PETATOE SG-4.6.4 Smart Reports Load-before-open: ${failures.length?'FAILED':'PASSED'} — ${checks.length-failures.length}/${checks.length}`);
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failures.length)process.exit(1);
