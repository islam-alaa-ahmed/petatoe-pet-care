/*
 * PETATOE v6.4.31 — OPX7 Final Operations Stability Audit
 * SAFE / AUDIT ONLY
 *
 * This file performs a passive runtime audit after OPX6 controlled migration.
 * It does not replace PETATOEAppointments, does not mutate storage,
 * does not change routing, and does not call render/write operations.
 */
(function(){
  'use strict';

  var NAME = 'PETATOEOperationsFinalStabilityAudit';
  var VERSION = 'v6.4.31_PHASE_OPX7_FINAL_OPERATIONS_STABILITY_AUDIT';

  if (window[NAME] && window[NAME].version === VERSION) {
    return;
  }

  var REQUIRED_GLOBALS = [
    'PETATOEAppointments',
    'PETATOEOperationsFacade',
    'PETATOEOperationsSchedulerShadow',
    'PETATOEOperationsWorkflowShadow',
    'PETATOEOperationsHistoryShadow',
    'PETATOEOperationsControlledMigration'
  ];

  var CRITICAL_OPERATION_METHODS = [
    'renderCalendar',
    'renderVehicleOperations',
    'renderOperationsReports',
    'renderVehicleStatusHistory',
    'renderVehicleFinalSummary'
  ];

  function exists(path){
    return typeof window[path] !== 'undefined' && window[path] !== null;
  }

  function typeOfGlobal(name){
    if (!exists(name)) return 'missing';
    return typeof window[name];
  }

  function listMethods(obj){
    if (!obj) return [];
    var out = [];
    try {
      Object.keys(obj).forEach(function(k){
        if (typeof obj[k] === 'function') out.push(k);
      });
    } catch(err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('operations/operations-final-stability-audit.js',err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations/operations-final-stability-audit.js',_petatoeSilentCatch);}}
    return out.sort();
  }

  function safeCall(target, method){
    try {
      if (!target || typeof target[method] !== 'function') {
        return { ok:false, reason:'missing_method' };
      }
      var value = target[method]();
      return { ok:true, value:value };
    } catch(err) {
      return { ok:false, reason:'exception', message:String(err && err.message || err) };
    }
  }

  function facadeResolve(name){
    try {
      var facade = window.PETATOEOperationsFacade;
      if (!facade || typeof facade.resolve !== 'function') {
        return { ok:false, reason:'facade_missing' };
      }
      var resolved = facade.resolve(name);
      return {
        ok: !!resolved,
        type: typeof resolved,
        reason: resolved ? 'resolved' : 'not_resolved'
      };
    } catch(err) {
      return { ok:false, reason:'exception', message:String(err && err.message || err) };
    }
  }

  function audit(){
    var globals = REQUIRED_GLOBALS.map(function(name){
      return { name:name, status: exists(name) ? 'present' : 'missing', type:typeOfGlobal(name) };
    });

    var appointments = window.PETATOEAppointments || null;
    var appointmentMethods = listMethods(appointments);
    var criticalMethods = CRITICAL_OPERATION_METHODS.map(function(method){
      return {
        method: method,
        inAppointments: !!(appointments && typeof appointments[method] === 'function'),
        facade: facadeResolve(method)
      };
    });

    var layers = {
      facade: safeCall(window.PETATOEOperationsFacade, 'validate'),
      scheduler: safeCall(window.PETATOEOperationsSchedulerShadow, 'validate'),
      workflow: safeCall(window.PETATOEOperationsWorkflowShadow, 'validate'),
      history: safeCall(window.PETATOEOperationsHistoryShadow, 'validate'),
      controlledMigration: safeCall(window.PETATOEOperationsControlledMigration, 'validate')
    };

    var missingGlobals = globals.filter(function(g){ return g.status !== 'present'; });
    var missingCritical = criticalMethods.filter(function(m){ return !m.inAppointments; });
    var failedLayers = Object.keys(layers).filter(function(k){ return !layers[k].ok; });

    var score = 100;
    score -= missingGlobals.length * 10;
    score -= missingCritical.length * 8;
    score -= failedLayers.length * 6;
    if (score < 0) score = 0;

    var status = score >= 90 ? 'golden_candidate' : (score >= 75 ? 'stable_with_notes' : 'needs_review');

    return {
      version: VERSION,
      mode: 'SAFE_AUDIT_ONLY',
      timestamp: new Date().toISOString(),
      score: score,
      status: status,
      globals: globals,
      appointmentMethodCount: appointmentMethods.length,
      criticalMethods: criticalMethods,
      layers: layers,
      findings: {
        missingGlobals: missingGlobals,
        missingCriticalMethods: missingCritical,
        failedLayers: failedLayers
      },
      recommendation: status === 'golden_candidate'
        ? 'Operations OPX track may be tagged as Golden Operations Architecture after manual regression testing.'
        : 'Review missing/failed audit items before approving OPX Golden status.'
    };
  }

  function snapshot(){
    var result = audit();
    return {
      version: result.version,
      mode: result.mode,
      score: result.score,
      status: result.status,
      globalsPresent: result.globals.filter(function(g){ return g.status === 'present'; }).length,
      globalsRequired: result.globals.length,
      appointmentMethodCount: result.appointmentMethodCount,
      missingGlobals: result.findings.missingGlobals.map(function(g){ return g.name; }),
      missingCriticalMethods: result.findings.missingCriticalMethods.map(function(m){ return m.method; }),
      failedLayers: result.findings.failedLayers,
      recommendation: result.recommendation
    };
  }

  window[NAME] = {
    version: VERSION,
    mode: 'SAFE_AUDIT_ONLY',
    audit: audit,
    snapshot: snapshot,
    validate: function(){ return audit(); }
  };
})();
