/* PETATOE v6.2.46 - Phase 9G SAFE Payroll Parallel Validation
   Read-only validation layer. No DOM mutation, no storage writes, no event takeover.
   Purpose: compare legacy payroll runtime availability with the new SAFE facades before any future takeover. */
(function(){
  'use strict';

  var FILE = 'payroll/payroll-parallel-validation.js';
  var VERSION = 'v6.2.46-phase9g-safe-payroll-parallel-validation';
  var lastReport = null;
  var lastError = null;
  var scheduled = false;

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(FILE, e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch(FILE + '::warn-fallback', _e);
      }
    }
  }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function num(v){
    try{
      if(window.PETATOENumber && typeof window.PETATOENumber.num === 'function') return window.PETATOENumber.num(v);
    }catch(e){ warn(e); }
    var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g,''));
    return isNaN(n) ? 0 : n;
  }
  function visible(v){ var n = num(v); return Math.abs(n) < 0.005 ? 0 : Math.round(n * 100) / 100; }
  function safeCall(obj, fn){
    try{
      var args = Array.prototype.slice.call(arguments, 2);
      if(obj && typeof obj[fn] === 'function') return obj[fn].apply(obj, args);
    }catch(e){ lastError = e; warn(e); }
    return null;
  }
  function fnExists(name){
    try{ return typeof window[name] === 'function'; }catch(e){ warn(e); return false; }
  }
  function arrayLen(v){ return Array.isArray(v) ? v.length : 0; }
  function objectKeys(v){ return v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v) : []; }

  function legacyContracts(){
    var names = [
      'renderPayroll','renderPayrollDashboard','renderPayrollEmployees','renderSalarySlip','renderPayrollRecords',
      'savePayrollEmployee','savePayrollSlip','deletePayrollEmployee','deletePayrollSlip',
      'approvePayrollSlip','cancelPayrollApproval','markPayrollPaid',
      'exportPayrollPDF','exportPayrollExcel','printPayrollSlip'
    ];
    var out = {};
    names.forEach(function(n){ out[n] = fnExists(n); });
    return out;
  }
  function countTrue(map){ return Object.keys(map || {}).filter(function(k){ return !!map[k]; }).length; }

  function facadeSnapshot(){
    var read = window.PETATOEPayrollReadFacade || null;
    var computed = window.PETATOEPayrollComputedFacade || null;
    var vm = window.PETATOEPayrollViewModelFacade || null;
    var renderBridge = window.PETATOEPayrollRenderBridge || null;
    var eventBridge = window.PETATOEPayrollEventBridge || null;

    var employees = safeCall(read, 'employees') || [];
    var slips = safeCall(read, 'slips') || [];
    var jobTypes = safeCall(read, 'jobTypes') || [];
    var readSnapshot = safeCall(read, 'snapshot') || {};
    var totals = safeCall(computed, 'overallTotals') || {};
    var periods = safeCall(computed, 'periods') || [];
    var computedSnapshot = safeCall(computed, 'snapshot') || {};
    var employeeTable = safeCall(vm, 'employeeTable') || [];
    var payrollTable = safeCall(vm, 'payrollTable') || [];
    var dashboard = safeCall(vm, 'dashboard') || null;
    var vmSnapshot = safeCall(vm, 'snapshot') || null;
    var renderCheck = safeCall(renderBridge, 'runManualCheck') || null;
    var eventCheck = safeCall(eventBridge, 'runManualCheck') || null;

    return {
      readReady: !!read,
      computedReady: !!computed,
      viewModelReady: !!vm,
      renderBridgeReady: !!renderBridge,
      eventBridgeReady: !!eventBridge,
      employeesCount: arrayLen(employees),
      slipsCount: arrayLen(slips),
      jobTypesCount: arrayLen(jobTypes),
      readSnapshotEmployees: num(readSnapshot && readSnapshot.employeesCount),
      readSnapshotSlips: num(readSnapshot && readSnapshot.slipsCount),
      periodCount: arrayLen(periods),
      statusCountKeys: objectKeys(totals && totals.byStatus).length,
      totalGross: visible(totals && totals.gross),
      totalDeductions: visible(totals && totals.deductions),
      totalNet: visible(totals && totals.net),
      computedSnapshotReady: !!computedSnapshot,
      employeeTableCount: arrayLen(employeeTable),
      payrollTableCount: arrayLen(payrollTable),
      dashboardReady: !!dashboard,
      viewModelSnapshotReady: !!vmSnapshot,
      renderBridgeMode: clean(renderCheck && renderCheck.mode),
      eventBridgeMode: clean(eventCheck && eventCheck.mode),
      eventBridgeContractCount: num(eventCheck && eventCheck.contractCount),
      eventBridgeTargetCount: num(eventCheck && eventCheck.targetCount)
    };
  }

  function riskAssessment(contracts, f){
    var risks = [];
    if(!f.readReady) risks.push('read-facade-missing');
    if(!f.computedReady) risks.push('computed-facade-missing');
    if(!f.viewModelReady) risks.push('view-model-facade-missing');
    if(f.employeesCount === 0) risks.push('no-payroll-employees-visible-to-facade');
    if(countTrue(contracts) === 0) risks.push('legacy-contracts-not-detected');
    if(f.renderBridgeReady && f.renderBridgeMode && f.renderBridgeMode !== 'shadow-render-bridge-read-only') risks.push('unexpected-render-bridge-mode');
    if(f.eventBridgeReady && f.eventBridgeMode && f.eventBridgeMode !== 'shadow-event-bridge-read-only') risks.push('unexpected-event-bridge-mode');
    if(f.readSnapshotEmployees !== f.employeesCount) risks.push('read-snapshot-employee-count-mismatch');
    if(f.readSnapshotSlips !== f.slipsCount) risks.push('read-snapshot-slip-count-mismatch');
    if(f.employeeTableCount !== f.employeesCount) risks.push('employee-view-model-count-mismatch');
    if(f.payrollTableCount !== f.slipsCount) risks.push('payroll-view-model-count-mismatch');
    return risks;
  }

  function buildReport(reason){
    var contracts = legacyContracts();
    var facade = facadeSnapshot();
    var risks = riskAssessment(contracts, facade);
    var report = {
      version: VERSION,
      mode: 'shadow-parallel-validation-read-only',
      reason: String(reason || 'manual'),
      time: new Date().toISOString(),
      legacyContracts: contracts,
      legacyContractCount: countTrue(contracts),
      facade: facade,
      risks: risks,
      safeForFutureTakeoverPlanning: risks.length === 0,
      writesApplied: 0,
      domWritesApplied: 0,
      storageWritesApplied: 0,
      listenersAttachedForBehavior: 0,
      approvalFlowTouched: false
    };
    try{ Object.freeze(report.legacyContracts); Object.freeze(report.facade); Object.freeze(report.risks); Object.freeze(report); }catch(e){ warn(e); }
    lastReport = report;
    try{ window.__PETATOEPayrollParallelValidationLastReport = report; }catch(e){ warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:payroll:parallel-validation-ready', { detail: report }));
    }catch(e){ lastError = e; warn(e); }
    return report;
  }

  function schedule(reason){
    if(scheduled) return;
    scheduled = true;
    setTimeout(function(){
      scheduled = false;
      try{ buildReport(reason || 'scheduled-shadow-check'); }
      catch(e){ lastError = e; warn(e); }
    }, 0);
  }

  var api = {
    __phase9gSafe: true,
    version: VERSION,
    mode: 'shadow-parallel-validation-read-only',
    runManualCheck: buildReport,
    scheduleCheck: schedule,
    getLastReport: function(){ return lastReport; },
    getLastError: function(){ return lastError; }
  };

  try{ window.PETATOEPayrollParallelValidation = Object.freeze(api); }
  catch(e){ window.PETATOEPayrollParallelValidation = api; }
  schedule('initial-load');
})();
