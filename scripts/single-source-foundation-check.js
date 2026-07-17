#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const assert=(x,m)=>{if(!x)throw new Error(m)};
const html=read('index.html'),release=read('RELEASE_VERSION.txt'),storeSrc=read('i18n/localization-center/dictionary-store.js'),runtime=read('i18n/localization-center/runtime.js');
assert(html.includes('dictionary-store.js?v=9.4.0-single-source-foundation'),'canonical dictionary store is not loaded');
assert(html.indexOf('dictionary-store.js')<html.indexOf('localization-center/runtime.js'),'store must load before runtime');
assert(release.includes('PETATOE v9.4.0')&&release.includes('ELC_V9_4_0_SINGLE_SOURCE_FOUNDATION'),'release metadata mismatch');
assert(runtime.includes("function store(){return window.PETATOE_LOCALIZATION_CENTER_STORE||null;}"),'runtime is not connected to canonical store');
assert(runtime.includes("value=storeValue(key,lang);"),'center does not resolve from canonical store first');
assert(runtime.includes('registerModule:registerModule'),'module registration is not exposed by center');
const ctx={window:{},CustomEvent:function(){},console};ctx.window.window=ctx.window;ctx.window.dispatchEvent=()=>{};vm.createContext(ctx);vm.runInContext(storeSrc,ctx);
const d=ctx.window.PETATOE_LOCALIZATION_CENTER_DICTIONARIES;
assert(d&&d.ar&&d.en,'canonical dictionaries are missing');
const required=['operationsSource','warehouseSource','smartReportsSource','maintenanceSource','runtimeSource','globalUiSource'];
required.forEach(k=>assert(d.ar[k]&&d.en[k],`missing canonical module: ${k}`));
function flat(o,p='',r={}){for(const [k,v] of Object.entries(o||{})){const q=p?p+'.'+k:k;if(typeof v==='string')r[q]=v;else if(v&&typeof v==='object'&&!Array.isArray(v))flat(v,q,r)}return r}
const ar=flat(d.ar),en=flat(d.en);const missingAr=Object.keys(en).filter(k=>!(k in ar)),missingEn=Object.keys(ar).filter(k=>!(k in en));
assert(missingAr.length===0,'Arabic counterparts missing: '+missingAr.slice(0,10).join(','));
assert(missingEn.length===0,'English counterparts missing: '+missingEn.slice(0,10).join(','));
assert(Object.keys(ar).length>3000,'canonical store unexpectedly small');
console.log('Single Source Foundation Check: Passed');
console.log('Canonical modules:',required.length);
console.log('Arabic entries:',Object.keys(ar).length);
console.log('English entries:',Object.keys(en).length);
console.log('Missing counterparts: 0');
