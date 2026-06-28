/* PETATOE v6.2.44 — Phase 9E-SAFE Payroll Render Bridge
   Shadow-mode bridge only. No DOM mutation, no storage writes, no event takeover.
   Purpose: connect payroll read/computed/view-model facades with existing payroll UI targets
   and expose a comparable render readiness snapshot before any real extraction. */
(function(){
  'use strict';

  var FILE = 'payroll/payroll-render-bridge.js';
  var VERSION = 'v6.2.44-phase9e-safe-payroll-render-bridge';
  var lastBridgeResult = null;
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

  function safeArray(v){ return Array.isArray(v) ? v : []; }
  function safeLen(v){ return typeof v === 'string' ? v.length : 0; }
  function viewFacade(){ return window.PETATOEPayrollViewModelFacade || null; }

  function getSnapshot(){
    try{
      var facade = viewFacade();
      if(facade && typeof facade.snapshot === 'function') return facade.snapshot();
    }catch(e){ lastError = e; warn(e); }
    return null;
  }

  function getDashboard(){
    try{
      var facade = viewFacade();
      if(facade && typeof facade.dashboard === 'function') return facade.dashboard();
    }catch(e){ lastError = e; warn(e); }
    return null;
  }

  function getExistingTargetState(){
    var ids = [
      'payrollArea',
      'salarySlipArea',
      'payroll',
      'salarySlip',
      'commissionStatement'
    ];
    var state = {};
    ids.forEach(function(id){
      try{
        var el = document.getElementById(id);
        state[id] = {
          exists: !!el,
          tag: el && el.tagName ? String(el.tagName).toLowerCase() : '',
          childCount: el && el.children ? el.children.length : 0,
          textLength: el && typeof el.textContent === 'string' ? el.textContent.length : 0,
          valueLength: el && typeof el.value === 'string' ? el.value.length : 0,
          htmlLength: el && typeof el.innerHTML === 'string' ? el.innerHTML.length : 0
        };
      }catch(e){
        state[id] = { exists:false, childCount:0, textLength:0, valueLength:0, htmlLength:0, error:true };
        warn(e);
      }
    });
    return state;
  }

  function summarizeDashboard(dashboard){
    dashboard = dashboard || {};
    return {
      cards: safeArray(dashboard.cards).length,
      statusCountKeys: dashboard.statusCounts ? Object.keys(dashboard.statusCounts).length : 0,
      periodLength: safeLen(dashboard.period)
    };
  }

  function summarizeSnapshot(snapshot){
    snapshot = snapshot || {};
    return {
      employees: Number(snapshot.employees || 0),
      slips: Number(snapshot.slips || 0),
      periods: safeArray(snapshot.periods).length,
      modeLength: safeLen(snapshot.mode)
    };
  }

  function buildBridgeResult(reason){
    var snapshot = getSnapshot();
    var dashboard = getDashboard();
    var targetState = getExistingTargetState();
    var result = {
      version: VERSION,
      mode: 'shadow-render-bridge-read-only',
      reason: String(reason || 'manual'),
      time: new Date().toISOString(),
      snapshotReady: !!snapshot,
      dashboardReady: !!dashboard,
      snapshotCounts: summarizeSnapshot(snapshot),
      dashboardCounts: summarizeDashboard(dashboard),
      targetState: targetState,
      canBridgePayrollArea: !!(snapshot && targetState.payrollArea && targetState.payrollArea.exists),
      canBridgeSalarySlipArea: !!(snapshot && targetState.salarySlipArea && targetState.salarySlipArea.exists),
      canBridgePayrollPanel: !!(targetState.payroll && targetState.payroll.exists),
      canBridgeSalarySlipPanel: !!(targetState.salarySlip && targetState.salarySlip.exists),
      writesApplied: 0
    };
    try{ Object.freeze(result.snapshotCounts); Object.freeze(result.dashboardCounts); Object.freeze(result.targetState); Object.freeze(result); }catch(e){ warn(e); }
    lastBridgeResult = result;
    try{ window.__PETATOEPayrollRenderBridgeLastResult = result; }catch(e){ warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:payroll:render-bridge-shadow-ready', { detail: result }));
    }catch(e){ warn(e); }
    return result;
  }

  function scheduleBridge(reason){
    if(scheduled) return;
    scheduled = true;
    setTimeout(function(){
      scheduled = false;
      try{ buildBridgeResult(reason || 'scheduled'); }catch(e){ lastError = e; warn(e); }
    }, 80);
  }

  function runManualCheck(){ return buildBridgeResult('manual-check'); }
  function getLastResult(){ return lastBridgeResult; }
  function getLastError(){ return lastError; }

  /* Shadow listeners only. They never prevent or replace existing payroll behavior. */
  try{
    document.addEventListener('petatoe:payroll:ui-rendered', function(){ scheduleBridge('payroll-ui-rendered'); });
    document.addEventListener('petatoe:payroll:slip-rendered', function(){ scheduleBridge('payroll-slip-rendered'); });
    document.addEventListener('petatoe:payroll:record-saved', function(){ scheduleBridge('payroll-record-saved'); });
  }catch(e){ lastError = e; warn(e); }

  var api = {
    version: VERSION,
    mode: 'shadow-read-only-render-bridge',
    runManualCheck: runManualCheck,
    getLastResult: getLastResult,
    getLastError: getLastError,
    scheduleBridge: scheduleBridge
  };

  try{ Object.freeze(api); }catch(e){ warn(e); }
  window.PETATOEPayrollRenderBridge = window.PETATOEPayrollRenderBridge || api;
})();
