/* PETATOE v6.4.14 Phase RX7-SAFE - Payroll Shadow Ownership Validation
 * Purpose: passively validate Payroll and Salary Slip route/module ownership before any real router ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open, close, activate, or render tabs.
 * - Does NOT lazy-load or defer scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, payroll data, or payroll modules.
 * - Reads metadata only and exposes a validation snapshot for QA.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.14-rx7-safe-payroll-shadow-ownership-validation';
  var PAYROLL_ROUTE_IDS = ['payroll', 'salarySlip'];
  var PAYROLL_MODULE_ID = 'payroll';
  var PAYROLL_PANEL_IDS = ['payroll', 'salarySlip'];
  var PAYROLL_DOM_IDS = ['payroll', 'payrollArea', 'salarySlip', 'salarySlipArea'];
  var REQUIRED_HINTS = [
    'payroll/payroll-core.js',
    'payroll/payroll-read-facade.js',
    'payroll/payroll-computed-facade.js',
    'payroll/payroll-view-model-facade.js',
    'payroll/payroll-render-bridge.js',
    'payroll/payroll-event-bridge.js',
    'payroll/payroll-parallel-validation.js',
    'inline-extracted/payroll-visibility-guard.js'
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

  function hasRouteAlias(route, aliasId){
    return !!route && Array.isArray(route.aliases) && route.aliases.indexOf(aliasId) !== -1;
  }

  function validateRoute(routeId){
    var route = getRoute(routeId);
    var ownership = getOwnershipByRoute(routeId);
    var readiness = getReadiness(routeId);
    return {
      routeId: routeId,
      route: route,
      ownership: ownership,
      readiness: readiness,
      routeExists: !!route,
      moduleMatches: !!route && route.moduleId === PAYROLL_MODULE_ID,
      eager: !!route && route.eager === true,
      lazyCandidate: !!route && route.lazyCandidate === true,
      ownershipMatches: !!ownership && ownership.moduleId === PAYROLL_MODULE_ID,
      realOwnershipBlocked: !!ownership && ownership.blockedForRealOwnership === true
    };
  }

  function validate(){
    var payrollRoute = validateRoute('payroll');
    var salarySlipRoute = validateRoute('salarySlip');
    var dom = PAYROLL_DOM_IDS.map(elementState);
    var scripts = REQUIRED_HINTS.map(scriptState);
    var checks = [];

    checks.push(boolCheck('route-registry-has-payroll', payrollRoute.routeExists, payrollRoute.route));
    checks.push(boolCheck('route-registry-resolves-salarySlip-alias', salarySlipRoute.routeExists, salarySlipRoute.route));
    checks.push(boolCheck('payroll-route-module-is-payroll', payrollRoute.moduleMatches, payrollRoute.route && payrollRoute.route.moduleId));
    checks.push(boolCheck('salarySlip-route-module-is-payroll', salarySlipRoute.moduleMatches, salarySlipRoute.route && salarySlipRoute.route.moduleId));
    checks.push(boolCheck('payroll-route-keeps-salarySlip-alias', hasRouteAlias(payrollRoute.route, 'salarySlip'), payrollRoute.route && payrollRoute.route.aliases));
    checks.push(boolCheck('payroll-route-is-still-eager', payrollRoute.eager, payrollRoute.route && payrollRoute.route.eager));
    checks.push(boolCheck('payroll-route-is-lazy-candidate-only', payrollRoute.lazyCandidate, payrollRoute.route && payrollRoute.route.lazyCandidate));
    checks.push(boolCheck('payroll-ownership-shadow-has-payroll-route', payrollRoute.ownershipMatches, payrollRoute.ownership));
    checks.push(boolCheck('salarySlip-ownership-shadow-has-payroll-route', salarySlipRoute.ownershipMatches, salarySlipRoute.ownership));
    checks.push(boolCheck('payroll-ownership-real-transfer-blocked', payrollRoute.realOwnershipBlocked, payrollRoute.ownership && payrollRoute.ownership.blockedForRealOwnership));
    checks.push(boolCheck('payroll-panel-exists', dom.some(function(item){ return item.id === 'payroll' && item.exists; }), dom));
    checks.push(boolCheck('salarySlip-panel-exists', dom.some(function(item){ return item.id === 'salarySlip' && item.exists; }), dom));
    checks.push(boolCheck('payroll-panel-module-marker', dom.some(function(item){ return item.id === 'payroll' && item.dataPetModule.indexOf(PAYROLL_MODULE_ID) !== -1; }), dom));
    checks.push(boolCheck('salarySlip-panel-module-marker', dom.some(function(item){ return item.id === 'salarySlip' && item.dataPetModule.indexOf(PAYROLL_MODULE_ID) !== -1; }), dom));
    checks.push(boolCheck('payroll-area-exists', dom.some(function(item){ return item.id === 'payrollArea' && item.exists; }), dom));
    checks.push(boolCheck('salarySlip-area-exists', dom.some(function(item){ return item.id === 'salarySlipArea' && item.exists; }), dom));
    checks.push(boolCheck('required-payroll-scripts-still-eager', scripts.every(function(item){ return item.found; }), scripts));
    checks.push(boolCheck('legacy-router-still-present', !!window.PETATOERouter, !!window.PETATOERouter));
    checks.push(boolCheck('navigation-controller-still-present', !!window.PETATOENavigationController, !!window.PETATOENavigationController));
    checks.push(boolCheck('no-real-lazy-loading-from-rx7', true, 'RX7 is validation-only and does not load or defer scripts.'));

    var failed = checks.filter(function(check){ return !check.passed; });
    var status = failed.length ? 'warning' : 'pass';
    activity.lastValidationStatus = status;
    activity.lastValidatedAt = new Date().toISOString();

    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      moduleId: PAYROLL_MODULE_ID,
      routes: PAYROLL_ROUTE_IDS.slice(),
      panels: PAYROLL_PANEL_IDS.slice(),
      status: status,
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      routeValidations: {
        payroll: payrollRoute,
        salarySlip: salarySlipRoute
      },
      dom: dom,
      scripts: scripts,
      payrollEntrypoints: {
        hasRenderPayroll: hasFunction('renderPayroll'),
        hasOpenPayrollTab: hasFunction('openPayrollTab'),
        hasRenderSalarySlip: hasFunction('renderSalarySlip'),
        hasPayrollModuleOpenTab: hasFunction('PETATOEPayroll.openTab'),
        hasPayrollModuleRenderSalarySlip: hasFunction('PETATOEPayroll.renderSalarySlip')
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
      if(PAYROLL_ROUTE_IDS.indexOf(routeId) === -1) return;
      activity.observedTabChanges += 1;
      activity.lastObservedRoute = routeId;
      validate();
    }catch(err){ warn(err); }
  }

  function warn(err){
    if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
      window.PETATOEUtils.warnSilentCatch('payroll-shadow-ownership-validation.js', err);
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

  window.PETATOEPayrollShadowOwnershipValidation = Object.freeze({
    version: VERSION,
    validate: validate,
    snapshot: snapshot
  });
})();
