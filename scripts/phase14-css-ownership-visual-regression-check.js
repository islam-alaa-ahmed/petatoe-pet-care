#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('index.html');
const css=read('css/components/interaction-ownership.css');
const manifest=JSON.parse(read('config/petatoe-version.json'));
const checks=[];
function check(ok,label){ checks.push({label,ok:!!ok}); if(!ok) console.error('FAIL:',label); }
const href=`css/components/interaction-ownership.css?v=${manifest.cacheVersion}`;
check(index.includes(href),'interaction ownership stylesheet uses canonical cache version');
const linkPos=index.indexOf(href);
const mobilePos=index.indexOf('css/mobile/mobile-enterprise-v10-consolidated.css');
check(linkPos>mobilePos,'interaction ownership stylesheet loads after mobile/theme layers');
check(!index.includes('PETATOE SG-4.7.6 — Consolidated inactive-customer sort control contract'),'inactive sort contract removed from inline index styles');
check(!index.includes('PETATOE v5.1.62 Phase 3 - Smart Reports UI/UX isolation + clear active states'),'active-state contract removed from inline index styles');
check(css.includes('#smart .inactive-sort-actions'),'inactive controls have final component owner');
check(css.includes('#smart .inactive-sort-btn > *') && css.includes('visibility:visible!important'),'button child labels are explicitly visible');
check(css.includes('pointer-events:none!important'),'decorative pseudo-elements cannot intercept clicks');
check(css.includes(':focus-visible'),'keyboard focus contract exists');
check(css.includes('[data-state="loading"]') && css.includes('[data-state="failed"]') && css.includes('[data-action="retry"]'),'loading failure retry states are covered');
check(css.includes('html[dir="ltr"]') && css.includes('html[dir="rtl"]'),'RTL and LTR direction contracts exist');
check(manifest.runtimeContracts && manifest.runtimeContracts.visualInteraction==='10.0.25-phase14-interaction-visual-contract-1','visual interaction runtime contract recorded');
check(!/display\s*:\s*none[^}]*inactive-sort-btn/i.test(css),'inactive sort labels are not hidden');
const failed=checks.filter(x=>!x.ok);
console.log(`Phase 14 CSS Ownership & Visual Regression: ${checks.length-failed.length}/${checks.length} PASSED`);
if(failed.length) process.exit(1);
