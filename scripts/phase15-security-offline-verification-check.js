#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');const cp=require('child_process');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,[path.join(__dirname,'phase15-security-offline-verification.js')],{cwd:root,stdio:'inherit'});
const report=JSON.parse(fs.readFileSync(path.join(root,'audit/phase15/PETATOE_PHASE15_SECURITY_OFFLINE_AUDIT.json'),'utf8'));
if(report.status!=='PASSED') throw new Error('Phase 15 audit did not pass.');
const required=['service-worker.js','security/security-offline-contract.js','config/petatoe-version.json'];
for(const rel of required){if(!fs.existsSync(path.join(root,rel))) throw new Error(`Missing ${rel}`);}
console.log(`Phase 15 contract checks: ${report.checks.filter(x=>x.ok).length}/${report.checks.length} PASSED`);
