'use strict';
/* Phase 1A safety: preview only. Write mode is intentionally locked until Phase 1B. */
const fs = require('fs');
const path = require('path');
const { rootDir, readManifest } = require('./version-manifest-lib');
const root = rootDir();
const { data:m } = readManifest(root);
if(process.argv.includes('--write')){
  console.error('Write mode is locked in Phase 1A. Use Phase 1B after regression approval.');
  process.exit(2);
}
const index = fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw = fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const currentSw = (sw.match(/\bAPP_VERSION\s*=\s*['"]([^'"]+)['"]/)||[])[1] || '(missing)';
const currentGate = (index.match(/performance\/mobile-startup-loading-gate\.js\?v=([^'"&<\s]+)/)||[])[1] || '(missing)';
console.log('Phase 1A synchronization preview');
console.log(`service-worker APP_VERSION: ${currentSw} -> ${m.cacheVersion}`);
console.log(`startup gate cache token: ${currentGate} -> ${m.cacheVersion}`);
console.log(`release label: -> ${m.releaseLabel}`);
console.log(`release name: -> ${m.releaseName}`);
console.log('No files changed.');
