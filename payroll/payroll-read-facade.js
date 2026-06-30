/* PETATOE v8.0.2 — Payroll Read-Only Facade (Supabase)
   Scope: read-only facade for payroll data.
   Storage rule: no LocalStorage / PETATOEStorage dependency.
   Source: PETATOESupabaseRepository + in-memory runtime cache only. */
(function(){
  'use strict';
  if(window.PETATOEPayrollReadFacade && window.PETATOEPayrollReadFacade.__supabaseOnly) return;

  var MASTER_ROW_ID = 'payroll_master';
  var DEFAULT_JOB_TYPES = ['مدير','محاسب','مندوب مبيعات','جروومر','سائق','إداري'];
  var cache = {
    employees: [],
    slips: [],
    jobTypes: DEFAULT_JOB_TYPES.slice(),
    employeeConfig: {prefix:'EMP',next:1,digits:4},
    commissionSnapshots: {},
    loaded: false,
    loading: false,
    lastError: ''
  };

  function clone(value, fallback){
    try{
      if(value == null) return fallback;
      return JSON.parse(JSON.stringify(value));
    }catch(e){
      return fallback;
    }
  }
  function asArray(value){ return Array.isArray(value) ? value : []; }
  function asObject(value){ return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function str(value){ return String(value == null ? '' : value); }
  function repo(){ return window.PETATOESupabaseRepository || null; }
  function normalizeEmployee(emp){
    emp = emp && typeof emp === 'object' ? clone(emp,{}) : {};
    emp.id = emp.id || emp.employee_id || emp.employeeId || emp.supabase_id || '';
    emp.code = emp.code || emp.employee_code || '';
    emp.job = emp.job || emp.job_title || '';
    emp.status = emp.status || 'active';
    return emp;
  }
  function normalizeSlip(slip){
    slip = slip && typeof slip === 'object' ? clone(slip,{}) : {};
    slip.id = slip.id || slip.slip_id || slip.slipId || '';
    slip.employeeId = slip.employeeId || slip.employee_id || '';
    slip.status = slip.status || 'draft';
    return slip;
  }
  function setCacheFromMaster(master){
    master = asObject(master);
    if(Array.isArray(master.jobTypes)) cache.jobTypes = master.jobTypes.slice();
    if(master.employeeConfig && typeof master.employeeConfig === 'object') cache.employeeConfig = clone(master.employeeConfig, cache.employeeConfig);
    if(master.commissionSnapshots && typeof master.commissionSnapshots === 'object') cache.commissionSnapshots = clone(master.commissionSnapshots, {});
  }
  async function refresh(){
    if(cache.loading) return snapshot();
    var R = repo();
    if(!R || !R.hasClient || !R.hasClient()){
      cache.lastError = 'Supabase repository/client not ready';
      return snapshot();
    }
    cache.loading = true;
    try{
      var emps = R.listPayrollEmployees ? await R.listPayrollEmployees() : [];
      var slips = R.listJsonRows ? await R.listJsonRows('payroll_slips',{order:'created_at'}) : [];
      var master = R.getSingleton ? await R.getSingleton('payroll_master_data', MASTER_ROW_ID, {}) : {};
      cache.employees = asArray(emps).map(normalizeEmployee);
      cache.slips = asArray(slips).map(normalizeSlip);
      setCacheFromMaster(master);
      cache.loaded = true;
      cache.lastError = '';
      try{ window.dispatchEvent(new CustomEvent('petatoe:payroll-read-facade-refreshed',{detail:snapshot()})); }catch(_e){}
    }catch(e){
      cache.lastError = String(e && e.message ? e.message : e);
      console.warn('PETATOEPayrollReadFacade Supabase refresh failed', e);
    }finally{
      cache.loading = false;
    }
    return snapshot();
  }

  function employees(){ return cache.employees.map(function(emp){ return clone(emp,{}); }); }
  function slips(){ return cache.slips.map(function(slip){ return clone(slip,{}); }); }
  function jobTypes(){ return cache.jobTypes.slice(); }
  function employeeConfig(){ return clone(cache.employeeConfig, {}); }
  function commissionSnapshots(){ return clone(cache.commissionSnapshots, {}); }

  function getEmployeeById(id){
    id = str(id);
    return employees().find(function(emp){ return str(emp && emp.id) === id || str(emp && emp.supabase_id) === id; }) || null;
  }
  function getSlipById(id){
    id = str(id);
    return slips().find(function(slip){ return str(slip && slip.id) === id; }) || null;
  }
  function slipsByEmployee(employeeId){
    employeeId = str(employeeId);
    return slips().filter(function(slip){ return str(slip && slip.employeeId) === employeeId || str(slip && slip.employee_id) === employeeId; });
  }
  function slipsByPeriod(period){
    period = str(period);
    return slips().filter(function(slip){ return str(slip && slip.period) === period; });
  }
  function statusCounts(){
    return slips().reduce(function(acc, slip){
      var status = str(slip && slip.status) || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }
  function snapshot(){
    return {
      employeesCount: cache.employees.length,
      slipsCount: cache.slips.length,
      jobTypesCount: cache.jobTypes.length,
      statusCounts: statusCounts(),
      hasEmployeeConfig: Object.keys(employeeConfig()).length > 0,
      hasCommissionSnapshots: Object.keys(commissionSnapshots()).length > 0,
      loaded: !!cache.loaded,
      loading: !!cache.loading,
      lastError: cache.lastError || ''
    };
  }

  var api = {
    version: 'v8.0.2-supabase-only',
    mode: 'read-only-supabase',
    __supabaseOnly: true,
    employees: employees,
    slips: slips,
    jobTypes: jobTypes,
    employeeConfig: employeeConfig,
    commissionSnapshots: commissionSnapshots,
    getEmployeeById: getEmployeeById,
    getSlipById: getSlipById,
    slipsByEmployee: slipsByEmployee,
    slipsByPeriod: slipsByPeriod,
    statusCounts: statusCounts,
    snapshot: snapshot,
    refresh: refresh
  };

  try{ Object.freeze(api); }catch(_e){}
  window.PETATOEPayrollReadFacade = api;
  setTimeout(refresh, 0);
})();
