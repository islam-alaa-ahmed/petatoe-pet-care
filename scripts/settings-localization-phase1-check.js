#!/usr/bin/env node
'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const settings=fs.readFileSync(path.join(root,'settings/settings.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const release=fs.readFileSync(path.join(root,'RELEASE_VERSION.txt'),'utf8');
const source=fs.readFileSync(path.join(root,'i18n/localization-center/dictionary-store.js'),'utf8');
const sandbox={window:{dispatchEvent(){}},CustomEvent:function(){}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'dictionary-store.js'});
const store=sandbox.window.PETATOE_LOCALIZATION_CENTER_STORE;
const ar=store&&store.dictionaries&&store.dictionaries.ar&&store.dictionaries.ar.settingsPhase1;
const en=store&&store.dictionaries&&store.dictionaries.en&&store.dictionaries.en.settingsPhase1;
const checks=[
  ['scoped HTML localization exists',settings.includes('function localizeSettingsHtml(html)')],
  ['settings text translation exists',settings.includes('function translateSettingsText(value)')],
  ['settings render uses scoped localization',settings.includes('setInnerHTML(el, localizeSettingsHtml(settingsHtml))')],
  ['language change rerenders settings',settings.includes("window.addEventListener('petatoe:language-changed'")],
  ['dictionary module Arabic exists',!!ar],
  ['dictionary module English exists',!!en],
  ['dictionary module parity',!!ar&&!!en&&Object.keys(ar).length===Object.keys(en).length],
  ['hero translation exists',!!en&&en.heroTitle==='Settings & Permissions Center'],
  ['release synchronized',release.includes('PETATOE v9.4.6')&&index.includes("PETATOE_RELEASE_VERSION='v9.4.6'")],
  ['cache tokens synchronized',index.includes('settings/settings.js?v=9.4.6-settings-localization-phase1')&&index.includes('dictionary-store.js?v=9.4.6-settings-localization-phase1')]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(!ok)failed++;}
console.log(`Checks: ${checks.length-failed}/${checks.length} passed`);
if(failed)process.exit(1);
