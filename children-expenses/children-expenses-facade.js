/*
 * PETATOE v6.4.40 — CHX2 Children Expenses Facade + Runtime Probe
 * SAFE / AUDIT-ONLY LAYER
 *
 * This file does not replace PETATOEChildrenExpenses and does not mutate
 * children expenses behavior. It only resolves and records calls to the
 * existing legacy/modular public APIs so future extraction can be measured.
 */
(function(){
  'use strict';

  var PHASE = 'CHX2_CHILDREN_EXPENSES_FACADE_RUNTIME_PROBE';
  var history = [];
  var MAX_HISTORY = 120;

  function now(){
    try { return new Date().toISOString(); }
    catch(_e){ return String(Date.now()); }
  }

  function warn(e, scope){
    try{
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('children-expenses/children-expenses-facade.js', e, {scope: scope || 'children-expenses-facade'});
        return;
      }
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('children-expenses-facade.js', e);
      }
    }catch(_e){ return; }
  }

  function record(type, payload){
    try{
      history.push({
        at: now(),
        phase: PHASE,
        type: String(type || 'event'),
        payload: payload || {}
      });
      if(history.length > MAX_HISTORY){ history.splice(0, history.length - MAX_HISTORY); }
    }catch(e){ warn(e, 'record'); }
  }

  function legacy(){
    return window.PETATOEChildrenExpenses || window.__PETATOEChildrenExpensesLegacyEngine || null;
  }

  function moduleRoot(){
    return window.PETATOEChildrenExpensesModule || null;
  }

  function internals(){
    return {
      entry: window.__PETATOEChildrenExpensesEntryInternal || null,
      budget: window.__PETATOEChildrenExpensesBudgetInternal || null,
      records: window.__PETATOEChildrenExpensesRecordsInternal || null,
      reports: window.__PETATOEChildrenExpensesReportsInternal || null,
      charts: window.__PETATOEChildrenExpensesChartsInternal || null,
      annual: window.__PETATOEChildrenExpensesAnnualInternal || null,
      storage: window.PETATOEChildrenExpensesStorage || null
    };
  }

  function publicModules(){
    return {
      core: moduleRoot(),
      legacy: legacy(),
      entry: window.PETATOEChildrenEntry || null,
      budget: window.PETATOEChildrenBudget || null,
      records: window.PETATOEChildrenRecords || null,
      reports: window.PETATOEChildrenReports || null,
      charts: window.PETATOEChildrenCharts || null,
      annual: window.PETATOEChildrenAnnual || null,
      storage: window.PETATOEChildrenExpensesStorage || null
    };
  }

  function getFunctionNames(obj){
    var names = [];
    try{
      if(!obj) return names;
      Object.keys(obj).forEach(function(k){
        if(typeof obj[k] === 'function') names.push(k);
      });
    }catch(e){ warn(e, 'getFunctionNames'); }
    return names.sort();
  }

  function resolve(name){
    var key = String(name || '').trim();
    var pools = publicModules();
    var privatePools = internals();
    var result = null;

    try{
      Object.keys(pools).some(function(scope){
        var target = pools[scope];
        if(target && typeof target[key] === 'function'){
          result = { scope: scope, name: key, fn: target[key], target: target, private: false };
          return true;
        }
        return false;
      });
      if(!result){
        Object.keys(privatePools).some(function(scope){
          var target = privatePools[scope];
          if(target && typeof target[key] === 'function'){
            result = { scope: '__' + scope, name: key, fn: target[key], target: target, private: true };
            return true;
          }
          return false;
        });
      }
      record('resolve', { name: key, found: !!result, scope: result ? result.scope : null });
    }catch(e){ warn(e, 'resolve'); }
    return result;
  }

  function validate(){
    var pub = publicModules();
    var priv = internals();
    var result = {
      phase: PHASE,
      ready: !!legacy(),
      legacyReady: !!(legacy() && legacy().__ready),
      rootReady: !!moduleRoot(),
      publicModules: {},
      internalModules: {},
      warnings: []
    };
    Object.keys(pub).forEach(function(k){ result.publicModules[k] = !!pub[k]; });
    Object.keys(priv).forEach(function(k){ result.internalModules[k] = !!priv[k]; });
    if(!result.ready) result.warnings.push('PETATOEChildrenExpenses legacy API is not available yet.');
    if(!result.rootReady) result.warnings.push('PETATOEChildrenExpensesModule root is not available yet.');
    record('validate', { ready: result.ready, warnings: result.warnings.slice() });
    return result;
  }

  function snapshot(){
    var pub = publicModules();
    var priv = internals();
    var snap = {
      phase: PHASE,
      createdAt: now(),
      behavior: 'SAFE_PROBE_ONLY',
      doesReplaceLegacy: false,
      publicApi: {},
      internalApi: {},
      historyCount: history.length
    };
    Object.keys(pub).forEach(function(k){ snap.publicApi[k] = getFunctionNames(pub[k]); });
    Object.keys(priv).forEach(function(k){ snap.internalApi[k] = getFunctionNames(priv[k]); });
    record('snapshot', { historyCount: history.length });
    return snap;
  }

  function call(name){
    var args = Array.prototype.slice.call(arguments, 1);
    var found = resolve(name);
    if(!found){
      record('call-blocked', { name: name, reason: 'not-found' });
      return { ok: false, reason: 'not-found', name: String(name || '') };
    }
    try{
      record('call', { name: found.name, scope: found.scope, argCount: args.length });
      return { ok: true, scope: found.scope, value: found.fn.apply(found.target, args) };
    }catch(e){
      warn(e);
      record('call-error', { name: found.name, scope: found.scope, message: e && e.message ? e.message : String(e) });
      return { ok: false, reason: 'exception', error: e };
    }
  }

  var api = {
    __phase: PHASE,
    __safe: true,
    validate: validate,
    snapshot: snapshot,
    resolve: resolve,
    call: call,
    history: function(){ return history.slice(); },
    clearHistory: function(){ history.length = 0; return true; }
  };

  window.PETATOEChildrenExpensesFacade = api;
  record('loaded', { safe: true });
})();
