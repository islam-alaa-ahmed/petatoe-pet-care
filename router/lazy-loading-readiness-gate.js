/* PETATOE v6.4.11 Phase RX4-SAFE - Lazy Loading Readiness Gate
 * Purpose: expose a passive readiness checker before any real lazy-loading takeover.
 * Safety rules:
 * - Does NOT defer or remove eager scripts.
 * - Does NOT lazy-load business modules.
 * - Does NOT replace router, navigation, loader, storage, or permissions.
 * - Does NOT write DOM or storage.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.11-rx4-safe-lazy-loading-readiness-gate';

  function safeArray(list){
    try { return Array.prototype.slice.call(list || []); }
    catch(_err){ return []; }
  }

  function getScriptSrcs(){
    return safeArray(document.querySelectorAll('script[src]')).map(function(script){
      return script.getAttribute('src') || '';
    }).filter(Boolean);
  }

  function hasGlobal(name){
    try { return !!window[name]; }
    catch(_err){ return false; }
  }

  function inspect(){
    var scripts = getScriptSrcs();
    var routerScripts = scripts.filter(function(src){ return /(^|\/)router(\/|\.js)/.test(src); });
    var readiness = {
      version: VERSION,
      checkedAt: new Date().toISOString(),
      scriptCount: scripts.length,
      routerScriptCount: routerScripts.length,
      routerScripts: routerScripts,
      hasPETATOERouter: hasGlobal('PETATOERouter'),
      hasPETATOENavigationController: hasGlobal('PETATOENavigationController'),
      hasPETATOERouterController: hasGlobal('PETATOERouterController'),
      hasRouteRegistry: hasGlobal('PETATOERouteRegistry'),
      hasModuleRegistry: hasGlobal('PETATOEModuleRegistry'),
      hasLazyPilot: hasGlobal('PETATOELazyLoadingPilotSafe'),
      safeForRealLazyPilot: false,
      blockers: []
    };

    if(!readiness.hasPETATOERouter){ readiness.blockers.push('PETATOERouter contract missing'); }
    if(!readiness.hasPETATOENavigationController){ readiness.blockers.push('PETATOENavigationController contract missing'); }
    if(!readiness.hasRouteRegistry){ readiness.blockers.push('PETATOERouteRegistry contract missing'); }
    if(!readiness.hasModuleRegistry){ readiness.blockers.push('PETATOEModuleRegistry contract missing'); }

    readiness.safeForRealLazyPilot = readiness.blockers.length === 0;
    return readiness;
  }

  function snapshot(){
    try { return JSON.parse(JSON.stringify(inspect())); }
    catch(_err){ return inspect(); }
  }

  window.PETATOELazyLoadingReadinessGate = Object.freeze({
    version: VERSION,
    inspect: inspect,
    snapshot: snapshot
  });
})();
