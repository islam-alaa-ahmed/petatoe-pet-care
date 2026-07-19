#!/usr/bin/env node
const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');const failures=[];const pass=(c,m)=>{if(!c)failures.push(m)};
const core=read('smart/smart-reports-core.js');const engine=read('smart/smart-data-engine.js');const business=read('i18n/localization-center/business-data.js');const router=read('smart/smart-router.js');const index=read('index.html');const vehicles=read('smart/smart-vehicles.js');
pass(!core.includes('data=data.map(function(row){return window.PETATOE_LOCALIZATION_CENTER.localizeBusinessRecord(row);});'),'Smart Reports still localizes every row before calculations.');
pass(!engine.includes('rawSource.map(function(row){return center.localizeBusinessRecord(row);})'),'Smart Data Engine still clones/localizes every source row.');
pass(!business.includes('JSON.stringify([data.services'), 'Business display lookup still serializes all master data per lookup.');
pass(business.includes('if(cache.maps)return cache.maps;'),'Business display cache is not reused directly.');
pass(!router.includes("window.renderSmartVans(invoiceRows());\n        if(typeof window.setSmartTab === 'function') window.setSmartTab('vehicles');"),'Vehicle route still performs duplicate render + tab render.');
pass(!index.includes("renderSmartVans(petatoeSmartReportsRows());\n    setSmartTab('vehicles');"),'Vehicle local rerender still triggers a second tab render.');
pass(vehicles.includes('var matrixCache=Object.create(null);'),'Vehicle matrices are not cached within a render cycle.');
pass(index.includes("PETATOE_RELEASE_VERSION='v9.4.17'"),'Release version is not synchronized.');
const result={status:failures.length?'FAILED':'PASSED',checks:8,failures};
fs.writeFileSync(path.join(root,'DISPLAY_LAYER_LOCALIZATION_PERFORMANCE_RESULTS.json'),JSON.stringify(result,null,2));
console.log('Display-Layer Localization Performance:',result.status);console.log(JSON.stringify(result,null,2));if(failures.length)process.exit(1);
