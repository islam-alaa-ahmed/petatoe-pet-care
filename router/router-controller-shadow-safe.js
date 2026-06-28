/* PETATOE v6.4.9: Router Controller Shadow Safe Hotfix
 * Purpose: expose a RouterController facade without taking ownership from PETATOERouter.
 * Regression fixed: v6.4.7 replaced window.PETATOERouter with a frozen object.
 * navigation-controller.js mutates PETATOERouter.current/currentSmart during navigation;
 * freezing/replacing that legacy contract breaks tab navigation and module render subscribers.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT replace window.tab.
 * - Does NOT freeze/mutate the legacy router contract.
 * - Does NOT lazy-load scripts.
 * - Delegates only to the current working router/navigation controller.
 */
(function(){
  'use strict';
  if(window.__PETATOE_ROUTER_CONTROLLER_SHADOW_SAFE_READY__) return;
  window.__PETATOE_ROUTER_CONTROLLER_SHADOW_SAFE_READY__ = true;

  var VERSION = 'v6.4.9-router-controller-shadow-safe-hotfix';
  var state = { history: [] };

  function warn(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('router/router-controller-shadow-safe.js', err);
      }
    }catch(_ignore){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/router-controller-shadow-safe.js',_ignore,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/router-controller-shadow-safe.js',_petatoeSilentCatch);}}
  }

  function legacyRouter(){ return window.PETATOERouter || null; }
  function nav(){ return window.PETATOENavigationController || null; }
  function registry(){ return window.PETATOERouteRegistry || null; }

  function normalizeRouteId(routeId){
    routeId = String(routeId || '').trim();
    if(!routeId) return '';
    var reg = registry();
    if(reg && typeof reg.get === 'function'){
      try{
        var meta = reg.get(routeId);
        if(meta && meta.panelId) return String(meta.panelId || routeId).trim() || routeId;
      }catch(err){ warn(err); }
    }
    return routeId;
  }

  function getRouteMeta(routeId){
    var reg = registry();
    if(!reg || typeof reg.get !== 'function') return null;
    try{ return reg.get(routeId) || reg.get(normalizeRouteId(routeId)) || null; }
    catch(err){ warn(err); return null; }
  }

  function currentTab(){
    var router = legacyRouter();
    if(router && typeof router.currentTab === 'function'){
      try{ return router.currentTab(); }catch(err){ warn(err); }
    }
    var controller = nav();
    if(controller && typeof controller.currentTab === 'function'){
      try{ return controller.currentTab(); }catch(err){ warn(err); }
    }
    var active = document.querySelector('.panel.active');
    return active ? active.id : 'dashboard';
  }

  function openTab(routeId, smartOpen){
    smartOpen = smartOpen || '';
    var normalized = normalizeRouteId(routeId);
    if(!normalized) return false;
    var router = legacyRouter();
    var ok = false;
    try{
      if(router && typeof router.openTab === 'function'){
        ok = router.openTab(normalized, smartOpen);
      }else{
        var controller = nav();
        ok = controller && typeof controller.openTab === 'function' ? controller.openTab(normalized, smartOpen) : false;
      }
      state.history.push({ routeId: normalized, smartOpen: smartOpen, ts: Date.now(), ok: !!ok });
      if(state.history.length > 50) state.history.shift();
      return ok;
    }catch(err){ warn(err); return false; }
  }

  function snapshot(){
    var router = legacyRouter();
    return {
      version: VERSION,
      current: currentTab(),
      legacyRouterCurrent: router && router.current || '',
      legacyRouterCurrentSmart: router && router.currentSmart || '',
      hasLegacyRouter: !!router,
      hasNavigationController: !!nav(),
      hasRouteRegistry: !!registry(),
      history: state.history.slice()
    };
  }

  window.PETATOERouterController = {
    version: VERSION,
    openTab: openTab,
    currentTab: currentTab,
    snapshot: snapshot,
    getRouteMeta: getRouteMeta,
    normalizeRouteId: normalizeRouteId
  };
})();
