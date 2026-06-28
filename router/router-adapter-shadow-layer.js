/* PETATOE v6.4.20 Phase R2-SAFE - Router Adapter Shadow Layer
 * Purpose: create a passive adapter layer that reads and maps the current legacy router state.
 * Safety rules:
 * - Does NOT replace, monkey-patch, wrap, or call window.PETATOERouter.openTab.
 * - Does NOT open/close tabs, render panels, bind navigation, or change active classes.
 * - Does NOT lazy-load, defer, reorder, or inject scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, or business modules.
 * - Only reads runtime state and listens passively to existing tab-change events for QA snapshots.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.20-r2-safe-router-adapter-shadow-layer';
  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    observedEvents: 0,
    lastObservedAt: '',
    lastObservedRouteId: '',
    lastResolveStatus: 'not-run'
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){ return String(value || '').trim(); }

  function warn(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('router-adapter-shadow-layer.js', err);
      }
    }catch(_err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/router-adapter-shadow-layer.js',_err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/router-adapter-shadow-layer.js',_petatoeSilentCatch);}}
  }

  function getLegacyRouter(){ return window.PETATOERouter || null; }
  function getNavigationController(){ return window.PETATOENavigationController || null; }
  function getRouteRegistry(){ return window.PETATOERouteRegistry || null; }
  function getOwnershipShadow(){ return window.PETATOEModuleOwnershipShadow || null; }
  function getReadinessGate(){ return window.PETATOELazyLoadingReadinessGate || null; }
  function getOwnershipAudit(){ return window.PETATOERouterOwnershipAudit || null; }

  function getRouterCurrent(){
    try{
      var router = getLegacyRouter();
      if(router){
        if(router.current) return normalize(router.current);
        if(typeof router.currentTab === 'function') return normalize(router.currentTab());
      }
    }catch(err){ warn(err); }
    try{
      var panel = document.querySelector('.panel.active');
      if(panel && panel.id) return normalize(panel.id);
    }catch(err2){ warn(err2); }
    return '';
  }

  function getRoute(routeId){
    routeId = normalize(routeId);
    try{
      var registry = getRouteRegistry();
      if(registry && typeof registry.get === 'function') return registry.get(routeId);
      if(registry && typeof registry.find === 'function') return registry.find(routeId);
      if(registry && typeof registry.list === 'function'){
        var routes = registry.list() || [];
        for(var i=0;i<routes.length;i++){
          if(normalize(routes[i].routeId) === routeId) return routes[i];
        }
      }
    }catch(err){ warn(err); }
    return null;
  }

  function getOwnership(routeId){
    try{
      var ownership = getOwnershipShadow();
      if(ownership && typeof ownership.findByRoute === 'function') return ownership.findByRoute(routeId);
    }catch(err){ warn(err); }
    return null;
  }

  function getReadiness(routeId){
    try{
      var gate = getReadinessGate();
      if(!gate) return null;
      if(typeof gate.check === 'function') return gate.check(routeId);
      if(typeof gate.get === 'function') return gate.get(routeId);
    }catch(err){ warn(err); }
    return null;
  }

  function getMethods(obj){
    if(!obj) return [];
    var methods = [];
    try{
      Object.keys(obj).forEach(function(key){ if(typeof obj[key] === 'function') methods.push(key); });
    }catch(err){ warn(err); }
    return methods.sort();
  }

  function resolve(routeId){
    routeId = normalize(routeId || getRouterCurrent());
    var route = routeId ? getRoute(routeId) : null;
    var ownership = routeId ? getOwnership(routeId) : null;
    var readiness = routeId ? getReadiness(routeId) : null;

    var result = {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      routeId: routeId,
      resolved: !!(route || ownership),
      routeRegistry: route ? {
        routeId: normalize(route.routeId),
        moduleId: normalize(route.moduleId),
        owner: normalize(route.owner),
        panelId: normalize(route.panelId),
        lazyCandidate: route.lazyCandidate === true,
        eager: route.eager === true
      } : null,
      ownershipShadow: ownership ? {
        routeId: normalize(ownership.routeId),
        moduleId: normalize(ownership.moduleId),
        moduleName: normalize(ownership.moduleName || ownership.title),
        panelId: normalize(ownership.panelId),
        blockedForRealOwnership: ownership.blockedForRealOwnership === true,
        safeOnly: ownership.safeOnly !== false
      } : null,
      readiness: readiness || null,
      runtime: {
        currentLegacyRoute: getRouterCurrent(),
        currentSmartRoute: normalize((getLegacyRouter() || {}).currentSmart),
        activePanelId: normalize(((document.querySelector && document.querySelector('.panel.active')) || {}).id)
      },
      adapterPolicy: {
        mode: 'shadow-only',
        canOpenRoute: false,
        canTransferOwnership: false,
        canLazyLoad: false,
        fallbackOwner: 'PETATOERouter legacy application shell'
      }
    };
    activity.lastResolveStatus = result.resolved ? 'resolved' : 'unresolved';
    return result;
  }

  function mapAllRoutes(){
    var routes = [];
    try{
      var registry = getRouteRegistry();
      if(registry && typeof registry.list === 'function') routes = registry.list() || [];
    }catch(err){ warn(err); }
    return routes.map(function(route){ return resolve(route.routeId); });
  }

  function validate(){
    var router = getLegacyRouter();
    var navigation = getNavigationController();
    var registry = getRouteRegistry();
    var ownership = getOwnershipShadow();
    var audit = getOwnershipAudit();
    var all = mapAllRoutes();
    var unresolved = all.filter(function(item){ return !item.resolved; });
    var unsafe = all.filter(function(item){
      return item.adapterPolicy.canOpenRoute || item.adapterPolicy.canTransferOwnership || item.adapterPolicy.canLazyLoad;
    });
    var checks = [
      { name: 'legacy-router-present', passed: !!router, details: getMethods(router) },
      { name: 'legacy-router-openTab-still-present', passed: !!(router && typeof router.openTab === 'function'), details: null },
      { name: 'navigation-controller-present', passed: !!navigation, details: getMethods(navigation) },
      { name: 'route-registry-present', passed: !!(registry && typeof registry.list === 'function'), details: null },
      { name: 'module-ownership-shadow-present', passed: !!(ownership && typeof ownership.findByRoute === 'function'), details: null },
      { name: 'r1-router-ownership-audit-present', passed: !!(audit && typeof audit.audit === 'function'), details: null },
      { name: 'adapter-is-shadow-only', passed: unsafe.length === 0, details: unsafe },
      { name: 'adapter-does-not-own-routes', passed: true, details: 'R2 only resolves and snapshots; it never calls openTab.' },
      { name: 'routes-resolve-through-shadow', passed: unresolved.length === 0, details: unresolved.map(function(item){ return item.routeId; }) }
    ];
    var failed = checks.filter(function(check){ return !check.passed; });
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      status: failed.length ? 'warning' : 'pass',
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      current: resolve(getRouterCurrent()),
      routeMapCount: all.length,
      unresolvedRoutes: unresolved.map(function(item){ return item.routeId; }),
      recommendation: failed.length ? 'Keep R2 in shadow-only mode and review unresolved routes before any guarded pilot.' : 'R2 shadow adapter is ready for manual QA; next step can be a guarded pilot on one low-risk route only.'
    };
  }

  function observeTabChange(evt){
    try{
      var detail = evt && evt.detail || {};
      var routeId = normalize(detail.tabId || detail.routeId || detail.target || getRouterCurrent());
      activity.observedEvents += 1;
      activity.lastObservedAt = new Date().toISOString();
      activity.lastObservedRouteId = routeId;
      if(routeId) resolve(routeId);
    }catch(err){ warn(err); }
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      activity: clone(activity),
      current: resolve(getRouterCurrent()),
      capabilities: {
        shadowOnly: true,
        opensRoutes: false,
        replacesRouter: false,
        monkeyPatchesRouter: false,
        lazyLoads: false,
        writesStorage: false,
        writesDom: false
      },
      routeMap: mapAllRoutes()
    };
  }

  if(document && typeof document.addEventListener === 'function'){
    document.addEventListener('petatoe:tabchange', observeTabChange, false);
  }

  window.PETATOERouterAdapterShadowLayer = Object.freeze({
    version: VERSION,
    resolve: resolve,
    mapAllRoutes: mapAllRoutes,
    validate: validate,
    audit: validate,
    snapshot: snapshot
  });
})();
