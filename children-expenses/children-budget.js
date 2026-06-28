/* PETATOE Children Expenses - Budget Boundary
 * Version: v6.1.257_CHILDREN_BUDGET_BOUNDARY
 * Safe boundary only. Budget actions are routed through this module while the legacy engine remains the execution fallback.
 */
(function(window){
  'use strict';

  var root = window.PETATOEChildrenExpensesModule;

  function getInternal(){
    return window.__PETATOEChildrenExpensesBudgetInternal || null;
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
    __phase: 'CHILDREN-3_BUDGET_BOUNDARY',
    renderBudgets: function(rows){ return callInternal('renderBudgets', arguments); },
    clearBudgetForm: function(){ return callInternal('clearBudgetForm', arguments); },
    saveBudgetFromForm: function(){ return callInternal('saveBudgetFromForm', arguments); },
    editBudget: function(id){ return callInternal('editBudget', arguments); },
    deleteBudget: function(id){ return callInternal('deleteBudget', arguments); },
    readBudgets: function(){ return callInternal('readBudgets', arguments); }
  };

  window.PETATOEChildrenBudget = api;

  if(root && typeof root.registerModule === 'function'){
    root.registerModule('budget', api);
  }
})(window);
