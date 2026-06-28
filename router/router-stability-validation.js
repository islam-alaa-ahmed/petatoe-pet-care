/*
 * PETATOE R3.5 - Stability Validation
 * SAFE / Audit-only layer.
 * Does not open routes, does not transfer ownership, does not lazy-load modules.
 */
(function(window, document){
  'use strict';

  var VERSION = 'PETATOE_v6.4.22_PHASE_R3_5_STABILITY_VALIDATION';

  var CRITICAL_AREAS = [
    {
      key: 'dashboard',
      label: 'Dashboard / Home',
      routes: ['dashboard', 'home'],
      requiredGlobals: ['PETATOERouterAdapterGuardedPilot', 'PETATOERouterAdapterShadowLayer']
    },
    {
      key: 'reports',
      label: 'Reports Center',
      routes: ['smart', 'reports', 'advancedReports'],
      requiredGlobals: ['PETATOEReportsShadowOwnershipValidation']
    },
    {
      key: 'payroll',
      label: 'Payroll / Salary Slip',
      routes: ['payroll', 'salarySlip'],
      requiredGlobals: ['PETATOEPayrollShadowOwnershipValidation']
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      routes: ['warehouse', 'warehouses'],
      requiredGlobals: ['PETATOEWarehouseShadowOwnershipValidation']
    },
    {
      key: 'treasury',
      label: 'Treasury',
      routes: ['treasury', 'cashbox'],
      requiredGlobals: ['PETATOETreasuryShadowOwnershipValidation']
    },
    {
      key: 'operations',
      label: 'Operations',
      routes: ['appointments', 'operations', 'carOperations', 'operationsReports'],
      requiredGlobals: ['PETATOEOperationsShadowOwnershipValidation']
    }
  ];

  function hasGlobal(name){
    return !!window[name];
  }

  function callSafe(obj, method){
    try{
      if(!obj || typeof obj[method] !== 'function') return null;
      return obj[method]();
    }catch(error){
      return { ok: false, error: error && error.message ? error.message : String(error) };
    }
  }

  function getRouteRegistry(){
    return window.PETATOERouteRegistry || window.RouteRegistry || null;
  }

  function resolveRoute(route){
    var adapter = window.PETATOERouterAdapterShadowLayer;
    var registry = getRouteRegistry();
    try{
      if(adapter && typeof adapter.resolve === 'function'){
        return { source: 'adapter', value: adapter.resolve(route) };
      }
      if(registry && typeof registry.resolve === 'function'){
        return { source: 'registry', value: registry.resolve(route) };
      }
      if(registry && typeof registry.get === 'function'){
        return { source: 'registry.get', value: registry.get(route) };
      }
    }catch(error){
      return { source: 'error', error: error && error.message ? error.message : String(error) };
    }
    return { source: 'none', value: null };
  }

  function validateArea(area){
    var missingGlobals = area.requiredGlobals.filter(function(name){ return !hasGlobal(name); });
    var routeResults = area.routes.map(function(route){
      return { route: route, resolution: resolveRoute(route) };
    });
    var shadowResults = area.requiredGlobals.map(function(name){
      return {
        global: name,
        validate: callSafe(window[name], 'validate'),
        snapshot: callSafe(window[name], 'snapshot')
      };
    });
    return {
      key: area.key,
      label: area.label,
      ok: missingGlobals.length === 0,
      missingGlobals: missingGlobals,
      routes: routeResults,
      shadows: shadowResults
    };
  }

  function validate(){
    var areas = CRITICAL_AREAS.map(validateArea);
    var missing = areas.reduce(function(acc, area){
      return acc.concat(area.missingGlobals.map(function(name){
        return area.key + ':' + name;
      }));
    }, []);

    return {
      ok: missing.length === 0,
      version: VERSION,
      mode: 'SAFE_AUDIT_ONLY',
      ownershipTransfer: false,
      lazyLoading: false,
      missing: missing,
      areas: areas
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      currentRoute: window.PETATOERouter && window.PETATOERouter.current ? window.PETATOERouter.current : null,
      routerAvailable: !!window.PETATOERouter,
      navigationControllerAvailable: !!window.PETATOENavigationController,
      routeRegistryAvailable: !!getRouteRegistry(),
      adapterShadowAvailable: !!window.PETATOERouterAdapterShadowLayer,
      guardedPilotAvailable: !!window.PETATOERouterAdapterGuardedPilot,
      fullShadowAuditAvailable: !!window.PETATOEFullShadowSystemAudit,
      criticalAreas: CRITICAL_AREAS.map(function(area){ return area.key; })
    };
  }

  window.PETATOERouterStabilityValidation = {
    version: VERSION,
    validate: validate,
    snapshot: snapshot,
    areas: function(){ return CRITICAL_AREAS.slice(); }
  };

})(window, document);
