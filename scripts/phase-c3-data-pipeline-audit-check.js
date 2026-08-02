#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');let checks=0,fail=0;
function pass(ok,label){checks++;console.log((ok?'PASS':'FAIL')+' - '+label);if(!ok)fail++;}
const wh=read('warehouses/warehouse-core.js');
const repo=read('core/supabase-repository.js');
const facade=read('payroll/payroll-read-facade.js');
const payroll=read('payroll/payroll-core.js');
const manifest=JSON.parse(read('config/petatoe-version.json'));
const v364=wh.slice(wh.indexOf('petatoe-v364-warehouse-tabs-items-js'),wh.indexOf('/* Extracted script:',wh.indexOf('petatoe-v364-warehouse-tabs-items-js')+10));
pass(/function whT\(/.test(v364),'Warehouse inventory owner has local translation helper');
pass(/function whLocale\(/.test(v364),'Warehouse inventory owner has local locale helper');
pass(/var __listReadPromises=\{\}/.test(repo),'Repository coalesces identical list reads');
pass(/__listReadCache/.test(repo)&&/2500/.test(repo),'Repository has bounded short-lived list cache');
pass(/invalidateTableReadCaches\(table\)/.test(repo),'Repository invalidates list cache on mutations');
pass(/loadingPromise/.test(facade),'Payroll read facade joins an active refresh');
pass(/Promise\.all\(\[/.test(facade),'Payroll read facade loads independent sources in parallel');
pass(/var loadResults=await Promise\.all/.test(payroll),'Payroll core hydrates independent sources in parallel');
pass(manifest.runtimeContracts&&manifest.runtimeContracts.dataPipeline==='10.0.25-phase-c3-coalesced-read-pipeline-contract-1','Phase C3 runtime contract is registered');
console.log(`Phase C3 data pipeline audit: ${fail?'FAILED':'PASSED'} (${checks-fail}/${checks})`);if(fail)process.exit(1);
