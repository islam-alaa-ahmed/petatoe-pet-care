/* PETATOE v6.4.13 Phase RX6-SAFE - Reports Shadow Ownership Validation
 * Purpose: passively validate Smart Reports route/module ownership after RX5 before any real router ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open, close, activate, or render tabs.
 * - Does NOT lazy-load or defer scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, or report modules.
 * - Reads metadata only and exposes a validation snapshot for QA.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.13-rx6-safe-reports-shadow-ownership-validation';
  var REPORT_ROUTE_IDS = ['smart'];
  var REPORT_MODULE_ID = 'smart-reports';
  var REPORT_PANEL_IDS = ['smart'];
  var REPORT_DOM_IDS = ['smart', 'smartReportsScreen', 'smartReportsArea'];
  var REQUIRED_HINTS = [
    'smart/smart-reports-core.js',
    'inline-extracted/smart-reports-inline.js',
    'smart/smart-tabs.js'
  ];

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

  function boolCheck(name, passed, details){
    return { name: name, passed: !!passed, details: details || null };
  }

  function validate(){
    var route = getRoute('smart');
    var ownership = getOwnershipByRoute('smart');
    var readiness = getReadiness('smart');
    var dom = REPORT_DOM_IDS.map(elementState);
    var scripts = REQUIRED_HINTS.map(scriptState);
    var checks = [];

    checks.push(boolCheck('route-registry-has-smart', !!route, route));
    checks.push(boolCheck('route-module-is-smart-reports', !!route && route.moduleId === REPORT_MODULE_ID, route && route.moduleId));
    checks.push(boolCheck('route-is-still-eager', !!route && route.eager === true, route && route.eager));
    checks.push(boolCheck('route-is-lazy-candidate-only', !!route && route.lazyCandidate === true, route && route.lazyCandidate));
    checks.push(boolCheck('ownership-shadow-has-smart-route', !!ownership && ownership.moduleId === REPORT_MODULE_ID, ownership));
    checks.push(boolCheck('ownership-real-transfer-blocked', !!ownership && ownership.blockedForRealOwnership === true, ownership && ownership.blockedForRealOwnership));
    checks.push(boolCheck('smart-panel-exists', dom.some(function(item){ return item.id === 'smart' && item.exists; }), dom));
    checks.push(boolCheck('smart-panel-module-marker', dom.some(function(item){ return item.id === 'smart' && item.dataPetModule === REPORT_MODULE_ID; }), dom));
    checks.push(boolCheck('smart-stable-zone-exists', dom.some(function(item){ return item.id === 'smartReportsScreen' && item.stableZone === REPORT_MODULE_ID; }), dom));
    checks.push(boolCheck('required-smart-scripts-still-eager', scripts.every(function(item){ return item.found; }), scripts));
    checks.push(boolCheck('legacy-router-still-present', !!window.PETATOERouter, !!window.PETATOERouter));
    checks.push(boolCheck('navigation-controller-still-present', !!window.PETATOENavigationController, !!window.PETATOENavigationController));
    checks.push(boolCheck('no-real-lazy-loading-from-rx6', true, 'RX6 is validation-only and does not load or defer scripts.'));

    var failed = checks.filter(function(check){ return !check.passed; });
    var status = failed.length ? 'warning' : 'pass';
    activity.lastValidationStatus = status;
    activity.lastValidatedAt = new Date().toISOString();

    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      moduleId: REPORT_MODULE_ID,
      routes: REPORT_ROUTE_IDS.slice(),
      panels: REPORT_PANEL_IDS.slice(),
      status: status,
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      route: route,
      ownership: ownership,
      readiness: readiness,
      dom: dom,
      scripts: scripts,
      reportEntrypoints: {
        hasRenderSmartReports: hasFunction('renderSmartReports'),
        hasInitSmartTabs: hasFunction('initSmartTabs'),
        hasBuildSmartReports: hasFunction('buildSmartReports')
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
      if(REPORT_ROUTE_IDS.indexOf(routeId) === -1) return;
      activity.observedTabChanges += 1;
      activity.lastObservedRoute = routeId;
      validate();
    }catch(err){ warn(err); }
  }

  function warn(err){
    if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
      window.PETATOEUtils.warnSilentCatch('reports-shadow-ownership-validation.js', err);
    }
  }

  if(document && typeof document.addEventListener === 'function'){
    document.addEventListener('petatoe:tabchange', observeTabChange, false);
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){ validate(); }, { once: true });
    }else{
      validate();
    }
  }

  window.PETATOEReportsShadowOwnershipValidation = Object.freeze({
    version: VERSION,
    validate: validate,
    snapshot: snapshot
  });
})();
