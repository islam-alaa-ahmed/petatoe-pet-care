/*
 * PETATOE v6.4.24 — PHASE R5 ROUTER FINALIZATION AUDIT
 * SAFE/AUDIT ONLY.
 *
 * This layer does not transfer route ownership, does not lazy-load modules,
 * and does not replace PETATOERouter or NavigationController.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.24_PHASE_R5_ROUTER_FINALIZATION_AUDIT';
  var EXPECTED_LAYERS = [
    'PETATOERouteRegistry',
    'PETATOERouterControllerShadowSafe',
    'PETATOEModuleOwnershipShadow',
    'PETATOEReportsShadowOwnershipValidation',
    'PETATOEPayrollShadowOwnershipValidation',
    'PETATOEWarehouseShadowOwnershipValidation',
    'PETATOETreasuryShadowOwnershipValidation',
    'PETATOEOperationsShadowOwnershipValidation',
    'PETATOEFullShadowSystemAudit',
    'PETATOERouterOwnershipAudit',
    'PETATOERouterAdapterShadowLayer',
    'PETATOERouterAdapterGuardedPilot',
    'PETATOERouterStabilityValidation',
    'PETATOEDashboardRouteOwnershipPilot'
  ];

  var CRITICAL_ROUTES = [
    'dashboard',
    'smart',
    'payroll',
    'salarySlip',
    'warehouse',
    'treasury',
    'appointments',
    'carOperations',
    'carOperationsReports'
  ];

  function hasObject(name){
    return !!(window && window[name]);
  }

  function safeCall(obj, fn){
    try{
      if(obj && typeof obj[fn] === 'function'){
        return { ok:true, value: obj[fn]() };
      }
      return { ok:false, reason:'missing_function' };
    }catch(err){
      return { ok:false, reason:'exception', message: err && err.message ? err.message : String(err) };
    }
  }

  function resolveRoute(route){
    var adapter = window.PETATOERouterAdapterShadowLayer;
    if(adapter && typeof adapter.resolve === 'function'){
      try{
        return { ok:true, route: route, via:'PETATOERouterAdapterShadowLayer.resolve', result: adapter.resolve(route) };
      }catch(err){
        return { ok:false, route: route, via:'PETATOERouterAdapterShadowLayer.resolve', error: err && err.message ? err.message : String(err) };
      }
    }
    var registry = window.PETATOERouteRegistry;
    if(registry && typeof registry.resolve === 'function'){
      try{
        return { ok:true, route: route, via:'PETATOERouteRegistry.resolve', result: registry.resolve(route) };
      }catch(err2){
        return { ok:false, route: route, via:'PETATOERouteRegistry.resolve', error: err2 && err2.message ? err2.message : String(err2) };
      }
    }
    return { ok:false, route: route, via:null, error:'no_resolver_available' };
  }

  function audit(){
    var layers = EXPECTED_LAYERS.map(function(name){ return { name:name, available: hasObject(name) }; });
    var routeResolution = CRITICAL_ROUTES.map(resolveRoute);

    var routerAvailable = !!window.PETATOERouter;
    var routerOpenTabAvailable = !!(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function');
    var navigationControllerAvailable = !!window.PETATOENavigationController;

    var dashboardPilot = safeCall(window.PETATOEDashboardRouteOwnershipPilot, 'validate');
    var stability = safeCall(window.PETATOERouterStabilityValidation, 'validate');
    var fullShadow = safeCall(window.PETATOEFullShadowSystemAudit, 'audit');

    var missingLayers = layers.filter(function(x){ return !x.available; }).map(function(x){ return x.name; });
    var unresolvedRoutes = routeResolution.filter(function(x){ return !x.ok; }).map(function(x){ return x.route; });

    var readyForExpansion = missingLayers.length === 0 && unresolvedRoutes.length === 0 && routerAvailable && routerOpenTabAvailable;

    return {
      version: VERSION,
      mode: 'SAFE_AUDIT_ONLY',
      ownershipTransfer: false,
      lazyLoading: false,
      routerReplacement: false,
      routerAvailable: routerAvailable,
      routerOpenTabAvailable: routerOpenTabAvailable,
      navigationControllerAvailable: navigationControllerAvailable,
      layers: layers,
      missingLayers: missingLayers,
      criticalRoutes: routeResolution,
      unresolvedRoutes: unresolvedRoutes,
      dashboardPilotValidation: dashboardPilot,
      stabilityValidation: stability,
      fullShadowAudit: fullShadow,
      readyForNextControlledPilot: readyForExpansion,
      recommendation: readyForExpansion
        ? 'Eligible for a next guarded pilot only. Do not expand to reports/payroll/warehouse/treasury/operations without a dedicated SAFE pre-audit.'
        : 'Do not expand ownership. Resolve missing layers or unresolved routes first.'
    };
  }

  function snapshot(){
    return audit();
  }

  window.PETATOERouterFinalizationAudit = {
    version: VERSION,
    audit: audit,
    snapshot: snapshot,
    criticalRoutes: CRITICAL_ROUTES.slice(),
    expectedLayers: EXPECTED_LAYERS.slice()
  };
})();
