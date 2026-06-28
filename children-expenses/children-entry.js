/* PETATOE Children Expenses - Entry Boundary
 * Version: v6.1.258_CHILDREN_ENTRY_BOUNDARY
 * Safe boundary only. Expense entry actions are routed through this module while the legacy engine remains the execution fallback.
 */
(function(window){
  'use strict';

  var root = window.PETATOEChildrenExpensesModule;

  function getInternal(){
    return window.__PETATOEChildrenExpensesEntryInternal || null;
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
    __phase: 'CHILDREN-4_ENTRY_BOUNDARY',
    clearForm: function(){ return callInternal('clearForm', arguments); },
    saveFromForm: function(){ return callInternal('saveFromForm', arguments); },
    editRow: function(id){ return callInternal('editRow', arguments); },
    deleteRow: function(id){ return callInternal('deleteRow', arguments); },
    read: function(){ return callInternal('read', arguments); }
  };

  window.PETATOEChildrenEntry = api;

  if(root && typeof root.registerModule === 'function'){
    root.registerModule('entry', api);
  }
})(window);
