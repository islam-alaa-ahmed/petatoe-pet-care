/* PETATOE v6.2.37 - Phase 8F SAFE Treasury Event Bridge
   Shadow-contract bridge only. No DOM mutation, no storage writes, no event takeover.
   Purpose: inventory existing treasury UI/event contracts and expose safe mapping for future extraction. */
(function(){
  'use strict';

  var FILE = 'treasury/treasury-event-bridge.js';
  var VERSION = 'v6.2.37-phase8f-safe-treasury-event-bridge';
  var lastSnapshot = null;
  var lastError = null;
  var scheduled = false;

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(FILE, e);
      }
    }catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('treasury/treasury-event-bridge.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('treasury/treasury-event-bridge.js',_petatoeSilentCatch);}}
  }

  function fnExists(name){
    try{ return typeof window[name] === 'function'; }catch(e){ warn(e); return false; }
  }

  function elState(id){
    try{
      var el = document.getElementById(id);
      return {
        id: id,
        exists: !!el,
        tag: el && el.tagName ? String(el.tagName).toLowerCase() : '',
        type: el && el.type ? String(el.type) : '',
        valueLength: el && typeof el.value === 'string' ? el.value.length : 0,
        checked: !!(el && el.checked),
        disabled: !!(el && el.disabled),
        datasetKeys: el && el.dataset ? Object.keys(el.dataset).sort() : []
      };
    }catch(e){ lastError = e; warn(e); return { id:id, exists:false, error:true, datasetKeys:[] }; }
  }

  function getTreasuryContracts(){
    var names = [
      'showTreasuryTab',
      'renderTreasury',
      'renderTreasuryDashboard',
      'renderTreasuryMovements',
      'saveTreasuryMovement',
      'deleteTreasuryMovement',
      'editTreasuryMovement',
      'renderTreasuryStatement',
      'exportTreasuryPDF',
      'exportTreasuryExcel',
      'printTreasuryStatement',
      'clearTreasuryForm',
      'resetTreasuryFilters',
      'populateTreasuryFilters'
    ];
    var contracts = {};
    names.forEach(function(name){ contracts[name] = fnExists(name); });
    return contracts;
  }

  function getUiEventTargets(){
    var ids = [
      'treasuryTabDashboard',
      'treasuryTabMovements',
      'treasuryTabStatement',
      'treasuryMovementForm',
      'treasuryMovementType',
      'treasuryMovementSource',
      'treasuryMovementAmount',
      'treasuryMovementDate',
      'treasuryMovementNote',
      'trVehicle',
      'trExpenseSource',
      'trFilterVehicle',
      'trFilterType',
      'trStatementFrom',
      'trStatementTo',
      'treasurySearchInput'
    ];
    return ids.map(elState);
  }

  function countReadyTargets(targets){ return targets.filter(function(t){ return !!t.exists; }).length; }
  function countContracts(contracts){ return Object.keys(contracts).filter(function(k){ return !!contracts[k]; }).length; }

  function buildSnapshot(reason){
    var contracts = getTreasuryContracts();
    var targets = getUiEventTargets();
    var renderBridgeReady = !!(window.PETATOETreasuryRenderBridge && typeof window.PETATOETreasuryRenderBridge.runManualCheck === 'function');
    var vmReady = !!(window.PETATOETreasuryViewModelFacade && typeof window.PETATOETreasuryViewModelFacade.dashboardViewModel === 'function');
    var snapshot = {
      version: VERSION,
      mode: 'shadow-event-bridge-read-only',
      reason: String(reason || 'manual'),
      time: new Date().toISOString(),
      contracts: contracts,
      contractCount: countContracts(contracts),
      targets: targets,
      targetCount: countReadyTargets(targets),
      renderBridgeReady: renderBridgeReady,
      viewModelReady: vmReady,
      canPlanFutureDelegation: renderBridgeReady && vmReady && countContracts(contracts) > 0,
      listenersAttachedForBehavior: 0,
      writesApplied: 0
    };
    try{ Object.freeze(snapshot.contracts); Object.freeze(snapshot.targets); Object.freeze(snapshot); }catch(e){ warn(e); }
    lastSnapshot = snapshot;
    try{ window.__PETATOETreasuryEventBridgeLastSnapshot = snapshot; }catch(e){ warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:treasury:event-bridge-shadow-ready', { detail: snapshot }));
    }catch(e){ lastError = e; warn(e); }
    return snapshot;
  }

  function schedule(reason){
    if(scheduled) return;
    scheduled = true;
    setTimeout(function(){
      scheduled = false;
      try{ buildSnapshot(reason || 'scheduled'); }catch(e){ lastError = e; warn(e); }
    }, 100);
  }

  function runManualCheck(){ return buildSnapshot('manual-check'); }
  function getLastSnapshot(){ return lastSnapshot; }
  function getLastError(){ return lastError; }

  try{
    document.addEventListener('petatoe:treasury:render-bridge-shadow-ready', function(){ schedule('render-bridge-ready'); });
    document.addEventListener('petatoe:treasury:ui-rendered', function(){ schedule('treasury-ui-rendered'); });
  }catch(e){ lastError = e; warn(e); }

  var api = {
    version: VERSION,
    mode: 'shadow-read-only-event-bridge',
    runManualCheck: runManualCheck,
    getLastSnapshot: getLastSnapshot,
    getLastError: getLastError,
    schedule: schedule
  };

  try{ Object.freeze(api); }catch(e){ warn(e); }
  window.PETATOETreasuryEventBridge = window.PETATOETreasuryEventBridge || api;
})();
