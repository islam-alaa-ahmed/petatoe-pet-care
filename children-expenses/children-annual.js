/* PETATOE Children Expenses - Annual Boundary
 * Version: v6.1.261_CHILDREN_ANNUAL_BOUNDARY
 * Safe boundary only. Annual filters and annual report rendering are routed through this module while the legacy engine remains the execution fallback.
 */
(function(window){
  'use strict';

  var root = window.PETATOEChildrenExpensesModule;

  function getInternal(){
    return window.__PETATOEChildrenExpensesAnnualInternal || null;
  }

  function callInternal(methodName, args){
    var internal = getInternal();
    if(internal && typeof internal[methodName] === 'function'){
      return internal[methodName].apply(internal, args || []);
    }
    if(root && typeof root.callLegacy === 'function'){
      return root.callLegacy(methodName, args || []);
    }
    return undefined;
  }

  var api = {
    __ready: true,
    __phase: 'CHILDREN-7_ANNUAL_BOUNDARY',
    annualFilterRows: function(rows){ return callInternal('annualFilterRows', arguments); },
    renderAnnualReports: function(rows){ return callInternal('renderAnnualReports', arguments); },
    resetAnnualFilters: function(){ return callInternal('resetAnnualFilters', arguments); },
    renderAnnualTrendDashboard: function(rows){ return callInternal('renderAnnualTrendDashboard', arguments); },
    read: function(){ return callInternal('read', arguments); }
  };

  window.PETATOEChildrenAnnual = api;

  if(root && typeof root.registerModule === 'function'){
    root.registerModule('annual', api);
  }
})(window);
