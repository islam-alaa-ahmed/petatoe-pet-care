#!/usr/bin/env node
'use strict';
const fs = require('fs');
function read(path){ return fs.readFileSync(path,'utf8'); }
function check(ok,label){ if(!ok){ console.error('FAIL: '+label); process.exitCode=1; } else console.log('PASS: '+label); }
const nav=read('navigation/navigation.js');
const ops=read('operations/operations-legacy-engine.js');
const index=read('index.html');
const worker=read('service-worker.js');
check(nav.includes('function applyAppointmentsNavigationIntent()'),'canonical navigation has runtime intent applicator');
check(nav.includes("document.addEventListener('petatoe:appointments-ready'"),'pending intent reapplies on appointments readiness');
check(nav.includes("if(tab==='appointments') applyAppointmentsNavigationIntent();"),'click performs immediate runtime application');
check(nav.includes("[data-appointment-section=\"'+requested+'\"]"),'runtime application verifies final active section');
check(ops.includes("var requestedSubTab=explicitSubTab||pendingSubTab||'add';"),'operations preserves pending sub-route before fallback');
check(ops.includes("petatoe:appointments-intent-applied"),'operations acknowledges applied intent');
check(index.includes('10.0.25-sg4-5-runtime-error-attribution-1'),'HTML assets use new runtime cache token');
check(worker.includes("const APP_VERSION = '10.0.25-sg4-5-runtime-error-attribution-1';"),'service worker namespace rotated');
if(process.exitCode) process.exit(process.exitCode);
