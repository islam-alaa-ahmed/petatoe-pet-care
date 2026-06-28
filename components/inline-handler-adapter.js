(function(){
  'use strict';

  /**
   * PETATOE Inline Handler Adapter Layer
   *
   * Purpose:
   * - Provide one safe dispatch surface for future migration away from inline HTML handlers.
   * - Keep current public module APIs untouched.
   * - Avoid changing UI, business rules, or existing onclick/onchange behavior in this phase.
   */

  function warn(message, error){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('inline-handler-adapter.js: ' + message, error || null);
        return;
      }
      if(window.console && typeof window.console.warn === 'function'){
        window.console.warn('[PETATOEInlineHandlers]', message, error || '');
      }
    }catch(_){/* silent */}
  }

  function resolvePath(path){
    try{
      if(!path || typeof path !== 'string') return null;
      var parts = path.split('.').filter(Boolean);
      var ctx = window;
      for(var i = 0; i < parts.length; i += 1){
        if(ctx == null) return null;
        ctx = ctx[parts[i]];
      }
      return ctx;
    }catch(e){
      warn('resolvePath failed: ' + path, e);
      return null;
    }
  }

  function call(path){
    var args = Array.prototype.slice.call(arguments, 1);
    try{
      var fn = resolvePath(path);
      if(typeof fn !== 'function'){
        warn('handler not found: ' + path);
        return undefined;
      }
      return fn.apply(window, args);
    }catch(e){
      warn('handler failed: ' + path, e);
      throw e;
    }
  }

  function moduleCall(moduleName, methodName){
    var args = Array.prototype.slice.call(arguments, 2);
    return call.apply(null, ['PETATOEInlineHandlers.modules.' + moduleName + '.' + methodName].concat(args));
  }

  var api = window.PETATOEInlineHandlers || {};
  api.version = 'v6.1.295';
  api.resolve = resolvePath;
  api.call = call;
  api.moduleCall = moduleCall;

  api.modules = api.modules || {};

  Object.defineProperties(api.modules, {
    operations: {
      configurable: true,
      get: function(){ return window.PETATOEOperations || window.PETATOEAppointments || {}; }
    },
    children: {
      configurable: true,
      get: function(){ return window.PETATOEChildrenExpenses || {}; }
    },
    warehouse: {
      configurable: true,
      get: function(){ return window.PETATOEWarehouseUI || window.PETATOEWarehouse || {}; }
    },
    warehouses: {
      configurable: true,
      get: function(){ return window.PETATOEWarehouses || {}; }
    },
    warehouseAlerts: {
      configurable: true,
      get: function(){ return window.PETATOEWarehouseAlerts || {}; }
    },
    settings: {
      configurable: true,
      get: function(){ return window.PETATOESettings || window.PETATOESettingsUI || {}; }
    },
    permissions: {
      configurable: true,
      get: function(){ return window.PETATOEPermissions || {}; }
    },
    sales: {
      configurable: true,
      get: function(){ return window.PETATOESales || {}; }
    },
    salesInvoiceReport: {
      configurable: true,
      get: function(){ return window.PETATOESalesInvoiceReport || {}; }
    },
    reports: {
      configurable: true,
      get: function(){ return window.PETATOEReports || {}; }
    },
    smartTabs: {
      configurable: true,
      get: function(){ return window.PETATOESmartTabs || {}; }
    },
    router: {
      configurable: true,
      get: function(){ return window.PETATOERouter || {}; }
    },
    payroll: {
      configurable: true,
      get: function(){ return window.PETATOEPayroll || {}; }
    },
    treasury: {
      configurable: true,
      get: function(){ return window.PETATOETreasury || {}; }
    }
  });

  window.PETATOEInlineHandlers = api;
})();
