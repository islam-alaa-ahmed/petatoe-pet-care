const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const router=fs.readFileSync(path.join(root,'smart/smart-router.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'smart/smart-reports-runtime-controller.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const serviceWorker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const failures=[];

// SG-4.3 ownership contract: the runtime controller owns the stable public lifecycle API.
if(!/window\.PETATOEOpenSmartReports\s*=\s*function\s*\([^)]*\)\s*\{\s*return\s+api\.open\(/s.test(runtime)){
  failures.push('Stable Smart Reports public API is not exported by the canonical runtime controller.');
}
if(!/window\.renderSmartReports\s*=\s*function\s*\([^)]*\)/s.test(router) ||
   !/return\s+renderEngine\.apply\(this,\s*arguments\)/s.test(router)){
  failures.push('Stable Smart Reports synchronous render bridge is not exported by smart-router.js.');
}
if(/window\.renderSmartReports\s*=(?!=)/.test(runtime)){
  failures.push('Runtime controller must not replace the stable synchronous render bridge.');
}
if(/window\.PETATOEOpenSmartReports\s*=/.test(router)){
  failures.push('Smart router must not export a competing public open controller.');
}
if(!/window\.PETATOESmartReportsRenderEngine\s*=/.test(router)){
  failures.push('Smart Reports internal render engine is not exported.');
}
if(!index.includes("PETATOEInlineHandlers.moduleCall('router','openTab','smart','overview')")){
  failures.push('Header Reports button is not using the canonical router path.');
}
if(index.includes("onclick=\"return PETATOEOpenSmartReports('overview',event)\"")){
  failures.push('Header still depends exclusively on a load-order-sensitive global function.');
}

// Cache token follows the application release version, not the localization pack version.
const appVersionMatch=serviceWorker.match(/\bAPP_VERSION\s*=\s*['"]([^'"]+)['"]/);
const expectedAppVersion=appVersionMatch?appVersionMatch[1]:'';
if(!expectedAppVersion){
  failures.push('Canonical application release version is missing from service-worker.js.');
}else{
  if(!index.includes(`smart/smart-router.js?v=${expectedAppVersion}`)){
    failures.push('Smart router cache token is not synchronized with APP_VERSION.');
  }
  if(!index.includes(`smart/smart-reports-runtime-controller.js?v=${expectedAppVersion}`)){
    failures.push('Smart Reports runtime controller cache token is not synchronized with APP_VERSION.');
  }
}

const result={status:failures.length?'FAILED':'PASSED',checks:9,failures};
console.log('Smart Reports Public API: '+result.status);
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exit(1);
