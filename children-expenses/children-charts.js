/* PETATOE Children Expenses - Charts/Trend Boundary
 * Version: v6.1.262_CHILDREN_CHARTS_BOUNDARY
 * Safe boundary only. Annual trend dashboard rendering is routed through this module while the legacy engine remains the execution fallback.
 */
(function(window){
  'use strict';

  var root = window.PETATOEChildrenExpensesModule;

  function getInternal(){
    return window.__PETATOEChildrenExpensesChartsInternal || null;
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
    __phase: 'CHILDREN-8_CHARTS_BOUNDARY',
    trendFilterRows: function(rows){ return callInternal('trendFilterRows', arguments); },
    renderAnnualTrendDashboard: function(rows){ return callInternal('renderAnnualTrendDashboard', arguments); },
    read: function(){ return callInternal('read', arguments); }
  };

  window.PETATOEChildrenCharts = api;

  if(root && typeof root.registerModule === 'function'){
    root.registerModule('charts', api);
  }
})(window);
