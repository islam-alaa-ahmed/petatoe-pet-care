/* PETATOE v6.1.266 — Children Expenses Facade
 * The original monolithic engine was moved to:
 * children-expenses/children-legacy-engine.js
 * This file keeps the public PETATOEChildrenExpenses API stable and routes calls through the new module layer first, with the legacy engine as a safe fallback.
 */
(function(window){
  'use strict';

  var root = window.PETATOEChildrenExpensesModule || null;
  function legacyEngine(){ return window.__PETATOEChildrenExpensesLegacyEngine || null; }

  function warn(e){
    try{
      if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
        window.PETATOEUtils.warnSilentCatch('children-expenses-core.js facade', e);
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/children-expenses-core.js",e);}
  }

  function getModule(name){
    try{
      if(root && typeof root.getModule === 'function') return root.getModule(name);
    }catch(e){ warn(e); }
    return null;
  }

  function callLegacy(methodName, args){
    try{
      var legacy = legacyEngine();
      if(legacy && typeof legacy[methodName] === 'function'){
        return legacy[methodName].apply(legacy, args || []);
      }
    }catch(e){ warn(e); }
    return undefined;
  }

  function callModule(name, methodName, args){
    try{
      var mod = getModule(name);
      if(mod && typeof mod[methodName] === 'function'){
        return mod[methodName].apply(mod, args || []);
      }
    }catch(e){ warn(e); }
    return callLegacy(methodName, args || []);
  }

  function callStorage(methodName, args){
    try{
      var storage = window.PETATOEChildrenExpensesStorage || getModule('storage');
      if(storage && typeof storage[methodName] === 'function'){
        return storage[methodName].apply(storage, args || []);
      }
    }catch(e){ warn(e); }
    return callLegacy(methodName, args || []);
  }

  var api = {
    __ready: true,
    __facade: true,
    __phase: 'CHILDREN-12_FINAL_DEEP_EXTRACTION',

    render: function(){ return callLegacy('render', arguments); },
    setTab: function(tab){ return callLegacy('setTab', arguments); },

    clearForm: function(){ return callModule('entry', 'clearForm', arguments); },
    saveFromForm: function(){ return callModule('entry', 'saveFromForm', arguments); },
    editRow: function(id){ return callModule('entry', 'editRow', arguments); },
    deleteRow: function(id){ return callModule('entry', 'deleteRow', arguments); },

    clearBudgetForm: function(){ return callModule('budget', 'clearBudgetForm', arguments); },
    saveBudgetFromForm: function(){ return callModule('budget', 'saveBudgetFromForm', arguments); },
    editBudget: function(id){ return callModule('budget', 'editBudget', arguments); },
    deleteBudget: function(id){ return callModule('budget', 'deleteBudget', arguments); },

    resetFilters: function(){ return callModule('records', 'resetFilters', arguments); },
    resetReportFilters: function(){ return callModule('reports', 'resetReportFilters', arguments); },
    resetAnnualFilters: function(){ return callModule('annual', 'resetAnnualFilters', arguments); },

    exportReportExcel: function(){ return callModule('reports', 'exportReportExcel', arguments); },
    printReport: function(){ return callModule('reports', 'printReport', arguments); },

    read: function(){ return callStorage('read', arguments); },
    readBudgets: function(){ return callStorage('readBudgets', arguments); },

    getLegacy: function(){ return legacyEngine(); },
    legacyQuarantined: true
  };

  window.PETATOEChildrenExpenses = api;
})(window);
