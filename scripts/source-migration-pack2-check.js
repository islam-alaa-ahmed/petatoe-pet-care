#!/usr/bin/env node
'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const exportFile=path.join(root,'smart','smart-reports-export-engine.js');
const sourceFile=path.join(root,'i18n','smart-reports-source.js');
const indexFile=path.join(root,'index.html');
const source=fs.readFileSync(exportFile,'utf8');
const errors=[];
const arabic=/[\u0600-\u06FF]/;
if(arabic.test(source)) errors.push('Smart Reports export engine still contains Arabic source text.');
if(!fs.readFileSync(indexFile,'utf8').includes('smart/smart-reports-export-engine.js?v=9.2.3-source-migration-pack2')) errors.push('Export engine cache token is not synchronized with v9.2.3.');
function CustomEvent(type,options){this.type=type;this.detail=options&&options.detail;}
const noop=()=>{};
const context={window:{dispatchEvent:noop,addEventListener:noop},document:{},console,CustomEvent};
vm.createContext(context);
vm.runInContext(fs.readFileSync(sourceFile,'utf8'),context,{filename:'smart-reports-source.js'});
const pack=context.window.PETATOE_SMART_REPORTS_TRANSLATIONS||{};
const ar=pack.ar||{}, en=pack.en||{};
const keys=[...source.matchAll(/smartExportT\('([^']+)'/g)].map(m=>m[1]);
const unique=[...new Set(keys)];
unique.forEach(key=>{
  const full='export.'+key;
  if(typeof ar[full]!=='string'||!ar[full].trim()) errors.push('Missing Arabic export key: '+full);
  if(typeof en[full]!=='string'||!en[full].trim()) errors.push('Missing English export key: '+full);
  if(typeof en[full]==='string'&&arabic.test(en[full])) errors.push('Arabic characters found in English export key: '+full);
});
if(errors.length){console.error('Source Migration Pack 2 Check: Failed');errors.forEach(e=>console.error('- '+e));process.exit(1);}
console.log('Source Migration Pack 2 Check: Passed');
console.log('Export localization keys covered:',unique.length);
console.log('Arabic source strings remaining in export engine: 0');
