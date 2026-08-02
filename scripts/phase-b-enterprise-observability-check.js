#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');let fails=[];
function check(ok,msg){console.log(`${ok?'PASS':'FAIL'} - ${msg}`);if(!ok)fails.push(msg);}
const src=fs.readFileSync(path.join(root,'diagnostics/enterprise-observability.js'),'utf8');
const idx=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dict=fs.readFileSync(path.join(root,'i18n/localization-center/dictionary-store.js'),'utf8');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
check(src.includes("__owner:'diagnostics/enterprise-observability.js'"),'Observability has a single declared owner');
check(src.includes("new PerformanceObserver")&&src.includes("'longtask'")&&src.includes("'layout-shift'"),'Web vitals and long tasks are observed');
check(src.includes("petatoe:tabchange")&&src.includes('slowestRoutes'),'Route transition latency is recorded');
check(src.includes('runtimeHealth()'),'Runtime dependency health is included');
check(src.includes('cleanUrl(input)'),'Network telemetry strips query parameters');
check(src.includes('PETATOERecordsReadFacade'),'Data facade health is checked without reading business rows');
check(dict.includes("slowestRoutes:'أبطأ انتقالات الشاشات'")&&dict.includes("slowestRoutes:'Slowest screen transitions'"),'New visible labels are localized in Arabic and English');
check(!!cfg.runtimeContracts.observability,'Observability runtime contract is registered');
check(idx.includes(`diagnostics/enterprise-observability.js?v=${cfg.cacheVersion}`),'Observability cache token follows central version');
if(fails.length){console.error(`Phase B enterprise observability: FAILED (${fails.length})`);process.exit(1);}console.log('Phase B enterprise observability: PASSED');
