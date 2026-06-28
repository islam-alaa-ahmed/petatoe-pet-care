/* PETATOE v6.2.36 - Phase 8E SAFE Treasury Render Bridge
   Shadow-mode bridge only. No DOM mutation, no storage writes, no event takeover.
   Purpose: connect treasury read/computed/view-model facades with existing treasury UI targets
   and expose a comparable render readiness snapshot before any real extraction. */
(function(){
  'use strict';

  var FILE = 'treasury/treasury-render-bridge.js';
  var VERSION = 'v6.2.36-phase8e-safe-treasury-render-bridge';
  var lastBridgeResult = null;
  var lastError = null;
  var scheduled = false;

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(FILE, e);
      }
    }catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('treasury/treasury-render-bridge.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('treasury/treasury-render-bridge.js',_petatoeSilentCatch);}}
  }

  function safeArray(v){ return Array.isArray(v) ? v : []; }
  function safeLen(v){ return typeof v === 'string' ? v.length : 0; }
  function viewFacade(){ return window.PETATOETreasuryViewModelFacade || null; }

  function getViewModel(){
    try{
      var facade = viewFacade();
      if(facade && typeof facade.dashboardViewModel === 'function') return facade.dashboardViewModel();
    }catch(e){ lastError = e; warn(e); }
    return null;
  }

  function getExistingTargetState(){
    var ids = [
      'treasuryKpis',
      'treasuryOwnerVaultCard',
      'treasuryVaultCards',
      'treasuryMovementBody',
      'treasuryStatementCard',
      'trStatementKpis',
      'trStatementBody',
      'trVehicle',
      'trExpenseSource',
      'trFilterVehicle',
      'trFilterType'
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
      }catch(e){ state[id] = { exists:false, childCount:0, textLength:0, valueLength:0, htmlLength:0, error:true }; warn(e); }
    });
    return state;
  }

  function summarizeViewModel(vm){
    vm = vm || {};
    return {
      cards: safeArray(vm.cards).length,
      vaultBalances: safeArray(vm.vaultBalances).length,
      totalsByType: safeArray(vm.totalsByType).length,
      totalsBySource: safeArray(vm.totalsBySource).length,
      recentDailyTotals: safeArray(vm.recentDailyTotals).length,
      integrity: safeArray(vm.integrity).length,
      generatedAtLength: safeLen(vm.generatedAt)
    };
  }

  function buildBridgeResult(reason){
    var vm = getViewModel();
    var targetState = getExistingTargetState();
    var counts = summarizeViewModel(vm);
    var result = {
      version: VERSION,
      mode: 'shadow-render-bridge-read-only',
      reason: String(reason || 'manual'),
      time: new Date().toISOString(),
      viewModelReady: !!vm,
      viewModelCounts: counts,
      targetState: targetState,
      canBridgeKpis: !!(vm && counts.cards && targetState.treasuryKpis && targetState.treasuryKpis.exists),
      canBridgeOwnerVault: !!(vm && targetState.treasuryOwnerVaultCard && targetState.treasuryOwnerVaultCard.exists),
      canBridgeVaultCards: !!(vm && counts.vaultBalances && targetState.treasuryVaultCards && targetState.treasuryVaultCards.exists),
      canBridgeMovementRows: !!(vm && targetState.treasuryMovementBody && targetState.treasuryMovementBody.exists),
      canBridgeStatementRows: !!(vm && targetState.trStatementBody && targetState.trStatementBody.exists),
      writesApplied: 0
    };
    try{ Object.freeze(result.viewModelCounts); Object.freeze(result.targetState); Object.freeze(result); }catch(e){ warn(e); }
    lastBridgeResult = result;
    try{ window.__PETATOETreasuryRenderBridgeLastResult = result; }catch(e){ warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:treasury:render-bridge-shadow-ready', { detail: result }));
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

  try{
    document.addEventListener('petatoe:treasury:ui-rendered', function(){ scheduleBridge('treasury-ui-rendered'); });
    document.addEventListener('petatoe:treasury:movement-saved', function(){ scheduleBridge('treasury-movement-saved'); });
    document.addEventListener('petatoe:treasury:statement-rendered', function(){ scheduleBridge('treasury-statement-rendered'); });
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
  window.PETATOETreasuryRenderBridge = window.PETATOETreasuryRenderBridge || api;
})();
