/* PETATOE v6.4.23 Phase R4 - Dashboard Route Ownership Pilot
 * Purpose: test true route ownership for Dashboard/Home only, behind an explicit guarded API.
 * Safety rules:
 * - Does NOT replace, monkey-patch, wrap, or override window.PETATOERouter.
 * - Does NOT bind menu buttons, dashboard cards, or inline handlers.
 * - Does NOT touch Reports, Payroll, Warehouse, Treasury, Operations, Storage, Loader, or Lazy Loading.
 * - Supports Dashboard/Home only. All other routes are blocked by guard.
 * - Uses legacy PETATOERouter.openTab only as fallback, never as the primary owned path.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.23-r4-dashboard-route-ownership-pilot';
  var DASHBOARD_ROUTES = { dashboard: true, home: true };
  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    attempts: 0,
    ownedSuccesses: 0,
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
  function now(){ return new Date().toISOString(); }

  function warn(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('dashboard-route-ownership-pilot.js', err);
      }
    }catch(_err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/dashboard-route-ownership-pilot.js',_err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/dashboard-route-ownership-pilot.js',_petatoeSilentCatch);}}
  }

  function canonicalRoute(routeId){
    routeId = normalize(routeId || 'dashboard').toLowerCase();
    return routeId === 'home' ? 'dashboard' : routeId;
  }

  function getLegacyRouter(){ return window.PETATOERouter || null; }
  function getAdapter(){ return window.PETATOERouterAdapterShadowLayer || null; }
  function getStability(){ return window.PETATOERouterStabilityValidation || null; }
  function getGuardedPilot(){ return window.PETATOERouterAdapterGuardedPilot || null; }

  function qsa(selector, root){
    try { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
    catch(err){ warn(err); return []; }
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

  function resolve(routeId){
    routeId = canonicalRoute(routeId);
    try{
      var adapter = getAdapter();
      if(adapter && typeof adapter.resolve === 'function') return adapter.resolve(routeId);
    }catch(err){ warn(err); }
    return null;
  }

  function markNav(tabId, smartOpen){
    smartOpen = smartOpen || '';
    try{
      qsa('#nav button[data-tab], #nav .pet-nav-direct[data-tab]').forEach(function(button){
        var isActive = button.getAttribute('data-tab') === tabId && (!smartOpen || button.getAttribute('data-smart-open') === smartOpen);
        button.classList.toggle('active', isActive);
      });
      return true;
    }catch(err){ warn(err); }
    return false;
  }

  function dispatchTabChange(tabId, smartOpen, previousTab){
    try{
      document.dispatchEvent(new CustomEvent('petatoe:tabchange', {
        detail: {
          tabId: tabId,
          smartOpen: smartOpen || '',
          previousTab: previousTab || '',
          source: 'R4DashboardRouteOwnershipPilot',
          ownedBy: 'dashboard-route-ownership-pilot'
        }
      }));
      return true;
    }catch(err){ warn(err); }
    return false;
  }

  function closeSidebarSafe(){
    try{
      if(typeof window.closeSidebar === 'function') window.closeSidebar();
    }catch(err){ warn(err); }
  }

  function legacyFallback(routeId, reason){
    activity.fallbacks += 1;
    var router = getLegacyRouter();
    var result = { ok: false, reason: 'legacy-router-openTab-missing' };
    try{
      if(router && typeof router.openTab === 'function'){
        result = { ok: !!router.openTab(routeId, ''), reason: 'legacy-router-openTab-called' };
      }
    }catch(err){
      warn(err);
      result = { ok: false, reason: 'legacy-router-openTab-threw', error: String(err && err.message || err) };
    }
    return {
      usedFallback: true,
      fallbackReason: reason || 'r4-dashboard-ownership-fallback',
      fallbackResult: result,
      currentRoute: currentRoute(),
      activePanelId: activePanelId()
    };
  }

  function canOwn(routeId){
    routeId = canonicalRoute(routeId);
    var reasons = [];
    if(!DASHBOARD_ROUTES[routeId]) reasons.push('route-not-allowed-for-r4-dashboard-ownership-pilot');

    var dashboardPanel = null;
    try { dashboardPanel = document.getElementById('dashboard'); }
    catch(err){ warn(err); }
    if(!dashboardPanel) reasons.push('dashboard-panel-missing');

    var panels = qsa('.panel');
    if(!panels.length) reasons.push('panels-missing');

    var resolved = resolve(routeId);
    if(!resolved) reasons.push('route-not-resolved-by-shadow-adapter');

    var guarded = getGuardedPilot();
    if(!guarded || typeof guarded.canPilot !== 'function') reasons.push('r3-guarded-pilot-missing');

    var stability = getStability();
    if(!stability || typeof stability.validate !== 'function') reasons.push('r3-5-stability-validation-missing');

    var router = getLegacyRouter();
    if(!router || typeof router.openTab !== 'function') reasons.push('legacy-router-fallback-missing');

    return {
      version: VERSION,
      generatedAt: now(),
      routeId: routeId,
      allowed: reasons.length === 0,
      reasons: reasons,
      currentRoute: currentRoute(),
      activePanelId: activePanelId(),
      resolved: resolved,
      policy: {
        allowedRoute: 'dashboard',
        ownsOnlyWhenManuallyCalled: true,
        fallbackRequired: true,
        bindsNavigation: false,
        replacesRouter: false,
        lazyLoads: false
      }
    };
  }

  function openDashboardOwned(options){
    options = options || {};
    activity.attempts += 1;
    activity.lastAttemptAt = now();
    activity.lastRouteId = 'dashboard';
    activity.lastError = '';

    var guard = canOwn('dashboard');
    if(!guard.allowed){
      activity.blocked += 1;
      activity.lastStatus = 'blocked';
      activity.lastError = guard.reasons.join('|');
      return {
        version: VERSION,
        generatedAt: now(),
        status: 'blocked',
        routeId: 'dashboard',
        guard: guard,
        fallback: options.noFallback ? null : legacyFallback('dashboard', guard.reasons.join('|'))
      };
    }

    var before = { currentRoute: currentRoute(), activePanelId: activePanelId() };
    var previous = before.currentRoute || before.activePanelId || 'dashboard';

    try{
      qsa('.panel').forEach(function(panel){ panel.classList.remove('active'); });
      var dashboard = document.getElementById('dashboard');
      dashboard.classList.add('active');

      var router = getLegacyRouter();
      if(router){
        router.current = 'dashboard';
        router.currentSmart = '';
      }

      markNav('dashboard', '');
      closeSidebarSafe();
      dispatchTabChange('dashboard', '', previous);

      var after = { currentRoute: currentRoute(), activePanelId: activePanelId() };
      var ok = after.activePanelId === 'dashboard' && (after.currentRoute === 'dashboard' || after.currentRoute === '');
      if(!ok){
        activity.lastStatus = 'fallback';
        activity.lastError = 'post-owned-open-validation-failed';
        return {
          version: VERSION,
          generatedAt: now(),
          status: 'fallback',
          routeId: 'dashboard',
          guard: guard,
          before: before,
          after: after,
          fallback: options.noFallback ? null : legacyFallback('dashboard', 'post-owned-open-validation-failed')
        };
      }

      activity.ownedSuccesses += 1;
      activity.lastStatus = 'owned-success';
      return {
        version: VERSION,
        generatedAt: now(),
        status: 'owned-success',
        routeId: 'dashboard',
        guard: guard,
        before: before,
        after: after,
        ownership: {
          ownedBy: 'PETATOEDashboardRouteOwnershipPilot',
          route: 'dashboard',
          delegatedToLegacyRouter: false,
          fallbackAvailable: true,
          automaticBinding: false,
          scope: 'manual-dashboard-only'
        }
      };
    }catch(err){
      warn(err);
      activity.lastStatus = 'fallback';
      activity.lastError = String(err && err.message || err);
      return {
        version: VERSION,
        generatedAt: now(),
        status: 'fallback',
        routeId: 'dashboard',
        guard: guard,
        before: before,
        error: activity.lastError,
        fallback: options.noFallback ? null : legacyFallback('dashboard', 'owned-open-threw')
      };
    }
  }

  function open(routeId, options){
    routeId = canonicalRoute(routeId || 'dashboard');
    if(routeId !== 'dashboard'){
      activity.blocked += 1;
      activity.lastStatus = 'blocked';
      activity.lastRouteId = routeId;
      activity.lastError = 'route-not-allowed-for-r4-dashboard-ownership-pilot';
      return {
        version: VERSION,
        generatedAt: now(),
        status: 'blocked',
        routeId: routeId,
        guard: canOwn(routeId),
        note: 'R4 ownership pilot is Dashboard-only. Sensitive modules remain legacy-owned.'
      };
    }
    return openDashboardOwned(options || {});
  }

  function validate(){
    var dashboard = canOwn('dashboard');
    var reports = canOwn('smart');
    var checks = [
      { name: 'dashboard-ownership-guard-passes', passed: dashboard.allowed, details: dashboard.reasons },
      { name: 'non-dashboard-routes-blocked', passed: !reports.allowed, details: reports.reasons },
      { name: 'legacy-router-fallback-present', passed: !!(getLegacyRouter() && typeof getLegacyRouter().openTab === 'function'), details: null },
      { name: 'r3-guarded-pilot-present', passed: !!(getGuardedPilot() && typeof getGuardedPilot().canPilot === 'function'), details: null },
      { name: 'r3-5-stability-validation-present', passed: !!(getStability() && typeof getStability().validate === 'function'), details: null },
      { name: 'pilot-does-not-replace-router', passed: window.PETATOEDashboardRouteOwnershipPilot !== window.PETATOERouter, details: null },
      { name: 'pilot-does-not-bind-navigation', passed: true, details: 'No click listeners are registered by R4 pilot.' },
      { name: 'pilot-does-not-lazy-load', passed: true, details: 'No script injection, imports, or loader calls exist in R4 pilot.' }
    ];
    var failed = checks.filter(function(check){ return !check.passed; });
    return {
      version: VERSION,
      generatedAt: now(),
      status: failed.length ? 'warning' : 'pass',
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      recommendation: failed.length ? 'Do not expand ownership. Review failed checks first.' : 'Ready for manual Dashboard ownership pilot QA only.'
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: now(),
      activity: clone(activity),
      currentRoute: currentRoute(),
      activePanelId: activePanelId(),
      dashboardGuard: canOwn('dashboard'),
      capabilities: {
        ownsDashboardWhenManuallyCalled: true,
        ownsReports: false,
        ownsPayroll: false,
        ownsWarehouse: false,
        ownsTreasury: false,
        ownsOperations: false,
        replacesRouter: false,
        monkeyPatchesRouter: false,
        bindsNavigation: false,
        lazyLoads: false,
        writesStorage: false,
        touchesBusinessModules: false,
        fallbackToLegacyRouter: true
      }
    };
  }

  window.PETATOEDashboardRouteOwnershipPilot = Object.freeze({
    version: VERSION,
    canOwn: canOwn,
    open: open,
    openDashboard: openDashboardOwned,
    validate: validate,
    audit: validate,
    snapshot: snapshot
  });
})();
