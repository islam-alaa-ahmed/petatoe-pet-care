#!/usr/bin/env node
'use strict';
const fs=require('fs');
function fail(m){console.error('Source Migration Pack 3 Check: Failed\n- '+m);process.exit(1)}
const src=fs.readFileSync('i18n/warehouse-source.js','utf8');
const core=fs.readFileSync('warehouses/warehouse-core.js','utf8');
const index=fs.readFileSync('index.html','utf8');
if(!index.includes('i18n/warehouse-source.js?v=9.2.4-source-migration-pack3'))fail('warehouse source pack is not loaded before warehouse core');
if(!core.includes("function whT(k,p)"))fail('warehouse localization helper is missing');
if(!core.includes("whT('movementTypeIn')"))fail('movement types are not localized at source');
if(!core.includes("whLocale()"))fail('warehouse dates are not locale-aware');
if(!core.includes("whT('openStatementFirst')"))fail('warehouse alerts are not localized at source');
if(!core.includes("whT('currentBalance')"))fail('low-stock export headers are not localized');
const enBlock=src.split('var en={')[1].split('};\n  function lang')[0];
if(/[\u0600-\u06FF]/.test(enBlock))fail('English warehouse dictionary contains Arabic characters');
const keyRe=/whT\('([^']+)'/g;let m,keys=new Set();while((m=keyRe.exec(core)))keys.add(m[1]);
for(const k of keys){if(!src.includes(k+":")&&!src.includes("'"+k+"':"))fail('missing warehouse dictionary key: '+k)}
console.log('Source Migration Pack 3 Check: Passed');
console.log('Warehouse Runtime Keys Covered: '+keys.size);
