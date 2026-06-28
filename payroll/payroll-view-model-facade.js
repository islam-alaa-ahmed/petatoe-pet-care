/* PETATOE v6.2.43 — Phase 9D-SAFE Payroll View-Model Facade
   Scope: read-only view-model preparation for payroll screens.
   Safety rules:
   - No DOM writes.
   - No event listeners.
   - No storage writes.
   - No payroll-core.js changes.
   - No approval/save/delete/edit takeover.
*/
(function(){
  'use strict';
  if(window.PETATOEPayrollViewModelFacade) return;

  function reader(){ return window.PETATOEPayrollReadFacade || null; }
  function computed(){ return window.PETATOEPayrollComputedFacade || null; }
  function str(value){ return String(value == null ? '' : value); }
  function asArray(value){ return Array.isArray(value) ? value : []; }
  function num(value){
    var C = computed();
    if(C && typeof C.num === 'function') return C.num(value);
    var n = parseFloat(String(value == null ? 0 : value).replace(/,/g,''));
    return isNaN(n) ? 0 : n;
  }
  function money(value){
    var n = num(value);
    try{ return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' SAR'; }
    catch(e){ return n.toFixed(2) + ' SAR'; }
  }
  function clone(value, fallback){
    try{ return value == null ? fallback : JSON.parse(JSON.stringify(value)); }
    catch(e){ return fallback; }
  }

  function employeeLabel(emp){
    emp = emp || {};
    return str(emp.name || emp.fullName || emp.employeeName || emp.username || emp.code || emp.id || 'غير محدد');
  }

  function statusLabel(status){
    var s = str(status);
    var map = {
      draft: 'مسودة',
      board_approved: 'اعتماد مجلس الإدارة',
      employee_approved: 'موافقة الموظف',
      accounts_approved: 'اعتماد الحسابات',
      paid: 'تم الصرف',
      cancelled: 'ملغي'
    };
    return map[s] || s || 'غير محدد';
  }

  function paymentLabel(method){
    var m = str(method);
    var map = {
      mada: 'مدى',
      bank: 'تحويل بنكي',
      cash: 'نقدًا',
      transfer: 'تحويل بنكي'
    };
    return map[m] || m || 'غير محدد';
  }

  function slipRow(slip){
    slip = slip || {};
    var R = reader();
    var C = computed();
    var emp = R && typeof R.getEmployeeById === 'function' ? R.getEmployeeById(slip.employeeId) : null;
    var totals = C && typeof C.slipTotals === 'function' ? C.slipTotals(slip) : {};
    return {
      id: str(slip.id),
      employeeId: str(slip.employeeId),
      employeeName: employeeLabel(emp),
      period: str(slip.period),
      status: str(slip.status),
      statusLabel: statusLabel(slip.status),
      paymentMethod: str(slip.paymentMethod),
      paymentLabel: paymentLabel(slip.paymentMethod),
      base: num(totals.base),
      housing: num(totals.housing),
      transport: num(totals.transport),
      commission: num(totals.commission),
      incentives: num(totals.incentives),
      additions: num(totals.additions),
      deductions: num(totals.deductions),
      gross: num(totals.gross),
      net: num(totals.net),
      display: {
        base: money(totals.base),
        housing: money(totals.housing),
        transport: money(totals.transport),
        commission: money(totals.commission),
        incentives: money(totals.incentives),
        additions: money(totals.additions),
        deductions: money(totals.deductions),
        gross: money(totals.gross),
        net: money(totals.net)
      }
    };
  }

  function employeeRow(emp){
    emp = emp || {};
    var C = computed();
    var totals = C && typeof C.employeeTotals === 'function' ? C.employeeTotals(emp.id) : {};
    return {
      id: str(emp.id),
      code: str(emp.code),
      name: employeeLabel(emp),
      jobTitle: str(emp.jobTitle || emp.job || emp.role),
      status: str(emp.status || emp.activeStatus || 'active'),
      paymentMethod: str(emp.paymentMethod || emp.salaryPaymentMethod),
      paymentLabel: paymentLabel(emp.paymentMethod || emp.salaryPaymentMethod),
      slipsCount: num(totals.count),
      totalNet: num(totals.net),
      display: { totalNet: money(totals.net) }
    };
  }

  function payrollTable(period){
    var R = reader();
    var slips = R && typeof R.slips === 'function' ? R.slips() : [];
    if(period) slips = slips.filter(function(s){ return str(s && s.period) === str(period); });
    return asArray(slips).map(slipRow);
  }

  function employeeTable(){
    var R = reader();
    var employees = R && typeof R.employees === 'function' ? R.employees() : [];
    return asArray(employees).map(employeeRow);
  }

  function dashboard(period){
    var C = computed();
    var totals = period && C && typeof C.monthlyTotals === 'function'
      ? C.monthlyTotals(period)
      : (C && typeof C.overallTotals === 'function' ? C.overallTotals() : {});
    return {
      period: str(period || 'all'),
      cards: [
        {key:'count', label:'عدد الكشوف', value:num(totals.count), display:String(num(totals.count))},
        {key:'gross', label:'إجمالي المستحق', value:num(totals.gross), display:money(totals.gross)},
        {key:'deductions', label:'إجمالي الخصومات', value:num(totals.deductions), display:money(totals.deductions)},
        {key:'net', label:'صافي الرواتب', value:num(totals.net), display:money(totals.net)}
      ],
      statusCounts: clone(totals.byStatus || {}, {})
    };
  }

  function snapshot(){
    var C = computed();
    return {
      mode: 'view-model-read-only',
      employees: employeeTable().length,
      slips: payrollTable().length,
      periods: C && typeof C.periods === 'function' ? C.periods() : [],
      dashboard: dashboard()
    };
  }

  var api = {
    version: 'v6.2.43-phase9d-safe',
    mode: 'view-model-read-only',
    money: money,
    statusLabel: statusLabel,
    paymentLabel: paymentLabel,
    employeeRow: employeeRow,
    slipRow: slipRow,
    employeeTable: employeeTable,
    payrollTable: payrollTable,
    dashboard: dashboard,
    snapshot: snapshot
  };

  try{ Object.freeze(api); }catch(e){
    if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
      window.PETATOEDiagnostics.captureSilentCatch('payroll/payroll-view-model-facade.js::freeze-api', e);
    }
  }
  window.PETATOEPayrollViewModelFacade = api;
})();
