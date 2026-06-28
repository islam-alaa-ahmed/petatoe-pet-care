/* PETATOE v6.4.19 Phase R1-SAFE - Router Ownership Audit
 * Purpose: audit current router ownership before any Router Adapter or ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT bind, unbind, open, close, activate, or render tabs.
 * - Does NOT lazy-load, defer, or reorder scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, or business modules.
 * - Reads runtime metadata and inline entrypoints only for QA visibility.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.19-r1-safe-router-ownership-audit';
  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    auditRuns: 0,
    lastAuditStatus: 'not-run',
    lastAuditedAt: ''
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){ return String(value || '').trim(); }

  function warn(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('router-ownership-audit.js', err);
      }
    }catch(_err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/router-ownership-audit.js',_err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/router-ownership-audit.js',_petatoeSilentCatch);}}
  }

  function getMethods(obj){
    if(!obj) return [];
    var methods = [];
    try{
      Object.keys(obj).forEach(function(key){ if(typeof obj[key] === 'function') methods.push(key); });
    }catch(err){ warn(err); }
    return methods.sort();
  }

  function getRoutes(){
    try{
      var registry = window.PETATOERouteRegistry;
      if(registry && typeof registry.list === 'function') return registry.list();
    }catch(err){ warn(err); }
    return [];
  }

  function getOwnership(routeId){
    try{
      var ownership = window.PETATOEModuleOwnershipShadow;
      if(ownership && typeof ownership.findByRoute === 'function') return ownership.findByRoute(routeId);
    }catch(err){ warn(err); }
    return null;
  }

  function getReadiness(routeId){
    try{
      var gate = window.PETATOELazyLoadingReadinessGate;
      if(!gate) return null;
      if(typeof gate.check === 'function') return gate.check(routeId);
      if(typeof gate.get === 'function') return gate.get(routeId);
    }catch(err){ warn(err); }
    return null;
  }

  function collectInlineEntrypoints(){
    var items = [];
    try{
      Array.prototype.slice.call(document.querySelectorAll('[onclick]')).forEach(function(el, index){
        var code = el.getAttribute('onclick') || '';
        var isRouter = /PETATOERouter\.openTab|moduleCall\(['\"]router['\"],['\"]openTab['\"]/.test(code);
        var isModuleCall = /PETATOEInlineHandlers\.moduleCall/.test(code);
        if(!isRouter && !isModuleCall) return;
        items.push({
          index: index,
          tag: normalize(el.tagName).toLowerCase(),
          id: normalize(el.id),
          className: normalize(el.className),
          text: normalize((el.textContent || '').replace(/\s+/g, ' ')).slice(0, 80),
          category: isRouter ? 'router-openTab-entrypoint' : 'module-inline-entrypoint',
          code: normalize(code).slice(0, 220)
        });
      });
    }catch(err){ warn(err); }
    return items;
  }

  function boolCheck(name, passed, details){
    return { name: name, passed: !!passed, details: details || null };
  }

  function summarizeRoutes(routes){
    var byModule = {};
    routes.forEach(function(route){
      var moduleId = normalize(route.moduleId || 'unknown');
      if(!byModule[moduleId]) byModule[moduleId] = [];
      byModule[moduleId].push(route.routeId);
    });
    Object.keys(byModule).forEach(function(k){ byModule[k].sort(); });
    return byModule;
  }

  function auditRoute(route){
    var ownership = getOwnership(route.routeId);
    var readiness = getReadiness(route.routeId);
    return {
      routeId: route.routeId,
      moduleId: route.moduleId,
      owner: route.owner,
      panelId: route.panelId,
      eager: route.eager === true,
      lazyCandidate: route.lazyCandidate === true,
      ownershipShadowFound: !!ownership,
      ownershipModuleId: ownership ? ownership.moduleId : '',
      blockedForRealOwnership: ownership ? ownership.blockedForRealOwnership === true : false,
      readiness: readiness || null,
      currentRuntimeOwner: 'legacy-router/application-shell',
      targetStatus: 'audit-only-no-transfer'
    };
  }

  function audit(){
    var routes = getRoutes();
    var routeAudits = routes.map(auditRoute);
    var inlineEntrypoints = collectInlineEntrypoints();
    var directRouterEntrypoints = inlineEntrypoints.filter(function(item){ return item.category === 'router-openTab-entrypoint'; });

    var checks = [];
    checks.push(boolCheck('legacy-router-present', !!window.PETATOERouter, getMethods(window.PETATOERouter)));
    checks.push(boolCheck('legacy-router-openTab-present', !!(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function'), null));
    checks.push(boolCheck('navigation-controller-present', !!window.PETATOENavigationController, getMethods(window.PETATOENavigationController)));
    checks.push(boolCheck('route-registry-present', !!window.PETATOERouteRegistry, { routeCount: routes.length }));
    checks.push(boolCheck('module-ownership-shadow-present', !!window.PETATOEModuleOwnershipShadow, null));
    checks.push(boolCheck('readiness-gate-present', !!window.PETATOELazyLoadingReadinessGate, null));
    checks.push(boolCheck('full-shadow-system-audit-present', !!window.PETATOEFullShadowSystemAudit, null));
    checks.push(boolCheck('routes-registered', routes.length > 0, { routeCount: routes.length }));
    checks.push(boolCheck('real-ownership-transfer-disabled', true, 'R1 is audit-only and keeps legacy runtime ownership.'));
    checks.push(boolCheck('real-lazy-loading-disabled', true, 'R1 does not lazy-load or defer scripts.'));

    var routeWarnings = routeAudits.filter(function(item){
      return item.lazyCandidate && (!item.ownershipShadowFound || !item.blockedForRealOwnership);
    });
    checks.push(boolCheck('lazy-candidates-still-blocked-for-real-ownership', routeWarnings.length === 0, routeWarnings));

    var failed = checks.filter(function(check){ return !check.passed; });
    var status = failed.length ? 'warning' : 'pass';

    activity.auditRuns += 1;
    activity.lastAuditStatus = status;
    activity.lastAuditedAt = new Date().toISOString();

    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      status: status,
      failedChecks: failed.map(function(check){ return check.name; }),
      conclusion: {
        currentOwner: 'PETATOERouter + legacy application shell remain runtime owners',
        nextSafeStep: 'R2 Router Adapter Shadow Layer only after manual QA passes',
        realOwnershipAllowedNow: false,
        lazyLoadingAllowedNow: false
      },
      checks: checks,
      routeCoverage: {
        count: routes.length,
        byModule: summarizeRoutes(routes),
        routes: routeAudits
      },
      entrypoints: {
        inlineModuleEntrypointCount: inlineEntrypoints.length,
        directRouterEntrypointCount: directRouterEntrypoints.length,
        items: inlineEntrypoints
      },
      recommendations: [
        'Keep PETATOERouter as the only runtime opener until R2 shadow adapter passes.',
        'Do not remove inline dashboard/home entrypoints yet; map them first in R2 shadow adapter.',
        'Use RX11 + R1 console snapshots together before approving any ownership transfer.',
        'Pilot any future adapter with reports/payroll smoke tests first because both broke previously.'
      ]
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      activity: clone(activity),
      routerMethods: getMethods(window.PETATOERouter),
      navigationControllerMethods: getMethods(window.PETATOENavigationController),
      routeCount: getRoutes().length,
      inlineEntrypointCount: collectInlineEntrypoints().length,
      realOwnershipEnabled: false,
      lazyLoadingEnabled: false,
      safeOnly: true
    };
  }

  window.PETATOERouterOwnershipAudit = Object.freeze({
    version: VERSION,
    audit: audit,
    validate: audit,
    snapshot: snapshot
  });
})();
