/* PETATOE Children Expenses - Storage Boundary.
   Scope: isolated read/write access for children expenses and children budgets.
   Keeps the same legacy keys and PETATOEStorage dependency. */
(function(window){
  'use strict';

  var KEY = 'childrenExpenses';
  var LEGACY_KEY = 'PETATOE_CHILDREN_EXPENSES_V1';
  var BUDGET_KEY = 'childrenExpenseBudgets';
  var BUDGET_LEGACY_KEY = 'PETATOE_CHILDREN_EXPENSE_BUDGETS_V1';

  function warn(e){
    try{
      if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
        window.PETATOEUtils.warnSilentCatch('children-storage.js', e);
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("children-expenses/children-storage.js",e);}
  }

  function storage(){ return window.PETATOEStorage || null; }

  function readJson(primaryKey, legacyKey){
    try{
      var st = storage();
      var arr = st && st.readJSON ? st.readJSON(primaryKey, null) : null;
      if(!Array.isArray(arr) && legacyKey && st && st.readJSON){
        arr = st.readJSON(legacyKey, []);
      }
      return Array.isArray(arr) ? arr : [];
    }catch(e){ warn(e); return []; }
  }

  function writeJson(primaryKey, arr){
    try{
      var st = storage();
      if(st && st.writeJSON){
        return st.writeJSON(primaryKey, Array.isArray(arr) ? arr : []);
      }
    }catch(e){ warn(e); }
    return false;
  }

  function read(){ return readJson(KEY, LEGACY_KEY); }
  function write(arr){ return writeJson(KEY, arr); }
  function readBudgets(){ return readJson(BUDGET_KEY, BUDGET_LEGACY_KEY); }
  function writeBudgets(arr){ return writeJson(BUDGET_KEY, arr); }

  function currentUserId(){
    try{
      var st = storage();
      if(st && st.get){
        return st.get('petatoe_current_user_v108','') ||
          st.get('petatoe_current_user_v139','') ||
          st.get('petatoe_current_user_v2','') ||
          st.get('petatoe_current_user','') ||
          '';
      }
    }catch(e){ warn(e); }
    return '';
  }

  var api = {
    __ready: true,
    __phase: 'CHILDREN_STORAGE_IDENTITY_HARDENED',
    keys: { expenses: KEY, expensesLegacy: LEGACY_KEY, budgets: BUDGET_KEY, budgetsLegacy: BUDGET_LEGACY_KEY },
    read: read,
    write: write,
    readBudgets: readBudgets,
    writeBudgets: writeBudgets,
    currentUserId: currentUserId
  };

  window.PETATOEChildrenExpensesStorage = api;

  var root = window.PETATOEChildrenExpensesModule;
  if(root && typeof root.registerModule === 'function'){
    root.registerModule('storage', api);
  }
})(window);
