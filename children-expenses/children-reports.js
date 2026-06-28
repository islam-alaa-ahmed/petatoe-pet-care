/* PETATOE Children Expenses - Reports Boundary
 * Version: v6.1.260_CHILDREN_REPORTS_BOUNDARY
 * Safe boundary only. Reports filters, summary, group/month reports, print and export are routed through this module while the legacy engine remains the execution fallback.
 */
(function(window){
  'use strict';

  var root = window.PETATOEChildrenExpensesModule;

  function getInternal(){
    return window.__PETATOEChildrenExpensesReportsInternal || null;
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
    __phase: 'CHILDREN-6_REPORTS_BOUNDARY',
    reportFilterRows: function(rows){ return callInternal('reportFilterRows', arguments); },
    fillReportFilters: function(rows){ return callInternal('fillReportFilters', arguments); },
    renderGroupTable: function(id, rows, label){ return callInternal('renderGroupTable', arguments); },
    renderMonthReport: function(rows, targetId){ return callInternal('renderMonthReport', arguments); },
    renderReportSummary: function(rows, targetId){ return callInternal('renderReportSummary', arguments); },
    renderReports: function(rows){ return callInternal('renderReports', arguments); },
    resetReportFilters: function(){ return callInternal('resetReportFilters', arguments); },
    exportReportExcel: function(){ return callInternal('exportReportExcel', arguments); },
    printReport: function(){ return callInternal('printReport', arguments); },
    read: function(){ return callInternal('read', arguments); }
  };

  window.PETATOEChildrenReports = api;

  if(root && typeof root.registerModule === 'function'){
    root.registerModule('reports', api);
  }
})(window);
