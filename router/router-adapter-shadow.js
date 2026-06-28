/* PETATOE v6.4.2 Phase R3 - Router Adapter Shadow Layer
 * Purpose: build a passive adapter contract between the legacy in-page router and the module registry.
 * Safety rules:
 * - Does NOT replace or monkey-patch window.PETATOERouter.
 * - Does NOT open/close tabs.
 * - Does NOT lazy-load scripts.
 * - Does NOT write to DOM or storage.
 * - Does NOT change permissions, guards, loader, or navigation.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.2-r3-router-adapter-shadow';
  var state = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    routerDetected: false,
    registryDetected: false,
    lastRouteId: '',
    lastModuleId: '',
    observedTabChanges: 0,
    unresolvedRoutes: []
  };

  function warnSilent(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('router-adapter-shadow.js', err);
      }
    }catch(_ignore){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/router-adapter-shadow.js',_ignore,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/router-adapter-shadow.js',_petatoeSilentCatch);}}
  }

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalizeRouteId(routeId){
    return String(routeId || '').trim();
  }

  function getRegistry(){
    return window.PETATOEModuleRegistryShadow || window.PETATOEModuleRegistry || null;
  }

  function detect(){
    state.routerDetected = !!(window.PETATOERouter && typeof window.PETATOERouter === 'object');
    var registry = getRegistry();
    state.registryDetected = !!(registry && typeof registry.findByRoute === 'function');
    return clone({ routerDetected: state.routerDetected, registryDetected: state.registryDetected });
  }

  function resolveRoute(routeId){
    routeId = normalizeRouteId(routeId);
    detect();
    if(!routeId) return null;

    var registry = getRegistry();
    var moduleInfo = null;
    try{
      if(registry && typeof registry.findByRoute === 'function'){
        moduleInfo = registry.findByRoute(routeId);
      }
    }catch(err){ warnSilent(err); }

    var result = {
      routeId: routeId,
      moduleId: moduleInfo && moduleInfo.id || '',
      moduleTitle: moduleInfo && moduleInfo.title || '',
      lazyCandidate: !!(moduleInfo && moduleInfo.lazyCandidate),
      eager: !!(moduleInfo && moduleInfo.eager),
      resolved: !!moduleInfo
    };

    state.lastRouteId = result.routeId;
    state.lastModuleId = result.moduleId;
    if(!result.resolved && state.unresolvedRoutes.indexOf(routeId) === -1){
      state.unresolvedRoutes.push(routeId);
    }
    return clone(result);
  }

  function observeTabChange(evt){
    try{
      var detail = evt && evt.detail || {};
      var routeId = normalizeRouteId(detail.tabId || detail.routeId || detail.target || '');
      state.observedTabChanges += 1;
      if(routeId) resolveRoute(routeId);
    }catch(err){ warnSilent(err); }
  }

  function snapshot(){
    detect();
    return clone(state);
  }

  if(document && typeof document.addEventListener === 'function'){
    document.addEventListener('petatoe:tabchange', observeTabChange, false);
  }

  var api = Object.freeze({
    version: VERSION,
    detect: detect,
    resolveRoute: resolveRoute,
    snapshot: snapshot
  });

  if(!window.PETATOERouterAdapterShadow){ window.PETATOERouterAdapterShadow = api; }
})();
