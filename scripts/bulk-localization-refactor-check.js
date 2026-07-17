#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const runtime=fs.readFileSync(path.join(root,'i18n/localization-center/runtime.js'),'utf8');
const translator=fs.readFileSync(path.join(root,'i18n/global-screen-translator.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const version=fs.readFileSync(path.join(root,'RELEASE_VERSION.txt'),'utf8');
function assert(ok,msg){if(!ok)throw new Error(msg);}
assert(runtime.includes("9.3.1-bulk-localization-refactor"),'Unified runtime version not updated');
assert(translator.includes("function runtimeEnabled(){ return language()==='en'; }"),'English runtime must work before and after authentication');
assert(translator.includes('function patchNativeDialogs()'),'Native dialog localization interceptor missing');
assert(translator.includes('installObserver();if(runtimeEnabled())'),'Mutation observer is not installed during initialization');
assert(translator.includes("mode:'bulk-runtime-refactor'"),'Bulk runtime mode marker missing');
assert(index.includes('i18n/localization-center/runtime.js?v=9.3.1-bulk-localization-refactor'),'Runtime cache token not updated');
assert(index.includes('i18n/global-screen-translator.js?v=9.3.1-bulk-localization-refactor'),'Translator cache token not updated');
assert(version.includes('PETATOE v9.3.1'),'Release version not synchronized');
console.log('Bulk Localization Refactor Check: Passed');
console.log('Observer: installed automatically');
console.log('Pre-auth English translation: enabled');
console.log('Native alert/confirm/prompt localization: enabled');
