(function(){
  'use strict';

  var VERSION = 'v6.4.43_PHASE_WHX_A_WAREHOUSE_CONSOLIDATED_AUDIT_FACADE_PROBE';
  var PUBLIC_API_HINTS = [
    'refreshAll',
    'render',
    'renderStockCards',
    'renderMovements',
    'renderStatement',
    'openStatementFromSelect',
    'closeStatement',
    'saveMovement',
    'clearForm',
    'exportMovementsCsv',
    'exportStatementCsv',
    'printStatement',
    'clearStatementFilters'
  ];

  var DOM_TARGETS = [
    'whMovementBody',
    'whStatementBody',
    'whStatementKpis',
    'whStatementCard',
    'whStatementStoreSelect',
    'whMoveSearch',
    'whMoveStore',
    'whMoveTypeFilter',
    'whStatementSearch',
    'whStatementItem',
    'whStatementType'
  ];

  var probeHistory = [];

  function now(){
    return new Date().toISOString();
  }

  function getLegacy(){
    return window.PETATOEWarehouses || window.PETATOEWarehouse || null;
  }

  function getExistingLayers(){
    return {
      readFacade: !!window.PETATOEWarehouseReadFacade,
      computedFacade: !!window.PETATOEWarehouseComputedFacade,
      viewModelFacade: !!window.PETATOEWarehouseViewModelFacade,
      renderSnapshotFacade: !!window.PETATOEWarehouseRenderSnapshotFacade,
      renderBridge: !!window.PETATOEWarehouseRenderBridge,
      eventBridge: !!window.PETATOEWarehouseEventBridge,
      parallelValidation: !!window.PETATOEWarehouseParallelValidation,
      shadowAudit: !!window.PETATOEWarehouseShadowAudit
    };
  }

  function getDomTargets(){
    return DOM_TARGETS.map(function(id){
      var el = document.getElementById(id);
      return {
        id: id,
        exists: !!el,
        tag: el ? el.tagName : null,
        visible: !!(el && el.offsetParent !== null)
      };
    });
  }

  function resolve(name){
    var legacy = getLegacy();
    var value = legacy && legacy[name];
    var result = {
      name: name,
      exists: typeof value !== 'undefined',
      type: typeof value,
      callable: typeof value === 'function',
      owner: legacy ? (window.PETATOEWarehouses ? 'PETATOEWarehouses' : 'PETATOEWarehouse') : null,
      timestamp: now()
    };
    probeHistory.push({ action: 'resolve', result: result });
    return result;
  }

  function validate(){
    var legacy = getLegacy();
    var layers = getExistingLayers();
    var api = PUBLIC_API_HINTS.map(resolve);
    var dom = getDomTargets();
    var result = {
      version: VERSION,
      mode: 'SAFE_CONSOLIDATED_AUDIT_FACADE_PROBE',
      behaviorChange: false,
      legacyExists: !!legacy,
      legacyOwner: legacy ? (window.PETATOEWarehouses ? 'PETATOEWarehouses' : 'PETATOEWarehouse') : null,
      existingLayers: layers,
      publicApiHints: api,
      domTargets: dom,
      missingDomTargets: dom.filter(function(t){ return !t.exists; }).map(function(t){ return t.id; }),
      missingApiHints: api.filter(function(a){ return !a.exists; }).map(function(a){ return a.name; }),
      risk: {
        storageTouched: false,
        routerTouched: false,
        warehouseCoreTouched: false,
        migrationEnabled: false
      },
      recommendation: 'Warehouse looks suitable for audit/facade-only consolidation; controlled migration is not enabled in WHX-A.'
    };
    probeHistory.push({ action: 'validate', result: result, timestamp: now() });
    return result;
  }

  function snapshot(){
    return {
      version: VERSION,
      mode: 'SAFE_ONLY',
      currentTab: window.PETATOERouter ? window.PETATOERouter.current : null,
      legacyExists: !!getLegacy(),
      existingLayers: getExistingLayers(),
      domTargets: getDomTargets(),
      historyCount: probeHistory.length,
      history: probeHistory.slice(-30)
    };
  }

  function history(){
    return probeHistory.slice();
  }

  function resetHistory(){
    probeHistory.length = 0;
    return true;
  }

  window.PETATOEWarehouseConsolidatedFacadeProbe = {
    version: VERSION,
    validate: validate,
    snapshot: snapshot,
    resolve: resolve,
    history: history,
    resetHistory: resetHistory,
    domTargets: getDomTargets,
    layers: getExistingLayers
  };
})();
