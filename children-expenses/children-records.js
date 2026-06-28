/* PETATOE Children Expenses - Records Boundary
 * Version: v6.1.259_CHILDREN_RECORDS_BOUNDARY
 * Safe boundary only. Records filters, KPI, and table rendering are routed through this module while the legacy engine remains the execution fallback.
 */
(function(window){
  'use strict';

  var root = window.PETATOEChildrenExpensesModule;

  function getInternal(){
    return window.__PETATOEChildrenExpensesRecordsInternal || null;
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
    __phase: 'CHILDREN-5_RECORDS_BOUNDARY',
    currentRows: function(){ return callInternal('currentRows', arguments); },
    renderFilters: function(rows){ return callInternal('renderFilters', arguments); },
    renderKpis: function(rows){ return callInternal('renderKpis', arguments); },
    renderTable: function(rows){ return callInternal('renderTable', arguments); },
    resetFilters: function(){ return callInternal('resetFilters', arguments); },
    read: function(){ return callInternal('read', arguments); }
  };

  window.PETATOEChildrenRecords = api;

  if(root && typeof root.registerModule === 'function'){
    root.registerModule('records', api);
  }
})(window);
