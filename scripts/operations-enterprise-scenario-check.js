const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{},console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('/mnt/data/petatoe_phase4d_work/petatoe-pet-care-main/operations/operations-report-dataset.js','utf8'),ctx);
const d=ctx.window.PETATOEOperationsReportDataset;
let passed=0; function test(name,fn){try{fn();console.log('PASS',name);passed++;}catch(e){console.error('FAIL',name,e.message);process.exitCode=1;}}
const rows=[
{id:'a1',status:'مجدول',totalAmount:100,paidAmount:20,remainingAmount:80,customerId:'c1',client:'عميل 1',vehicleId:'v1',vehicle:'سيارة قديمة',driverId:'d1',driver:'أحمد',groomerId:'g1',groomer:'سارة',date:'2026-07-01'},
{id:'a2',status:'تمت الجلسة',totalAmount:200,paidAmount:50,remainingAmount:150,customerId:'c1',client:'عميل 1 الجديد',vehicleId:'v1',vehicle:'سيارة الرياض',driverId:'d1',driver:'أحمد الجديد',groomerId:'g1',groomer:'سارة',date:'2026-07-02'},
{id:'a3',status:'مؤكد',totalAmount:300,paidAmount:300,remainingAmount:0,phone:'+966 50 123 4567',client:'عميل 2',vehicle:'سيارة الرياض',driver:'أحمد الجديد',groomer:'سارة',date:'2026-07-03'},
{id:'a4',status:'ملغي',totalAmount:400,paidAmount:0,remainingAmount:400,phone:'00966501234567',client:'اسم قديم',vehicleId:'v2',vehicle:'سيارة 2',driverId:'d2',driver:'محمد',groomerId:'g2',groomer:'منى',date:'2026-07-04'},
{id:'a5',status:'مؤجل',totalAmount:500,paidAmount:0,remainingAmount:500,customerId:'c3',client:'عميل 3',vehicleId:'v2',vehicle:'سيارة 2',driverId:'d2',driver:'محمد',groomerId:'g2',groomer:'منى',date:'2026-07-05'}
];
test('financial separation',()=>{const f=d.aggregateFinancials(rows);assert.equal(f.bookedValue,1100);assert.equal(f.executedRevenue,500);assert.equal(f.collectedRevenue,350);assert.equal(f.outstandingBalance,150);assert.equal(f.cancelledValue,400);assert.equal(f.postponedValue,500);assert.equal(f.advanceCollected,20)});
test('completed statuses include closed and confirmed',()=>{assert(d.completedStatuses.includes('مؤكد'));assert(d.completedStatuses.includes('مغلق'))});
test('customer phone normalization',()=>{assert.equal(d.normalizePhone('00966 50-123-4567'),'+966501234567')});
test('cross report consistency',()=>{const a=d.consistencyAudit(rows);assert.equal(a.passed,true);assert.equal(a.issues.length,0)});
test('stable vehicle grouping and unique alias merge',()=>{const g=d.groupRows(rows,'vehicle','بدون سيارة');const v1=g.find(x=>x.id==='v1');assert(v1);assert.equal(v1.rows.length,3);assert.equal(v1.name,'سيارة الرياض')});
test('legacy unique driver alias joins stable id',()=>{const data=[{driverId:'d1',driver:'أحمد',date:'2026-01-01'},{driver:'أحمد',date:'2026-01-02'}];const g=d.groupRows(data,'driver','بدون');assert.equal(g.length,1);assert.equal(g[0].rows.length,2)});
test('ambiguous duplicate driver names do not auto merge',()=>{const data=[{driverId:'d1',driver:'محمد'},{driverId:'d2',driver:'محمد'},{driver:'محمد'}];const g=d.groupRows(data,'driver','بدون');assert.equal(g.length,3)});
test('customer same normalized phone merges',()=>{const data=[{phone:'+966 50 123 4567',client:'أ'},{phone:'00966501234567',client:'ب'}];const g=d.groupRows(data,'customer','غير محدد');assert.equal(g.length,1);assert.equal(g[0].rows.length,2)});
console.log(`RESULT ${passed}/8`);
