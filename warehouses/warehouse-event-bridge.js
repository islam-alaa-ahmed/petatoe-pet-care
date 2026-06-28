/* PETATOE v6.2.29 - Phase 7H SAFE Warehouse Event Bridge
   Shadow-mode event contract only. No DOM mutation, no storage writes, no event takeover,
   no preventDefault, no stopPropagation, and no calls to warehouse save/delete/edit functions.
   Purpose: document and expose the future warehouse event bridge contract before any real extraction. */
(function(){
  'use strict';

  var FILE = 'warehouses/warehouse-event-bridge.js';
  var VERSION = 'v6.2.29-phase7h-safe-event-bridge';
  var lastAudit = null;
  var lastError = null;

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(FILE, e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-event-bridge.js::warn-fallback', _e);
      }
    }
  }

  function byId(id){
    try{ return document.getElementById(id); }catch(e){ lastError = e; warn(e); return null; }
  }

  function exists(id){ return !!byId(id); }

  var EVENT_CONTRACT = Object.freeze({
    tabs: Object.freeze({
      selector: '[data-wh-tab]',
      currentOwner: 'warehouse-core/openTab via existing inline bridge',
      futureOwner: 'warehouse-events facade after validation',
      takeoverAllowedNow: false
    }),
    filters: Object.freeze({
      selectors: Object.freeze([
        '#whItemSearch','#whItemTypeFilter','#whItemStatusFilter',
        '#whStockSearch','#whStockStore','#whStockStatus',
        '#whLowAlertSearch','#whLowAlertStore','#whLowAlertLevel','#whLowAlertLimit',
        '#whMoveSearch','#whMoveStore','#whMoveTypeFilter',
        '#whStatementSearch','#whStatementItem','#whStatementType',
        '#whInventoryStore','#whInventorySearch',
        '#whSlowStore','#whSlowDays','#whSlowSearch',
        '#whFastStore','#whFastDays','#whFastSearch'
      ]),
      currentOwner: 'warehouse-core render/filter functions',
      futureOwner: 'warehouse-events facade with delegated listeners',
      takeoverAllowedNow: false
    }),
    commands: Object.freeze({
      safeReadOnlyCommands: Object.freeze([
        'openTab','refreshAll','renderInventory','renderSlowItems','renderFastItems',
        'openStatementFromSelect','exportItemsCsv','exportMovementsCsv','exportStatementCsv',
        'exportInventoryCsv','exportSlowCsv','exportFastCsv','printStatement'
      ]),
      writeCommandsDeferred: Object.freeze([
        'saveItem','clearItemForm','saveMovement','clearForm','deleteItem','editItem','setLimit'
      ]),
      takeoverAllowedNow: false
    })
  });

  function collectTargetPresence(){
    var ids = [
      'warehouses','whItemSearch','whItemTypeFilter','whItemStatusFilter','whStockSearch','whStockStore','whStockStatus',
      'whLowAlertSearch','whLowAlertStore','whLowAlertLevel','whLowAlertLimit','whMoveType','whFrom','whTo','whItem','whQty',
      'whMoveSearch','whMoveStore','whMoveTypeFilter','whStatementStoreSelect','whStatementSearch','whStatementItem','whStatementType',
      'whInventoryStore','whInventorySearch','whSlowStore','whSlowDays','whSlowSearch','whFastStore','whFastDays','whFastSearch'
    ];
    var out = {};
    ids.forEach(function(id){ out[id] = exists(id); });
    return out;
  }

  function countWarehouseInlineHandlers(){
    var panel = byId('warehouses');
    var counts = { onclick:0, onchange:0, oninput:0, onblur:0, total:0 };
    if(!panel || !panel.querySelectorAll) return counts;
    ['onclick','onchange','oninput','onblur'].forEach(function(attr){
      try{ counts[attr] = panel.querySelectorAll('[' + attr + ']').length; }
      catch(e){ lastError = e; warn(e); counts[attr] = 0; }
    });
    counts.total = counts.onclick + counts.onchange + counts.oninput + counts.onblur;
    return counts;
  }

  function buildAudit(reason){
    var audit = {
      version: VERSION,
      mode: 'shadow-event-bridge-contract-only',
      reason: String(reason || 'manual'),
      time: new Date().toISOString(),
      contract: EVENT_CONTRACT,
      targetPresence: collectTargetPresence(),
      inlineHandlersInWarehousePanel: countWarehouseInlineHandlers(),
      takeoverApplied: false,
      listenersAttached: 0,
      domWritesApplied: 0,
      storageWritesApplied: 0
    };
    try{ Object.freeze(audit.targetPresence); Object.freeze(audit.inlineHandlersInWarehousePanel); Object.freeze(audit); }catch(e){ warn(e); }
    lastAudit = audit;
    try{ window.__PETATOEWarehouseEventBridgeLastAudit = audit; }catch(e){ lastError = e; warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:warehouse:event-bridge-shadow-ready', { detail: audit }));
    }catch(e){ lastError = e; warn(e); }
    return audit;
  }

  function runManualCheck(){ return buildAudit('manual-check'); }
  function getLastAudit(){ return lastAudit; }
  function getLastError(){ return lastError; }
  function getContract(){ return EVENT_CONTRACT; }

  var api = {
    version: VERSION,
    mode: 'shadow-read-only-event-bridge',
    getContract: getContract,
    runManualCheck: runManualCheck,
    getLastAudit: getLastAudit,
    getLastError: getLastError
  };

  try{ Object.freeze(api); }catch(e){ warn(e); }
  window.PETATOEWarehouseEventBridge = window.PETATOEWarehouseEventBridge || api;
})();
