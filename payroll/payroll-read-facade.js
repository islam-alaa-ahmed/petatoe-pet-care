/* PETATOE v6.2.41 — Phase 9B-SAFE Payroll Read-Only Facade
   Scope: read-only facade for payroll data.
   Safety rules:
   - No DOM writes.
   - No event listeners.
   - No storage writes.
   - No payroll-core.js changes.
   - No approval/save/delete/edit takeover.
*/
(function(){
  'use strict';
  if(window.PETATOEPayrollReadFacade) return;

  var RAW_KEYS = {
    employees: 'PETATOE_PAYROLL_EMPLOYEES_V1',
    slips: 'PETATOE_PAYROLL_SLIPS_V1',
    jobTypes: 'PETATOE_PAYROLL_JOB_TYPES_V1',
    employeeConfig: 'PETATOE_PAYROLL_EMPLOYEE_CONFIG_V1',
    commissionSnapshots: 'PETATOE_v3_5_COMMISSION_MONTHLY_SNAPSHOTS'
  };

  var LOGICAL_KEYS = {
    employees: 'payrollEmployees',
    slips: 'payrollSlips',
    jobTypes: 'payrollJobTypes',
    employeeConfig: 'payrollEmployeeConfig',
    commissionSnapshots: 'payrollCommissionSnapshots'
  };

  function clone(value, fallback){
    try{
      if(value == null) return fallback;
      return JSON.parse(JSON.stringify(value));
    }catch(e){
      return fallback;
    }
  }

  function readJSON(logicalKey, rawKey, fallback){
    var S = window.PETATOEStorage;
    try{
      if(S && typeof S.readJSON === 'function'){
        var byLogical = S.readJSON(logicalKey, undefined);
        if(byLogical !== undefined && byLogical !== null) return clone(byLogical, fallback);
        var byRaw = S.readJSON(rawKey, undefined);
        if(byRaw !== undefined && byRaw !== null) return clone(byRaw, fallback);
      }
    }catch(e){
      console.warn('PETATOEPayrollReadFacade readJSON failed', logicalKey, e);
    }
    return clone(fallback, fallback);
  }

  function asArray(value){ return Array.isArray(value) ? value : []; }
  function asObject(value){ return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function str(value){ return String(value == null ? '' : value); }

  function employees(){
    return asArray(readJSON(LOGICAL_KEYS.employees, RAW_KEYS.employees, []));
  }

  function slips(){
    return asArray(readJSON(LOGICAL_KEYS.slips, RAW_KEYS.slips, []));
  }

  function jobTypes(){
    return asArray(readJSON(LOGICAL_KEYS.jobTypes, RAW_KEYS.jobTypes, []));
  }

  function employeeConfig(){
    return asObject(readJSON(LOGICAL_KEYS.employeeConfig, RAW_KEYS.employeeConfig, {}));
  }

  function commissionSnapshots(){
    return asObject(readJSON(LOGICAL_KEYS.commissionSnapshots, RAW_KEYS.commissionSnapshots, {}));
  }

  function getEmployeeById(id){
    id = str(id);
    return employees().find(function(emp){ return str(emp && emp.id) === id; }) || null;
  }

  function getSlipById(id){
    id = str(id);
    return slips().find(function(slip){ return str(slip && slip.id) === id; }) || null;
  }

  function slipsByEmployee(employeeId){
    employeeId = str(employeeId);
    return slips().filter(function(slip){ return str(slip && slip.employeeId) === employeeId; });
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
    var emp = employees();
    var pay = slips();
    return {
      employeesCount: emp.length,
      slipsCount: pay.length,
      jobTypesCount: jobTypes().length,
      statusCounts: statusCounts(),
      hasEmployeeConfig: Object.keys(employeeConfig()).length > 0,
      hasCommissionSnapshots: Object.keys(commissionSnapshots()).length > 0
    };
  }

  var api = {
    version: 'v6.2.41-phase9b-safe',
    mode: 'read-only',
    keys: clone({logical: LOGICAL_KEYS, raw: RAW_KEYS}, {}),
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
    snapshot: snapshot
  };

  try{ Object.freeze(api); }catch(e){
    if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
      window.PETATOEDiagnostics.captureSilentCatch('payroll/payroll-read-facade.js::freeze-api', e);
    }
  }
  window.PETATOEPayrollReadFacade = api;
})();
