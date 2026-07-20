#!/usr/bin/env node
'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function assert(ok,msg){if(!ok){console.error('[FAIL] '+msg);process.exitCode=1;}}
const bootstrap=read('i18n/bootstrap.js');
const engine=read('i18n/index.js');
const html=read('index.html');
assert(bootstrap.includes('window.PETATOE_I18N_BOOT=coordinator'),'bootstrap exposes the readiness coordinator');
assert(!bootstrap.includes('__PETATOE_I18N_BOOT_FAILSAFE__'),'legacy 1.5s reveal timer is removed');
assert(bootstrap.includes("coordinator.reveal('emergency-timeout',true)"),'degraded emergency reveal is explicit');
assert(engine.includes("boot.reveal('localization-engine-ready',false)"),'engine reveals only after localization apply completes');
assert(html.includes('data-i18n="topbar.reports"'),'topbar reports has an explicit key');
assert(html.includes('data-i18n="topbar.pdf"'),'topbar PDF has an explicit key');
assert(html.includes('data-i18n-placeholder="globalSearch.placeholder"'),'global search placeholder has an explicit key');
assert(html.includes('data-i18n="topbar.loading" id="topbarUserRole"'),'topbar loading state has an explicit key');

function simulate(saved){
  const attrs={}; const classes=new Set(); let domReady=null; let timerFn=null;
  const rootEl={setAttribute:(k,v)=>attrs[k]=String(v),removeAttribute:k=>delete attrs[k],classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)}};
  const context={
    window:{performance:{now:()=>25},dispatchEvent:()=>{}},
    performance:{now:()=>25},
    localStorage:{getItem:()=>saved},
    document:{documentElement:rootEl,readyState:'loading',addEventListener:(n,fn)=>{if(n==='DOMContentLoaded')domReady=fn;}},
    CustomEvent:function(){},
    setTimeout:(fn)=>{timerFn=fn;return 1;},clearTimeout:()=>{},console
  };
  context.window.window=context.window; context.window.document=context.document; context.window.localStorage=context.localStorage; context.window.CustomEvent=context.CustomEvent; context.window.setTimeout=context.setTimeout; context.window.clearTimeout=context.clearTimeout;
  vm.runInNewContext(bootstrap,context);
  return {attrs,classes,domReady,timerFn,boot:context.window.PETATOE_I18N_BOOT};
}
const en=simulate('en');
assert(en.attrs.lang==='en'&&en.attrs.dir==='ltr','saved English is applied before first paint');
assert(en.attrs['data-pet-i18n-booting']==='true','English remains guarded until the engine is ready');
assert(typeof en.domReady==='function','emergency timer is armed only after DOMContentLoaded');
en.boot.reveal('test-ready',false);
assert(!('data-pet-i18n-booting' in en.attrs)&&en.attrs['data-pet-i18n-ready']==='true','successful engine readiness reveals the page');
const ar=simulate('ar');
assert(ar.attrs.lang==='ar'&&ar.attrs.dir==='rtl','saved Arabic is applied before first paint');
if(process.exitCode)process.exit(process.exitCode);
console.log('[PASS] deterministic startup localization first-paint checks');
