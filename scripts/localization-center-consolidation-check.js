#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const html=read('index.html'),release=read('RELEASE_VERSION.txt'),bridge=read('i18n/localization-center/consolidation.js');
assert(html.includes('i18n/localization-center/consolidation.js?v=9.3.6-localization-center-consolidation'),'consolidation bridge is not loaded');
assert(release.includes('PETATOE v9.3.6')&&release.includes('ELC_V9_3_6_LOCALIZATION_CENTER_CONSOLIDATION'),'release metadata mismatch');
assert(bridge.includes("registerModule('operationsSource'"),'operations source is not registered');
assert(bridge.includes("registerModule('warehouseSource'"),'warehouse source is not registered');
assert(bridge.includes("registerModule('smartReportsSource'"),'smart reports source is not registered');
assert(bridge.includes("registerModule('runtimeSource'"),'runtime source is not registered');
assert(read('operations/operations-legacy-engine.js').includes("c.t('operationsSource.'+key"),'opT is not a Center adapter');
assert(read('warehouses/warehouse-core.js').includes("c.t('warehouseSource.'+k"),'whT is not a Center adapter');
assert(!read('i18n/global-screen-translator.js').includes('window.PETATOE_I18N.translateRuntime(original'),'global translator bypasses the Center');

const match=bridge.match(/var runtimeMap=(\{[\s\S]*?\n\});\n  function lang/);
assert(match,'runtime dictionary could not be parsed');
const runtimeMap=JSON.parse(match[1]);
const ctx={window:{},document:{documentElement:{lang:'ar'}},localStorage:{getItem(){return 'ar'}},console,CustomEvent:function(){}};
ctx.window.window=ctx.window;vm.createContext(ctx);
for(const f of ['i18n/ar.js','i18n/en.js','i18n/operations-source.js','i18n/warehouse-source.js','i18n/smart-reports-source.js','i18n/maintenance-source.js']){
  try{vm.runInContext(read(f),ctx,{filename:f});}catch(e){if(!/dispatchEvent/.test(String(e)))throw e;}
}
function flat(o,p='',r={}){if(!o||typeof o!=='object')return r;for(const [k,v] of Object.entries(o)){const q=p?p+'.'+k:k;if(typeof v==='string')r[q]=v;else if(v&&typeof v==='object')flat(v,q,r);}return r;}
const exact=new Map();function add(ar,en){const a=flat(ar),e=flat(en);for(const k in a)if(typeof e[k]==='string'&&!/[\u0600-\u06ff]/.test(e[k]))exact.set(String(a[k]).replace(/\s+/g,' ').trim(),e[k]);}
const d=ctx.window.PETATOE_I18N_DICTIONARIES||{};add(d.ar,d.en);
for(const n of ['PETATOE_OPERATIONS_I18N','PETATOE_WAREHOUSE_I18N']){const x=ctx.window[n];if(x&&x.dictionaries)add(x.dictionaries.ar,x.dictionaries.en);}
const sm=ctx.window.PETATOE_SMART_REPORTS_TRANSLATIONS;if(sm)add(sm.ar,sm.en);
for(const [k,v] of Object.entries(runtimeMap))exact.set(k.replace(/\s+/g,' ').trim(),v);
const literals=new Set(),re=/translateRuntime\(\s*(['"])(.*?)\1/gs;
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name),rel=path.relative(root,p);if(ent.isDirectory()){if(['i18n','scripts','.git','node_modules'].includes(ent.name))continue;walk(p);}else if(ent.name.endsWith('.js')){const s=fs.readFileSync(p,'utf8');let m;while((m=re.exec(s)))if(/[\u0600-\u06ff]/.test(m[2]))literals.add(m[2]);}}}
walk(root);
const normalize=v=>String(v).replace(/\\n/g,'\n').replace(/\s+/g,' ').trim();
const missing=[...literals].filter(v=>!exact.has(normalize(v)));
assert(missing.length===0,'runtime texts missing from Localization Center: '+missing.slice(0,10).join(' | '));
for(const [k,v] of Object.entries(runtimeMap))assert(v&& !/[\u0600-\u06ff]/.test(v),'invalid English runtime translation for: '+k);
console.log('Localization Center Consolidation Check: Passed');
console.log('Runtime literals covered:',literals.size);
console.log('New Center runtime entries:',Object.keys(runtimeMap).length);
console.log('Missing runtime entries: 0');
