const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const gatePath = path.join(root, 'performance', 'mobile-startup-loading-gate.js');
const source = fs.readFileSync(gatePath, 'utf8');

const checks = [
  {
    name: 'Desktop path does not resolve immediately',
    pass: !/if\s*\(\s*!isMobile\s*\)\s*return\s+Promise\.resolve\(true\)/.test(source)
  },
  {
    name: 'Smart Reports readiness requires renderer',
    pass: /typeof\s+window\.renderSmartReports\s*===\s*['"]function['"]/.test(source)
  },
  {
    name: 'Smart Reports readiness requires scoped data provider',
    pass: /typeof\s+window\.smartServicesScopedData\s*===\s*['"]function['"]/.test(source)
  },
  {
    name: 'Smart Reports readiness requires protected tabs API',
    pass: /tabs\s*&&\s*tabs\.__ready\s*&&\s*typeof\s+tabs\.setSmartTab\s*===\s*['"]function['"]/.test(source)
  },
  {
    name: 'Smart Reports readiness requires global compatibility bridge',
    pass: /typeof\s+window\.setSmartTab\s*===\s*['"]function['"]/.test(source)
  },
  {
    name: 'Payroll readiness requires openTab',
    pass: /typeof\s+window\.PETATOEPayroll\.openTab\s*===\s*['"]function['"]/.test(source)
  },
  {
    name: 'Payroll readiness requires renderSalarySlip',
    pass: /typeof\s+window\.PETATOEPayroll\.renderSalarySlip\s*===\s*['"]function['"]/.test(source)
  },
  {
    name: 'Payroll readiness requires exportCsv',
    pass: /typeof\s+window\.PETATOEPayroll\.exportCsv\s*===\s*['"]function['"]/.test(source)
  },
  {
    name: 'Smart Reports provider is not duplicated by desktop fallback',
    pass: !/var\s+desktopProviderFallbacks\s*=\s*\{[^}]*smartReports\s*:/.test(source)
  }
];

const failures = checks.filter((check) => !check.pass);
if (failures.length) {
  console.error('PETATOE Runtime Readiness Contract Certification: FAILED');
  failures.forEach((failure) => console.error(`- ${failure.name}`));
  process.exit(1);
}

console.log('PETATOE Runtime Readiness Contract Certification: PASSED');
console.log(JSON.stringify({ checks: checks.length, failures: 0 }, null, 2));
