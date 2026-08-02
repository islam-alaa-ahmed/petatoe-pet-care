'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const payroll=read('payroll/payroll-core.js');
const treasury=read('treasury/treasury-core.js');
const obligations=read('obligations/obligations-core.js');
const cfg=JSON.parse(read('config/petatoe-version.json'));
const checks=[];
function check(ok,name){checks.push([!!ok,name]);if(!ok)process.exitCode=1}
check(payroll.includes('window.PETATOEPayrollEnterpriseUAT='),'Payroll UAT API is exported');
check(payroll.includes("canDeleteSlip:function(slip){return ['draft','pending_board']"),'Payroll deletion contract remains draft/pending only');
check(!payroll.includes("document.addEventListener('petatoe:identity-ready',function(){refreshPayrollViews()});"),'Duplicate payroll identity-ready document listener removed');
check(!payroll.includes("document.addEventListener('petatoe:permissionschanged',function(){refreshPayrollViews()});"),'Duplicate payroll permissions document listener removed');
check(treasury.includes('PETATOERecordsReadFacade') && treasury.includes("typeof window.PETATOERecordsReadFacade.readRows==='function'"),'Treasury reads sales rows through canonical facade');
check(treasury.includes('treasuryAuditPersistQueue'),'Treasury audit persistence is serialized');
check(treasury.includes("await addAudit('تسليم كاش'") && treasury.includes("await addAudit('حذف حركة خزينة'"),'Treasury writes await audit persistence attempt');
check(obligations.includes('obligationsPersistQueue'),'Obligation writes are serialized');
check(obligations.includes('function obligationsCommit(mutator,audit)'),'Obligation mutation transaction helper exists');
check(obligations.includes('obligationsRemoteCache=before'),'Obligation failed persistence rolls runtime cache back');
check(obligations.includes("canSpecial(String(u.id||''),'hard_delete')"),'Permanent obligation deletion requires hard-delete permission');
check(obligations.includes('window.petPermanentDeleteObligation=async function'),'Permanent obligation deletion awaits persistence');
check(obligations.includes('window.petSaveObligation=async function'),'Obligation save awaits Supabase persistence');
check(obligations.includes('filteredHistoryRows().map'),'Obligation export remains aligned with active history filters');
check(cfg.runtimeContracts.financialOperationsUAT==='10.0.25-phase13-financial-operations-uat-contract-1','Phase 13 runtime contract is registered');
for(const [ok,name] of checks) console.log(`${ok?'PASS':'FAIL'} - ${name}`);
console.log(`Phase 13 Payroll/Treasury/Obligations UAT: ${checks.filter(x=>x[0]).length} / ${checks.length} PASSED`);
