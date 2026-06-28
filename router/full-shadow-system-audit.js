/* PETATOE v6.4.18 Phase RX11-SAFE - Full Shadow System Audit
 * Purpose: aggregate RX5-RX10 shadow ownership validation results before any real router ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open, close, activate, or render tabs.
 * - Does NOT lazy-load or defer scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, or business modules.
 * - Reads metadata only and exposes an audit snapshot for QA.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.18-rx11-safe-full-shadow-system-audit';
  var REQUIRED_MODULES = [
    { id: 'smart-reports', routeIds: ['smart'], validator: 'PETATOEReportsShadowOwnershipValidation' },
    { id: 'payroll', routeIds: ['payroll', 'salarySlip'], validator: 'PETATOEPayrollShadowOwnershipValidation' },
    { id: 'warehouse', routeIds: ['warehouse', 'warehouses'], validator: 'PETATOEWarehouseShadowOwnershipValidation' },
    { id: 'treasury', routeIds: ['treasury'], validator: 'PETATOETreasuryShadowOwnershipValidation' },
    { id: 'operations', routeIds: ['operations', 'appointments', 'vehicles', 'vehicleOperationsReports'], validator: 'PETATOEOperationsShadowOwnershipValidation' },
    { id: 'children-expenses', routeIds: ['childrenExpenses'], validator: '' }
  ];

  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    lastAuditStatus: 'not-run',
    lastAuditedAt: '',
    auditRuns: 0
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){
    return String(value || '').trim();
  }

  function getGlobal(name){
    try{
      var ctx = window;
      String(name || '').split('.').filter(Boolean).forEach(function(part){
        ctx = ctx ? ctx[part] : undefined;
      });
      return ctx;
    }catch(_err){ return undefined; }
  }

  function warn(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('full-shadow-system-audit.js', err);
      }
    }catch(_err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/full-shadow-system-audit.js',_err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/full-shadow-system-audit.js',_petatoeSilentCatch);}}
  }

  function getRoute(routeId){
    try{
      var registry = window.PETATOERouteRegistry;
      if(!registry || typeof registry.get !== 'function') return null;
      return registry.get(routeId);
    }catch(err){ warn(err); return null; }
  }

  function getOwnership(routeId){
    try{
      var ownership = window.PETATOEModuleOwnershipShadow;
      if(!ownership || typeof ownership.findByRoute !== 'function') return null;
      return ownership.findByRoute(routeId);
    }catch(err){ warn(err); return null; }
  }

  function getReadiness(routeId){
    try{
      var gate = window.PETATOELazyLoadingReadinessGate;
      if(!gate) return null;
      if(typeof gate.check === 'function') return gate.check(routeId);
      if(typeof gate.get === 'function') return gate.get(routeId);
      return null;
    }catch(err){ warn(err); return null; }
  }

  function boolCheck(name, passed, details){
    return { name: name, passed: !!passed, details: details || null };
  }

  function runValidator(globalName){
    try{
      var validator = getGlobal(globalName);
      if(!validator || typeof validator.validate !== 'function'){
        return { available: false, status: 'missing', result: null };
      }
      var result = validator.validate();
      return { available: true, status: normalize(result && result.status) || 'unknown', result: result };
    }catch(err){
      warn(err);
      return { available: true, status: 'error', result: { error: normalize(err && (err.message || err)) } };
    }
  }

  function auditModule(def){
    var routes = def.routeIds.map(function(routeId){
      var route = getRoute(routeId);
      var ownership = getOwnership(routeId);
      var readiness = getReadiness(routeId);
      return {
        routeId: routeId,
        routeFound: !!route,
        routeModuleId: route ? normalize(route.moduleId || route.owner || '') : '',
        eager: route ? route.eager === true : false,
        lazyCandidate: route ? route.lazyCandidate === true : false,
        ownershipFound: !!ownership,
        ownershipModuleId: ownership ? normalize(ownership.moduleId) : '',
        blockedForRealOwnership: ownership ? ownership.blockedForRealOwnership === true : false,
        readiness: readiness || null
      };
    });

    var validatorResult = def.validator ? runValidator(def.validator) : { available: false, status: 'not-required', result: null };
    var checks = [];
    checks.push(boolCheck(def.id + '-routes-exist', routes.every(function(r){ return r.routeFound; }), routes));
    checks.push(boolCheck(def.id + '-ownership-shadow-exists', routes.every(function(r){ return r.ownershipFound; }), routes));
    checks.push(boolCheck(def.id + '-real-ownership-blocked', routes.every(function(r){ return r.blockedForRealOwnership; }), routes));
    checks.push(boolCheck(def.id + '-still-eager-or-not-real-lazy', routes.every(function(r){ return r.eager === true || !r.readiness || r.readiness.readyForLazyLoading !== true; }), routes));
    if(def.validator){
      checks.push(boolCheck(def.id + '-validator-present', validatorResult.available, validatorResult));
      checks.push(boolCheck(def.id + '-validator-not-failing', validatorResult.available && validatorResult.status !== 'error', validatorResult));
    }

    var failed = checks.filter(function(check){ return !check.passed; });
    return {
      moduleId: def.id,
      routeIds: def.routeIds.slice(),
      validator: def.validator,
      status: failed.length ? 'warning' : 'pass',
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      routes: routes,
      validatorResult: validatorResult
    };
  }

  function audit(){
    var modules = REQUIRED_MODULES.map(auditModule);
    var globalChecks = [];
    globalChecks.push(boolCheck('legacy-router-present', !!window.PETATOERouter, !!window.PETATOERouter));
    globalChecks.push(boolCheck('route-registry-present', !!window.PETATOERouteRegistry, !!window.PETATOERouteRegistry));
    globalChecks.push(boolCheck('module-ownership-shadow-present', !!window.PETATOEModuleOwnershipShadow, !!window.PETATOEModuleOwnershipShadow));
    globalChecks.push(boolCheck('lazy-readiness-gate-present', !!window.PETATOELazyLoadingReadinessGate, !!window.PETATOELazyLoadingReadinessGate));
    globalChecks.push(boolCheck('no-real-router-ownership-transfer-from-rx11', true, 'RX11 is audit-only.'));
    globalChecks.push(boolCheck('no-real-lazy-loading-from-rx11', true, 'RX11 does not load or defer scripts.'));

    var failedGlobal = globalChecks.filter(function(check){ return !check.passed; });
    var warningModules = modules.filter(function(mod){ return mod.status !== 'pass'; });
    var status = failedGlobal.length || warningModules.length ? 'warning' : 'pass';

    activity.auditRuns += 1;
    activity.lastAuditStatus = status;
    activity.lastAuditedAt = new Date().toISOString();

    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      status: status,
      failedGlobalChecks: failedGlobal.map(function(check){ return check.name; }),
      warningModules: warningModules.map(function(mod){ return mod.moduleId; }),
      coverage: {
        requiredModules: REQUIRED_MODULES.map(function(item){ return item.id; }),
        validatedModules: modules.map(function(item){ return item.moduleId; }),
        realOwnershipEnabled: false,
        lazyLoadingEnabled: false,
        safeOnly: true
      },
      globalChecks: globalChecks,
      modules: modules
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      activity: clone(activity),
      requiredModules: clone(REQUIRED_MODULES),
      availableValidators: REQUIRED_MODULES.filter(function(item){ return !!item.validator; }).map(function(item){
        return { moduleId: item.id, validator: item.validator, available: !!getGlobal(item.validator) };
      }),
      realOwnershipEnabled: false,
      lazyLoadingEnabled: false
    };
  }

  window.PETATOEFullShadowSystemAudit = Object.freeze({
    version: VERSION,
    audit: audit,
    validate: audit,
    snapshot: snapshot
  });
})();
