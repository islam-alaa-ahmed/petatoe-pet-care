'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const file=fs.readFileSync(path.join(root,'treasury/treasury-core.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const failures=[];
function requireText(text,label){if(!file.includes(text))failures.push(label);}
requireText('function treasurySessionAuthenticated()','Missing authenticated-session startup guard.');
requireText('function treasuryPermissionsReady()','Missing identity readiness startup guard.');
requireText('if(!treasuryCanRender())return;','Treasury boot is not gated before data loading.');
requireText("document.addEventListener('petatoe:userchanged'",'Treasury does not restart from the canonical user-change event.');
requireText("window.addEventListener('petatoe:identity-ready'",'Treasury does not restart from the canonical identity-ready event.');
if(/\[80,300\]\.forEach\(function\(ms\)\{setTimeout\(boot,ms\)\}\)/.test(file))failures.push('Aggressive unauthenticated Treasury startup retries are still present.');
if(!/if\(!silent\)toastSafe\([\s\S]*?return false;/.test(file))failures.push('Silent Treasury tab selection can still emit a blocking permission notice.');
if(!index.includes('treasury/treasury-core.js?v=9.4.9-startup-permission-guard'))failures.push('Treasury cache token is not synchronized.');
if(failures.length){console.error('Startup Permission Guard: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Startup Permission Guard: PASSED');
console.log(JSON.stringify({authenticatedGuard:true,identityReadyGuard:true,aggressiveRetries:0,silentNativeAlerts:0},null,2));
