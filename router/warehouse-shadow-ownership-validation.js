/* PETATOE v6.4.15 Phase RX8-SAFE - Warehouse Shadow Ownership Validation
 * Purpose: passively validate Warehouse route/module ownership before any real router ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open, close, activate, or render tabs.
 * - Does NOT lazy-load or defer scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, warehouse data, or warehouse modules.
 * - Reads metadata only and exposes a validation snapshot for QA.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.15-rx8-safe-warehouse-shadow-ownership-validation';
  var WAREHOUSE_ROUTE_IDS = ['warehouse', 'warehouses'];
  var WAREHOUSE_MODULE_ID = 'warehouse';
  var WAREHOUSE_OWNER_ID = 'warehouses';
  var WAREHOUSE_PANEL_IDS = ['warehouses'];
  var WAREHOUSE_DOM_IDS = [
    'warehouses',
    'whItemsBody',
    'whStockBody',
    'whMovementBody',
    'whStatementBody',
    'whInventoryBody',
    'whSlowBody',
    'whFastBody'
  ];
  var REQUIRED_HINTS = [
    'warehouses/warehouse-read-facade.js',
    'warehouses/warehouse-computed-facade.js',
    'warehouses/warehouse-view-model-facade.js',
    'warehouses/warehouse-render-snapshot-facade.js',
    'warehouses/warehouse-render-bridge.js',
    'warehouses/warehouse-event-bridge.js',
    'warehouses/warehouse-parallel-validation.js',
    'warehouses/warehouse-core.js',
    'warehouses/warehouse-shadow-audit.js'
  ];
  var EXPECTED_INTERNAL_TABS = ['overview','items','balances','lowalerts','movements','statement','inventory','slow','fast'];

  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    observedTabChanges: 0,
    lastObservedRoute: '',
    lastValidationStatus: 'not-run',
    lastValidatedAt: ''
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){
    return String(value || '').trim();
  }

  function hasFunction(path){
    try{
      var ctx = window;
      var parts = String(path || '').split('.').filter(Boolean);
      for(var i = 0; i < parts.length; i += 1){
        if(ctx == null) return false;
        ctx = ctx[parts[i]];
      }
      return typeof ctx === 'function';
    }catch(_err){ return false; }
  }

  function getRoute(routeId){
    try{
      var registry = window.PETATOERouteRegistry;
      if(!registry || typeof registry.get !== 'function') return null;
      return registry.get(routeId);
    }catch(err){
      warn(err);
      return null;
    }
  }

  function getOwnershipByRoute(routeId){
    try{
      var ownership = window.PETATOEModuleOwnershipShadow;
      if(!ownership || typeof ownership.findByRoute !== 'function') return null;
      return ownership.findByRoute(routeId);
    }catch(err){
      warn(err);
      return null;
    }
  }

  function getReadiness(routeId){
    try{
      var gate = window.PETATOELazyLoadingReadinessGate;
      if(!gate) return null;
      if(typeof gate.check === 'function') return gate.check(routeId);
      if(typeof gate.get === 'function') return gate.get(routeId);
      if(typeof gate.snapshot === 'function'){
        var snap = gate.snapshot();
        var rows = snap && (snap.routes || snap.items || snap.results || []);
        if(Array.isArray(rows)){
          for(var i = 0; i < rows.length; i += 1){
            if(normalize(rows[i].routeId || rows[i].route || rows[i].id) === routeId) return rows[i];
          }
        }
      }
      return null;
    }catch(err){
      warn(err);
      return null;
    }
  }

  function elementState(id){
    var el = document.getElementById(id);
    if(!el){
      return { id: id, exists: false, tagName: '', dataPetModule: '', stableZone: '', phase: '', className: '' };
    }
    return {
      id: id,
      exists: true,
      tagName: normalize(el.tagName).toLowerCase(),
      dataPetModule: normalize(el.getAttribute('data-pet-module')),
      stableZone: normalize(el.getAttribute('data-pet-stable-zone')),
      phase: normalize(el.getAttribute('data-pet-phase')),
      className: normalize(el.className)
    };
  }

  function scriptState(hint){
    var scripts = Array.prototype.slice.call(document.getElementsByTagName('script') || []);
    var matches = scripts.filter(function(script){
      return normalize(script.getAttribute('src')).indexOf(hint) !== -1;
    });
    return { hint: hint, found: matches.length > 0, count: matches.length };
  }

  function internalTabState(tabId){
    var el = document.querySelector('[data-wh-tab="' + tabId + '"]');
    return { tabId: tabId, exists: !!el, text: el ? normalize(el.textContent) : '' };
  }

  function boolCheck(name, passed, details){
    return { name: name, passed: !!passed, details: details || null };
  }

  function hasRouteAlias(route, aliasId){
    return !!route && Array.isArray(route.aliases) && route.aliases.indexOf(aliasId) !== -1;
  }

  function validateRoute(routeId){
    var route = getRoute(routeId);
    var ownership = getOwnershipByRoute(routeId);
    var readiness = getReadiness(routeId);
    return {
      routeId: routeId,
      route: route,
      ownership: ownership,
      readiness: readiness,
      routeExists: !!route,
      moduleMatches: !!route && route.moduleId === WAREHOUSE_MODULE_ID,
      ownerMatches: !!route && route.owner === WAREHOUSE_OWNER_ID,
      eager: !!route && route.eager === true,
      lazyCandidate: !!route && route.lazyCandidate === true,
      ownershipMatches: !!ownership && ownership.moduleId === WAREHOUSE_MODULE_ID,
      realOwnershipBlocked: !!ownership && ownership.blockedForRealOwnership === true
    };
  }

  function validate(){
    var warehouseRoute = validateRoute('warehouse');
    var warehousesRoute = validateRoute('warehouses');
    var dom = WAREHOUSE_DOM_IDS.map(elementState);
    var scripts = REQUIRED_HINTS.map(scriptState);
    var internalTabs = EXPECTED_INTERNAL_TABS.map(internalTabState);
    var checks = [];

    checks.push(boolCheck('route-registry-has-warehouse', warehouseRoute.routeExists, warehouseRoute.route));
    checks.push(boolCheck('route-registry-resolves-warehouses-alias', warehousesRoute.routeExists, warehousesRoute.route));
    checks.push(boolCheck('warehouse-route-module-is-warehouse', warehouseRoute.moduleMatches, warehouseRoute.route && warehouseRoute.route.moduleId));
    checks.push(boolCheck('warehouses-route-module-is-warehouse', warehousesRoute.moduleMatches, warehousesRoute.route && warehousesRoute.route.moduleId));
    checks.push(boolCheck('warehouse-route-owner-is-warehouses', warehouseRoute.ownerMatches, warehouseRoute.route && warehouseRoute.route.owner));
    checks.push(boolCheck('warehouse-route-keeps-warehouses-alias', hasRouteAlias(warehouseRoute.route, 'warehouses'), warehouseRoute.route && warehouseRoute.route.aliases));
    checks.push(boolCheck('warehouse-route-is-still-eager', warehouseRoute.eager, warehouseRoute.route && warehouseRoute.route.eager));
    checks.push(boolCheck('warehouse-route-is-lazy-candidate-only', warehouseRoute.lazyCandidate, warehouseRoute.route && warehouseRoute.route.lazyCandidate));
    checks.push(boolCheck('warehouse-ownership-shadow-has-warehouse-route', warehouseRoute.ownershipMatches, warehouseRoute.ownership));
    checks.push(boolCheck('warehouses-ownership-shadow-has-warehouse-route', warehousesRoute.ownershipMatches, warehousesRoute.ownership));
    checks.push(boolCheck('warehouse-ownership-real-transfer-blocked', warehouseRoute.realOwnershipBlocked, warehouseRoute.ownership && warehouseRoute.ownership.blockedForRealOwnership));
    checks.push(boolCheck('warehouses-panel-exists', dom.some(function(item){ return item.id === 'warehouses' && item.exists; }), dom));
    checks.push(boolCheck('warehouses-panel-module-marker', dom.some(function(item){ return item.id === 'warehouses' && (item.dataPetModule === 'warehouses' || item.dataPetModule === 'warehouse'); }), dom));
    checks.push(boolCheck('warehouse-required-render-targets-exist', ['whItemsBody','whStockBody','whMovementBody'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('warehouse-internal-tabs-exist', internalTabs.every(function(item){ return item.exists; }), internalTabs));
    checks.push(boolCheck('required-warehouse-scripts-still-eager', scripts.every(function(item){ return item.found; }), scripts));
    checks.push(boolCheck('legacy-router-still-present', !!window.PETATOERouter, !!window.PETATOERouter));
    checks.push(boolCheck('navigation-controller-still-present', !!window.PETATOENavigationController, !!window.PETATOENavigationController));
    checks.push(boolCheck('no-real-lazy-loading-from-rx8', true, 'RX8 is validation-only and does not load or defer scripts.'));

    var failed = checks.filter(function(check){ return !check.passed; });
    var status = failed.length ? 'warning' : 'pass';
    activity.lastValidationStatus = status;
    activity.lastValidatedAt = new Date().toISOString();

    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      moduleId: WAREHOUSE_MODULE_ID,
      owner: WAREHOUSE_OWNER_ID,
      routes: WAREHOUSE_ROUTE_IDS.slice(),
      panels: WAREHOUSE_PANEL_IDS.slice(),
      status: status,
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      routeValidations: {
        warehouse: warehouseRoute,
        warehouses: warehousesRoute
      },
      dom: dom,
      internalTabs: internalTabs,
      scripts: scripts,
      warehouseEntrypoints: {
        hasPETATOEWarehouse: !!window.PETATOEWarehouse,
        hasPETATOEWarehouses: !!window.PETATOEWarehouses,
        hasWarehouseOpenTab: hasFunction('PETATOEWarehouse.openTab'),
        hasWarehousesOpenTab: hasFunction('PETATOEWarehouses.openTab'),
        hasLegacyOpenWarehouseTab: hasFunction('openWarehouseTab'),
        hasInlineModuleCall: hasFunction('PETATOEInlineHandlers.moduleCall')
      },
      realOwnershipEnabled: false,
      lazyLoadingEnabled: false
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      activity: clone(activity),
      validation: validate()
    };
  }

  function observeTabChange(evt){
    try{
      var detail = evt && evt.detail || {};
      var routeId = normalize(detail.tabId || detail.routeId || detail.smartOpen || '');
      if(WAREHOUSE_ROUTE_IDS.indexOf(routeId) === -1) return;
      activity.observedTabChanges += 1;
      activity.lastObservedRoute = routeId;
      validate();
    }catch(err){ warn(err); }
  }

  function warn(err){
    if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
      window.PETATOEUtils.warnSilentCatch('warehouse-shadow-ownership-validation.js', err);
    }
  }

  if(document && typeof document.addEventListener === 'function'){
    document.addEventListener('petatoe:tabchange', observeTabChange, false);
  }

  window.PETATOEWarehouseShadowOwnershipValidation = Object.freeze({
    version: VERSION,
    validate: validate,
    snapshot: snapshot,
    getActivity: function(){ return clone(activity); }
  });
})();
