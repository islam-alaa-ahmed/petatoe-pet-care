/* PETATOE Children Expenses - Supabase Storage Boundary.
   Scope: isolated read/write access for children expenses and children budgets.
   Source of truth: Supabase only. No LocalStorage migration or fallback. */
(function(window){
  'use strict';

  var EXPENSE_TABLE = 'children_expenses';
  var BUDGET_TABLE = 'children_expense_budgets';
  var expenseCache = [];
  var budgetCache = [];
  var expensesLoaded = false;
  var budgetsLoaded = false;
  var loadingPromise = null;
  var pendingExpenseSave = Promise.resolve({ ok:true });
  var pendingBudgetSave = Promise.resolve({ ok:true });

  function warn(e){
    try{
      if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
        window.PETATOEUtils.warnSilentCatch('children-storage.js', e);
      }else if(window.console && console.warn){
        console.warn('PETATOE Children Expenses Supabase storage warning', e);
      }
    }catch(_e){}
  }

  function client(){
    return window.supabase || window.PETATOE_SUPABASE_CLIENT || null;
  }

  function hasClient(){
    var c = client();
    return !!(c && typeof c.from === 'function');
  }

  function clone(obj){
    try{return JSON.parse(JSON.stringify(obj));}catch(_e){return obj;}
  }

  function resultError(res){
    return res && res.error ? (res.error.message || JSON.stringify(res.error)) : '';
  }

  function normalizeExpenseRow(row){
    row = row || {};
    var data = row.data && typeof row.data === 'object' ? clone(row.data) : {};
    data = data && typeof data === 'object' ? data : {};
    data.id = String(data.id || row.id || '').trim();
    data.date = String(data.date || row.expense_date || '').trim();
    data.child = String(data.child || row.child_name || '').trim();
    data.category = String(data.category || row.category || '').trim();
    data.amount = Number(data.amount != null ? data.amount : row.amount) || 0;
    data.notes = String(data.notes || row.notes || '').trim();
    data.createdAt = data.createdAt || row.created_at || '';
    data.updatedAt = data.updatedAt || row.updated_at || '';
    return data;
  }

  function normalizeBudgetRow(row){
    row = row || {};
    var data = row.data && typeof row.data === 'object' ? clone(row.data) : {};
    data = data && typeof data === 'object' ? data : {};
    data.id = String(data.id || row.id || '').trim();
    data.month = String(data.month || row.period || '').trim();
    data.child = String(data.child || row.child_name || '').trim();
    data.amount = Number(data.amount != null ? data.amount : row.budget_amount) || 0;
    data.createdAt = data.createdAt || '';
    data.updatedAt = data.updatedAt || row.updated_at || '';
    return data;
  }

  function expensePayload(row){
    row = clone(row || {});
    row.id = String(row.id || '').trim();
    if(!row.id) throw new Error('Expense id is required');
    var now = new Date().toISOString();
    row.updatedAt = row.updatedAt || now;
    return {
      id: row.id,
      data: row,
      expense_date: row.date || null,
      child_name: row.child || '',
      category: row.category || '',
      amount: Number(row.amount) || 0,
      notes: row.notes || '',
      updated_at: now
    };
  }

  function budgetPayload(row){
    row = clone(row || {});
    row.id = String(row.id || '').trim();
    if(!row.id) throw new Error('Budget id is required');
    var now = new Date().toISOString();
    row.updatedAt = row.updatedAt || now;
    return {
      id: row.id,
      data: row,
      child_name: row.child || '',
      period: row.month || '',
      budget_amount: Number(row.amount) || 0,
      updated_at: now
    };
  }

  async function loadExpenses(){
    if(!hasClient()){ expenseCache = []; expensesLoaded = true; return expenseCache; }
    var res = await client().from(EXPENSE_TABLE).select('*').order('created_at', { ascending:true });
    if(res.error){ warn('children expenses list failed: '+resultError(res)); expenseCache = []; expensesLoaded = true; return expenseCache; }
    expenseCache = (Array.isArray(res.data) ? res.data : []).map(normalizeExpenseRow).filter(function(x){ return !!x.id; });
    expensesLoaded = true;
    return expenseCache;
  }

  async function loadBudgets(){
    if(!hasClient()){ budgetCache = []; budgetsLoaded = true; return budgetCache; }
    var res = await client().from(BUDGET_TABLE).select('*').order('updated_at', { ascending:true });
    if(res.error){ warn('children budgets list failed: '+resultError(res)); budgetCache = []; budgetsLoaded = true; return budgetCache; }
    budgetCache = (Array.isArray(res.data) ? res.data : []).map(normalizeBudgetRow).filter(function(x){ return !!x.id; });
    budgetsLoaded = true;
    return budgetCache;
  }

  function refresh(options){
    options = options || {};
    if(loadingPromise && !options.force) return loadingPromise;
    loadingPromise = Promise.all([loadExpenses(), loadBudgets()]).then(function(){
      try{
        if(window.PETATOEChildrenExpenses && typeof window.PETATOEChildrenExpenses.render === 'function'){
          window.PETATOEChildrenExpenses.render();
        }
      }catch(e){ warn(e); }
      return { expenses: read(), budgets: readBudgets() };
    }).catch(function(e){ warn(e); return { expenses: read(), budgets: readBudgets() }; });
    return loadingPromise;
  }

  async function saveExpensesToSupabase(arr, previous){
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    arr = Array.isArray(arr) ? arr : [];
    previous = Array.isArray(previous) ? previous : [];
    var ids = {};
    arr.forEach(function(row){ if(row && row.id) ids[String(row.id)] = true; });
    var oldIds = {};
    previous.forEach(function(row){ if(row && row.id) oldIds[String(row.id)] = true; });
    var payloads = [];
    for(var i=0;i<arr.length;i++) payloads.push(expensePayload(arr[i]));
    if(payloads.length){
      var up = await client().from(EXPENSE_TABLE).upsert(payloads, { onConflict:'id' });
      if(up.error){ warn('children expenses upsert failed: '+resultError(up)); return { ok:false, error:resultError(up) }; }
    }
    var toDelete = Object.keys(oldIds).filter(function(id){ return !ids[id]; });
    if(toDelete.length){
      var del = await client().from(EXPENSE_TABLE).delete().in('id', toDelete);
      if(del.error){ warn('children expenses delete failed: '+resultError(del)); return { ok:false, error:resultError(del) }; }
    }
    return { ok:true };
  }

  async function saveBudgetsToSupabase(arr, previous){
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    arr = Array.isArray(arr) ? arr : [];
    previous = Array.isArray(previous) ? previous : [];
    var ids = {};
    arr.forEach(function(row){ if(row && row.id) ids[String(row.id)] = true; });
    var oldIds = {};
    previous.forEach(function(row){ if(row && row.id) oldIds[String(row.id)] = true; });
    var payloads = [];
    for(var i=0;i<arr.length;i++) payloads.push(budgetPayload(arr[i]));
    if(payloads.length){
      var up = await client().from(BUDGET_TABLE).upsert(payloads, { onConflict:'id' });
      if(up.error){ warn('children budgets upsert failed: '+resultError(up)); return { ok:false, error:resultError(up) }; }
    }
    var toDelete = Object.keys(oldIds).filter(function(id){ return !ids[id]; });
    if(toDelete.length){
      var del = await client().from(BUDGET_TABLE).delete().in('id', toDelete);
      if(del.error){ warn('children budgets delete failed: '+resultError(del)); return { ok:false, error:resultError(del) }; }
    }
    return { ok:true };
  }

  function read(){
    if(!expensesLoaded) refresh();
    return clone(expenseCache || []);
  }

  function write(arr){
    arr = Array.isArray(arr) ? clone(arr) : [];
    var previous = clone(expenseCache || []);
    expenseCache = arr;
    expensesLoaded = true;
    pendingExpenseSave = saveExpensesToSupabase(arr, previous);
    return pendingExpenseSave;
  }

  function readBudgets(){
    if(!budgetsLoaded) refresh();
    return clone(budgetCache || []);
  }

  function writeBudgets(arr){
    arr = Array.isArray(arr) ? clone(arr) : [];
    var previous = clone(budgetCache || []);
    budgetCache = arr;
    budgetsLoaded = true;
    pendingBudgetSave = saveBudgetsToSupabase(arr, previous);
    return pendingBudgetSave;
  }

  function currentUserId(){
    try{
      var u = window.__PETATOE_ACTIVE_USER__ || window.currentUser || null;
      if(u && typeof u === 'object') return String(u.id || u.username || u.email || '').trim();
      if(typeof u === 'string') return u;
      if(window.PETATOEAuth && typeof window.PETATOEAuth.currentUser === 'function'){
        var au = window.PETATOEAuth.currentUser();
        if(au && typeof au === 'object') return String(au.id || au.username || au.email || '').trim();
      }
    }catch(e){ warn(e); }
    return '';
  }

  var api = {
    __ready: true,
    __phase: 'CHILDREN_EXPENSES_SUPABASE_LOCK',
    tables: { expenses: EXPENSE_TABLE, budgets: BUDGET_TABLE },
    read: read,
    write: write,
    readBudgets: readBudgets,
    writeBudgets: writeBudgets,
    refresh: refresh,
    waitForSave: function(){ return Promise.all([pendingExpenseSave, pendingBudgetSave]); },
    currentUserId: currentUserId
  };

  window.PETATOEChildrenExpensesStorage = api;

  var root = window.PETATOEChildrenExpensesModule;
  if(root && typeof root.registerModule === 'function'){
    root.registerModule('storage', api);
  }

  setTimeout(function(){ refresh({ force:true }); }, 0);
  console.log('✅ PETATOE Children Expenses Supabase storage loaded');
})(window);
