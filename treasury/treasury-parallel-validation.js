/* PETATOE v6.2.38 - Phase 8G SAFE Treasury Parallel Validation
   Read-only validation layer. No DOM mutation, no storage writes, no event takeover.
   Purpose: compare legacy treasury runtime availability with the new SAFE facades before any future takeover. */
(function(){
  'use strict';

  var FILE = 'treasury/treasury-parallel-validation.js';
  var VERSION = 'v6.2.38-phase8g-safe-treasury-parallel-validation';
  var lastReport = null;
  var lastError = null;
  var scheduled = false;

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(FILE, e);
      }
    }catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('treasury/treasury-parallel-validation.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('treasury/treasury-parallel-validation.js',_petatoeSilentCatch);}}
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

  function legacyContracts(){
    var names = [
      'renderTreasury','renderTreasuryDashboard','renderTreasuryMovements','renderTreasuryStatement',
      'saveTreasuryMovement','editTreasuryMovement','deleteTreasuryMovement',
      'exportTreasuryPDF','exportTreasuryExcel','printTreasuryStatement'
    ];
    var out = {};
    names.forEach(function(n){ out[n] = fnExists(n); });
    return out;
  }
  function countTrue(map){ return Object.keys(map || {}).filter(function(k){ return !!map[k]; }).length; }

  function facadeSnapshot(){
    var read = window.PETATOETreasuryReadFacade || null;
    var computed = window.PETATOETreasuryComputedFacade || null;
    var vm = window.PETATOETreasuryViewModelFacade || null;
    var renderBridge = window.PETATOETreasuryRenderBridge || null;
    var eventBridge = window.PETATOETreasuryEventBridge || null;

    var tx = safeCall(read, 'transactions') || [];
    var audit = safeCall(read, 'audit') || [];
    var categories = safeCall(read, 'categories') || [];
    var summary = safeCall(read, 'summary') || {};
    var totals = safeCall(computed, 'totalsByType') || {};
    var sources = safeCall(computed, 'totalsBySource') || [];
    var vaults = safeCall(computed, 'vaultBalances') || [];
    var dashboardVm = safeCall(vm, 'dashboardViewModel') || null;
    var renderCheck = safeCall(renderBridge, 'runManualCheck', 'phase8g-parallel-validation') || null;
    var eventCheck = safeCall(eventBridge, 'runManualCheck', 'phase8g-parallel-validation') || null;

    return {
      readReady: !!read,
      computedReady: !!computed,
      viewModelReady: !!vm,
      renderBridgeReady: !!renderBridge,
      eventBridgeReady: !!eventBridge,
      transactionCount: arrayLen(tx),
      auditCount: arrayLen(audit),
      categoryCount: arrayLen(categories),
      sourceCount: arrayLen(sources),
      vaultCount: arrayLen(vaults),
      mainBalance: visible(summary && summary.mainBalance),
      handoverTotal: visible(totals && totals.handover),
      expenseTotal: visible(totals && totals.expense),
      dashboardVmReady: !!dashboardVm,
      renderBridgeMode: clean(renderCheck && renderCheck.mode),
      eventBridgeMode: clean(eventCheck && eventCheck.mode)
    };
  }

  function riskAssessment(contracts, f){
    var risks = [];
    if(!f.readReady) risks.push('read-facade-missing');
    if(!f.computedReady) risks.push('computed-facade-missing');
    if(!f.viewModelReady) risks.push('view-model-facade-missing');
    if(f.transactionCount === 0) risks.push('no-treasury-transactions-visible-to-facade');
    if(countTrue(contracts) === 0) risks.push('legacy-contracts-not-detected');
    if(f.renderBridgeReady && f.renderBridgeMode && f.renderBridgeMode !== 'shadow-render-bridge-read-only') risks.push('unexpected-render-bridge-mode');
    if(f.eventBridgeReady && f.eventBridgeMode && f.eventBridgeMode !== 'shadow-event-bridge-read-only') risks.push('unexpected-event-bridge-mode');
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
      listenersAttachedForBehavior: 0
    };
    try{ Object.freeze(report.legacyContracts); Object.freeze(report.facade); Object.freeze(report.risks); Object.freeze(report); }catch(e){ warn(e); }
    lastReport = report;
    try{ window.__PETATOETreasuryParallelValidationLastReport = report; }catch(e){ warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:treasury:parallel-validation-ready', { detail: report }));
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
    __phase8gSafe: true,
    version: VERSION,
    mode: 'shadow-parallel-validation-read-only',
    runManualCheck: buildReport,
    scheduleCheck: schedule,
    getLastReport: function(){ return lastReport; },
    getLastError: function(){ return lastError; }
  };

  try{ window.PETATOETreasuryParallelValidation = Object.freeze(api); }
  catch(e){ window.PETATOETreasuryParallelValidation = api; }
  schedule('initial-load');
})();
