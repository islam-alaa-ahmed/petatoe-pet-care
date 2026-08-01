#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const rel='inline-extracted/commission-inline.js';
const src=fs.readFileSync(path.join(root,rel),'utf8');
const failures=[];
function ok(cond,msg){if(!cond)failures.push(msg);else console.log('PASS',msg);}
function extractFunction(name){
  const marker=`function ${name}(`;
  const start=src.indexOf(marker);
  if(start<0) throw new Error(`Missing ${name}`);
  const brace=src.indexOf('{',start);
  let depth=0,inS=false,inD=false,inT=false,esc=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i];
    if(esc){esc=false;continue;}
    if(c==='\\'){esc=true;continue;}
    if(!inD&&!inT&&c==="'")inS=!inS;
    else if(!inS&&!inT&&c==='"')inD=!inD;
    else if(!inS&&!inD&&c==='`')inT=!inT;
    if(inS||inD||inT)continue;
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return src.slice(start,i+1);
  }
  throw new Error(`Unclosed ${name}`);
}
const names=['commissionDigits','comParseNum','rowNetSales','commissionEligibilityNorm','commissionEligibilityText','commissionHasEligibilityToken','classifyCommissionRow','commissionEligibilitySummary','segmentFor'];
const context={console,window:{PETATOEUtils:null},parseNum:undefined};
vm.createContext(context);
vm.runInContext(names.map(extractFunction).join('\n'),context);

ok(context.rowNetSales({totalEx:0,totalInc:115,tax:15})===0,'explicit totalEx=0 is preserved');
ok(context.rowNetSales({totalInc:115,tax:15})===100,'tax-exclusive amount derives from totalInc-tax');
ok(context.rowNetSales({price:40,qty:3,disc:20})===100,'fallback amount uses price*qty-discount');
ok(context.classifyCommissionRow({totalEx:100,status:'cancelled'}).eligible===false,'cancelled invoices are excluded');
ok(context.classifyCommissionRow({totalEx:100,status:'مرتجع'}).amount===-100,'refund/return becomes negative adjustment');
ok(context.classifyCommissionRow({totalEx:-25}).amount===-25,'negative values remain commission adjustments');
ok(context.classifyCommissionRow({totalEx:0}).reason==='zero_value','zero-value rows are excluded');
const summary=context.commissionEligibilitySummary([{totalEx:100},{totalEx:50,status:'cancelled'},{totalEx:20,status:'refund'}]);
ok(summary.eligible===2&&summary.excluded===1&&summary.eligibleAmount===80,'eligibility summary reconciles sales and adjustments');
const tiers=[{target:40000,rate:3},{target:55000,rate:4},{target:70000,rate:5}];
ok(context.segmentFor(40000,tiers).idx===1,'first tier includes its upper boundary');
ok(context.segmentFor(40000.01,tiers).idx===2,'second tier starts above first boundary');
ok(context.segmentFor(55000,tiers).idx===2,'second tier includes its upper boundary');
ok(context.segmentFor(55000.01,tiers).idx===3,'third tier starts above second boundary');
ok(src.includes("function dataRows(){\n  try{\n    if(window.PETATOERecordsReadFacade"),'commission rows use canonical records facade first');
ok(src.includes("const calc=buildCalcForPeriod(currentPeriod(),'',{ignoreSnapshot:true})"),'month lock certifies the full unfiltered period from live rows');
ok(src.includes("buildCalcForPeriod(period,'',{ignoreSnapshot:true})"),'snapshot reproduction recalculates from live rows instead of reading the locked snapshot');
ok(src.includes("snap.eligibilitySummary.eligibleAmount!==undefined"),'snapshot audit reads the actual eligibility summary amount');
ok(src.includes('window.PETATOECommissionCalculationUAT='),'calculation UAT API is exported');
ok(src.includes("paymentPolicy:'accrual_all_eligible_invoices'"),'payment policy is explicit and testable');

if(failures.length){console.error(`Phase 12 Commission Calculation UAT: FAILED (${failures.length})`);failures.forEach(x=>console.error('-',x));process.exit(1);}
console.log('Phase 12 Commission Calculation UAT: PASSED');
