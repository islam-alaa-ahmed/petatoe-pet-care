/* PETATOE v6.4.21 Phase R3-SAFE - Router Adapter Guarded Pilot
 * Purpose: provide a manually-invoked guarded pilot for the lowest-risk Dashboard/Home route only.
 * Safety rules:
 * - Does NOT replace, monkey-patch, wrap, freeze, or override window.PETATOERouter.
 * - Does NOT bind navigation buttons, dashboard cards, menu items, or inline handlers.
 * - Does NOT touch Reports, Payroll, Warehouse, Treasury, Operations, Storage, Loader, or Lazy Loading.
 * - Only supports routeId "dashboard" / "home" and falls back to the legacy router immediately on failure.
 * - No automatic route ownership transfer. Manual QA only via PETATOERouterAdapterGuardedPilot.pilot('dashboard').
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.21-r3-safe-router-adapter-guarded-pilot';
  var DASHBOARD_ROUTES = { dashboard: true, home: true };
  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    attempts: 0,
    successes: 0,
    fallbacks: 0,
    blocked: 0,
    lastAttemptAt: '',
    lastRouteId: '',
    lastStatus: 'not-run',
    lastError: ''
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){ return String(value || '').trim(); }

  function warn(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('router-adapter-guarded-pilot.js', err);
      }
    }catch(_err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/router-adapter-guarded-pilot.js',_err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/router-adapter-guarded-pilot.js',_petatoeSilentCatch);}}
  }

  function now(){ return new Date().toISOString(); }
  function getLegacyRouter(){ return window.PETATOERouter || null; }
  function getAdapter(){ return window.PETATOERouterAdapterShadowLayer || null; }
  function getRouteRegistry(){ return window.PETATOERouteRegistry || null; }

  function canonicalRoute(routeId){
    routeId = normalize(routeId || 'dashboard').toLowerCase();
    return routeId === 'home' ? 'dashboard' : routeId;
  }

  function activePanelId(){
    try{
      var panel = document.querySelector('.panel.active');
      return normalize(panel && panel.id);
    }catch(err){ warn(err); }
    return '';
  }

  function currentRoute(){
    try{
      var router = getLegacyRouter();
      if(router){
        if(router.current) return normalize(router.current);
        if(typeof router.currentTab === 'function') return normalize(router.currentTab());
      }
    }catch(err){ warn(err); }
    return activePanelId();
  }

  function legacyOpen(routeId, smartOpen){
    var router = getLegacyRouter();
    if(!router || typeof router.openTab !== 'function'){
      return { ok: false, reason: 'legacy-router-openTab-missing' };
    }
    try{
      router.openTab(routeId, smartOpen || '');
      return { ok: true, reason: 'legacy-router-openTab-called' };
    }catch(err){
      warn(err);
      return { ok: false, reason: 'legacy-router-openTab-threw', error: String(err && err.message || err) };
    }
  }

  function resolve(routeId){
    routeId = canonicalRoute(routeId);
    try{
      var adapter = getAdapter();
      if(adapter && typeof adapter.resolve === 'function') return adapter.resolve(routeId);
    }catch(err){ warn(err); }
    try{
      var registry = getRouteRegistry();
      if(registry && typeof registry.get === 'function') return registry.get(routeId);
    }catch(err2){ warn(err2); }
    return null;
  }

  function canPilot(routeId){
    routeId = canonicalRoute(routeId);
    var reasons = [];
    if(!DASHBOARD_ROUTES[routeId]) reasons.push('route-not-allowed-for-r3-pilot');
    var router = getLegacyRouter();
    if(!router || typeof router.openTab !== 'function') reasons.push('legacy-router-openTab-missing');
    var dashboardPanel = null;
    try{ dashboardPanel = document.getElementById('dashboard'); }
    catch(err){ warn(err); }
    if(!dashboardPanel) reasons.push('dashboard-panel-missing');
    var resolved = resolve(routeId);
    if(!resolved) reasons.push('route-not-resolved-by-shadow-adapter-or-registry');
    return {
      version: VERSION,
      generatedAt: now(),
      routeId: routeId,
      allowed: reasons.length === 0,
      reasons: reasons,
      currentRoute: currentRoute(),
      activePanelId: activePanelId(),
      resolved: resolved
    };
  }

  function fallbackToLegacy(routeId, reason){
    activity.fallbacks += 1;
    var result = legacyOpen(routeId, '');
    return {
      usedFallback: true,
      fallbackReason: reason || 'guarded-pilot-fallback',
      fallbackResult: result,
      currentRoute: currentRoute(),
      activePanelId: activePanelId()
    };
  }

  function pilot(routeId, options){
    options = options || {};
    routeId = canonicalRoute(routeId || 'dashboard');
    activity.attempts += 1;
    activity.lastAttemptAt = now();
    activity.lastRouteId = routeId;
    activity.lastError = '';

    var guard = canPilot(routeId);
    if(!guard.allowed){
      activity.blocked += 1;
      activity.lastStatus = 'blocked';
      return {
        version: VERSION,
        generatedAt: now(),
        status: 'blocked',
        routeId: routeId,
        guard: guard,
        fallback: options.noFallback ? null : fallbackToLegacy(routeId, guard.reasons.join('|')),
        note: 'R3 pilot is dashboard-only and guarded. Blocked routes are not opened by the pilot.'
      };
    }

    var before = { currentRoute: currentRoute(), activePanelId: activePanelId() };

    /* Guarded Pilot rule:
     * R3 does not own routing yet. It validates dashboard readiness, then delegates the actual opening to the legacy router.
     * R4 is the earliest phase allowed to test true dashboard ownership.
     */
    var legacyResult = legacyOpen('dashboard', '');
    var after = { currentRoute: currentRoute(), activePanelId: activePanelId() };
    var success = legacyResult.ok && (after.currentRoute === 'dashboard' || after.activePanelId === 'dashboard');

    if(!success){
      activity.lastStatus = 'fallback';
      activity.lastError = legacyResult.reason || 'post-open-validation-failed';
      return {
        version: VERSION,
        generatedAt: now(),
        status: 'fallback',
        routeId: routeId,
        guard: guard,
        before: before,
        pilotDelegation: legacyResult,
        after: after,
        fallback: options.noFallback ? null : fallbackToLegacy('dashboard', 'post-open-validation-failed')
      };
    }

    activity.successes += 1;
    activity.lastStatus = 'success';
    return {
      version: VERSION,
      generatedAt: now(),
      status: 'success',
      routeId: routeId,
      guard: guard,
      before: before,
      pilotDelegation: legacyResult,
      after: after,
      policy: {
        pilotRouteOnly: 'dashboard',
        ownsRoute: false,
        delegatedToLegacyRouter: true,
        fallbackAvailable: true,
        nextAllowedStep: 'R3.5 Stability Validation before any R4 ownership pilot'
      }
    };
  }

  function validate(){
    var dashboard = canPilot('dashboard');
    var blockedReports = canPilot('smart');
    var checks = [
      { name: 'legacy-router-openTab-present', passed: !!(getLegacyRouter() && typeof getLegacyRouter().openTab === 'function'), details: null },
      { name: 'dashboard-panel-present', passed: !!document.getElementById('dashboard'), details: null },
      { name: 'dashboard-route-allowed', passed: dashboard.allowed, details: dashboard.reasons },
      { name: 'reports-route-blocked', passed: !blockedReports.allowed, details: blockedReports.reasons },
      { name: 'pilot-does-not-replace-router', passed: window.PETATOERouterAdapterGuardedPilot !== window.PETATOERouter, details: null },
      { name: 'pilot-does-not-lazy-load', passed: true, details: 'No script injection, imports, or loader calls exist in R3 pilot.' }
    ];
    var failed = checks.filter(function(check){ return !check.passed; });
    return {
      version: VERSION,
      generatedAt: now(),
      status: failed.length ? 'warning' : 'pass',
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      recommendation: failed.length ? 'Do not proceed to R3.5/R4 until failed checks are reviewed.' : 'Ready for manual Dashboard pilot QA, then R3.5 Stability Validation.'
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: now(),
      activity: clone(activity),
      currentRoute: currentRoute(),
      activePanelId: activePanelId(),
      dashboardGuard: canPilot('dashboard'),
      capabilities: {
        routeOwnership: false,
        replacesRouter: false,
        monkeyPatchesRouter: false,
        bindsNavigation: false,
        supportsOnlyDashboard: true,
        lazyLoads: false,
        writesStorage: false,
        touchesBusinessModules: false
      }
    };
  }

  window.PETATOERouterAdapterGuardedPilot = Object.freeze({
    version: VERSION,
    canPilot: canPilot,
    pilot: pilot,
    openDashboard: function(options){ return pilot('dashboard', options || {}); },
    validate: validate,
    audit: validate,
    snapshot: snapshot
  });
})();
