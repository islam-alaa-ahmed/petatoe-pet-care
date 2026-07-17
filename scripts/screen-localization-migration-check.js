#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const excluded=new Set(['i18n','scripts','.git','node_modules']);
const legacy=/PETATOE_I18N|PETATOE_SMART_REPORTS_TRANSLATIONS|PETATOE_BUSINESS_DATA_I18N/;
const hits=[];let checked=0;
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory()){if(excluded.has(ent.name))continue;walk(p);}else if(ent.name.endsWith('.js')){checked++;const s=fs.readFileSync(p,'utf8');if(legacy.test(s))hits.push(path.relative(root,p));}}}
walk(root);
if(hits.length){console.error('Legacy localization consumers remain:\n'+hits.join('\n'));process.exit(1);}
const runtime=fs.readFileSync(path.join(root,'i18n/localization-center/runtime.js'),'utf8');
if(!runtime.includes('localizeBusinessRecord:localizeBusinessRecord'))throw new Error('Center business record adapter missing');
const release=fs.readFileSync(path.join(root,'RELEASE_VERSION.txt'),'utf8');
if(!release.includes('PETATOE v9.4.1')||!release.includes('ELC_V9_4_1_SCREEN_MIGRATION'))throw new Error('Release metadata mismatch');
console.log('Screen Localization Migration Check: Passed');
console.log('Screen/runtime consumer JS files checked:',checked);
console.log('Legacy direct consumers: 0');
