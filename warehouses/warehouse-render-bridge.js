/* PETATOE v6.2.28 - Phase 7G SAFE Warehouse Render Bridge
   Shadow-mode bridge only. No DOM mutation, no storage writes, no event takeover.
   Purpose: connect read/view-model/render-snapshot facades with existing warehouse render lifecycle
   and expose a comparable snapshot for validation before any real extraction. */
(function(){
  'use strict';

  var FILE = 'warehouses/warehouse-render-bridge.js';
  var VERSION = 'v6.2.28-phase7g-safe-render-bridge';
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
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-render-bridge.js::warn-fallback', _e);
      }
    }
  }

  function safeArray(v){ return Array.isArray(v) ? v : []; }

  function getSnapshot(options){
    try{
      var facade = window.PETATOEWarehouseRenderSnapshotFacade;
      if(facade && typeof facade.getRenderSnapshot === 'function'){
        return facade.getRenderSnapshot(options || { stockLimit: 25, transactionLimit: 25 });
      }
    }catch(e){ lastError = e; warn(e); }
    return null;
  }

  function getExistingTargetState(){
    var ids = [
      'whKpis',
      'whStockBody',
      'whRecentBody',
      'whItemsBody',
      'whInventoryBody',
      'whSlowBody',
      'whFastBody'
    ];
    var state = {};
    ids.forEach(function(id){
      try{
        var el = document.getElementById(id);
        state[id] = {
          exists: !!el,
          childCount: el && el.children ? el.children.length : 0,
          textLength: el && typeof el.textContent === 'string' ? el.textContent.length : 0
        };
      }catch(e){ state[id] = { exists:false, childCount:0, textLength:0, error:true }; warn(e); }
    });
    return state;
  }

  function buildBridgeResult(reason){
    var snapshot = getSnapshot({ stockLimit: 25, transactionLimit: 25 });
    var targetState = getExistingTargetState();
    var result = {
      version: VERSION,
      mode: 'shadow-render-bridge-read-only',
      reason: String(reason || 'manual'),
      time: new Date().toISOString(),
      snapshotReady: !!snapshot,
      snapshotCounts: snapshot && snapshot.counts ? snapshot.counts : { summaryCards:0, stockRows:0, transactionRows:0 },
      targetState: targetState,
      canBridgeSummary: !!(snapshot && snapshot.summaryCardsHTML && targetState.whKpis && targetState.whKpis.exists),
      canBridgeStockRows: !!(snapshot && snapshot.stockRowsHTML && targetState.whStockBody && targetState.whStockBody.exists),
      canBridgeTransactionRows: !!(snapshot && snapshot.transactionRowsHTML && targetState.whRecentBody && targetState.whRecentBody.exists),
      writesApplied: 0
    };
    try{ Object.freeze(result.snapshotCounts); Object.freeze(result.targetState); Object.freeze(result); }catch(e){ warn(e); }
    lastBridgeResult = result;
    try{ window.__PETATOEWarehouseRenderBridgeLastResult = result; }catch(e){ warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:warehouse:render-bridge-shadow-ready', { detail: result }));
    }catch(e){ warn(e); }
    return result;
  }

  function scheduleBridge(reason){
    if(scheduled) return;
    scheduled = true;
    setTimeout(function(){
      scheduled = false;
      try{ buildBridgeResult(reason || 'scheduled'); }catch(e){ lastError = e; warn(e); }
    }, 60);
  }

  function runManualCheck(){
    return buildBridgeResult('manual-check');
  }

  function getLastResult(){ return lastBridgeResult; }
  function getLastError(){ return lastError; }

  try{
    document.addEventListener('petatoe:warehouse:ui-rendered', function(){ scheduleBridge('warehouse-ui-rendered'); });
    document.addEventListener('petatoe:warehouse:movement-saved', function(){ scheduleBridge('warehouse-movement-saved'); });
    document.addEventListener('petatoe:warehouse:item-changed', function(){ scheduleBridge('warehouse-item-changed'); });
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
  window.PETATOEWarehouseRenderBridge = window.PETATOEWarehouseRenderBridge || api;
})();
