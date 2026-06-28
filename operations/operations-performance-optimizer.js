(function(){
  'use strict';

  /**
   * PETATOE Operations Performance Optimizer
   * Phase P3
   *
   * Safe external layer only.
   * - Does not edit or extract operations-legacy-engine.js.
   * - Does not change Router, Navigation, Storage, or Operations business logic.
   * - Coalesces repeated delegated render calls coming from filters/search inputs.
   * - Keeps action buttons and tab switching immediate.
   */
  if(window.PETATOEOperationsPerformanceOptimizer) return;

  var VERSION = 'P3-operations-performance-optimizer';
  var RENDER_METHODS = {
    render: { delay: 90, label: 'appointments-render' },
    renderVehicleOperations: { delay: 80, label: 'vehicle-operations-render' },
    renderVehicleExecutionReports: { delay: 120, label: 'vehicle-execution-reports-render' },
    renderOperationsKpiDashboard: { delay: 120, label: 'operations-kpi-render' }
  };

  var originalModuleCall = null;
  var installed = false;
  var timers = Object.create(null);
  var pending = Object.create(null);
  var stats = {
    coalescedCalls: 0,
    executedCalls: 0,
    immediateCalls: 0,
    lastExecutedAt: null,
    methods: Object.create(null)
  };

  function nowIso(){
    try { return new Date().toISOString(); } catch(e){ return String(Date.now()); }
  }

  function isOperationsRenderCall(moduleName, methodName){
    return moduleName === 'operations' && Object.prototype.hasOwnProperty.call(RENDER_METHODS, methodName);
  }

  function record(methodName, field){
    if(!stats.methods[methodName]) stats.methods[methodName] = { queued: 0, executed: 0, immediate: 0 };
    stats.methods[methodName][field] += 1;
  }

  function callOriginal(context, args){
    if(typeof originalModuleCall !== 'function') return undefined;
    return originalModuleCall.apply(context || window.PETATOEInlineHandlers, args || []);
  }

  function scheduleRender(context, args){
    var methodName = args[1];
    var config = RENDER_METHODS[methodName] || { delay: 100 };
    pending[methodName] = { context: context, args: Array.prototype.slice.call(args) };
    stats.coalescedCalls += 1;
    record(methodName, 'queued');

    if(timers[methodName]) clearTimeout(timers[methodName]);
    timers[methodName] = setTimeout(function(){
      var job = pending[methodName];
      delete pending[methodName];
      delete timers[methodName];
      if(!job) return;
      stats.executedCalls += 1;
      stats.lastExecutedAt = nowIso();
      record(methodName, 'executed');
      callOriginal(job.context, job.args);
    }, config.delay);
    return true;
  }

  function install(){
    if(installed) return true;
    if(!window.PETATOEInlineHandlers || typeof window.PETATOEInlineHandlers.moduleCall !== 'function') return false;
    originalModuleCall = window.PETATOEInlineHandlers.moduleCall;
    window.PETATOEInlineHandlers.moduleCall = function(moduleName, methodName){
      if(isOperationsRenderCall(moduleName, methodName)){
        return scheduleRender(this, arguments);
      }
      stats.immediateCalls += 1;
      if(moduleName === 'operations') record(methodName, 'immediate');
      return callOriginal(this, arguments);
    };
    installed = true;
    return true;
  }

  function flush(methodName){
    var keys = methodName ? [methodName] : Object.keys(pending);
    keys.forEach(function(key){
      if(timers[key]){
        clearTimeout(timers[key]);
        delete timers[key];
      }
      var job = pending[key];
      delete pending[key];
      if(job){
        stats.executedCalls += 1;
        stats.lastExecutedAt = nowIso();
        record(key, 'executed');
        callOriginal(job.context, job.args);
      }
    });
  }

  function uninstall(){
    if(!installed) return false;
    flush();
    if(window.PETATOEInlineHandlers && originalModuleCall){
      window.PETATOEInlineHandlers.moduleCall = originalModuleCall;
    }
    installed = false;
    return true;
  }

  function status(){
    return {
      version: VERSION,
      installed: installed,
      protectedOperationsLegacy: !!(window.PETATOEOperations && window.PETATOEOperations.legacyQuarantined),
      coalescedMethods: Object.keys(RENDER_METHODS),
      pending: Object.keys(pending),
      stats: JSON.parse(JSON.stringify(stats))
    };
  }

  window.PETATOEOperationsPerformanceOptimizer = {
    version: VERSION,
    install: install,
    uninstall: uninstall,
    flush: flush,
    status: status
  };

  install();
})();
