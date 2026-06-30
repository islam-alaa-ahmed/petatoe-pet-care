/* PETATOE v8.0.2 — Enterprise Shared Supabase Repository
   Centralized Supabase CRUD helpers + module repositories.
   Rules:
   - No LocalStorage migration is performed here.
   - New data flows should call this repository instead of direct supabase.from(...) calls.
   - Module-specific repositories are thin wrappers over generic JSON/table helpers. */
(function(window){
  'use strict';

  if(window.PETATOESupabaseRepository && window.PETATOESupabaseRepository.__enterpriseReady) return;

  var VERSION='8.0.2-enterprise-repository';

  function client(){ return window.supabase || window.PETATOE_SUPABASE_CLIENT || null; }
  function hasClient(){ var c=client(); return !!(c && typeof c.from==='function'); }
  function clone(obj){ try{return JSON.parse(JSON.stringify(obj));}catch(_e){return obj;} }
  function asArray(v){ return Array.isArray(v)?v:[]; }
  function nowIso(){ return new Date().toISOString(); }
  function str(v){ return String(v==null?'':v); }
  function resultError(res){ return res && res.error ? (res.error.message || JSON.stringify(res.error)) : ''; }
  function warn(scope, table, res){
    var msg=resultError(res);
    if(msg) console.warn('PETATOESupabaseRepository '+scope+' failed', table, msg);
    return msg;
  }

  function buildSelect(table, opts){
    opts=opts||{};
    if(!hasClient()) return null;
    var q=client().from(table).select(opts.columns||'*');
    if(Array.isArray(opts.eq)){
      opts.eq.forEach(function(pair){ if(pair && pair.length>=2) q=q.eq(pair[0], pair[1]); });
    }else if(opts.eq && typeof opts.eq==='object'){
      Object.keys(opts.eq).forEach(function(k){ q=q.eq(k, opts.eq[k]); });
    }
    if(opts.order) q=q.order(opts.order, { ascending: opts.ascending !== false });
    if(opts.limit) q=q.limit(opts.limit);
    return q;
  }

  async function selectRows(table, opts){
    if(!hasClient()) return [];
    var q=buildSelect(table, opts||{});
    var res=await q;
    if(res.error){ warn('selectRows', table, res); return []; }
    return asArray(res.data).map(clone);
  }

  async function selectOne(table, opts){
    opts=Object.assign({}, opts||{}, { limit:1 });
    var rows=await selectRows(table, opts);
    return rows.length?rows[0]:null;
  }

  async function insertRow(table, payload){
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    var res=await client().from(table).insert(clone(payload||{}));
    if(res.error) return { ok:false, error:warn('insertRow', table, res) };
    return { ok:true, data:res.data };
  }

  async function upsertRow(table, payload, opts){
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    opts=opts||{};
    var res=await client().from(table).upsert(clone(payload||{}), { onConflict: opts.onConflict || 'id' });
    if(res.error) return { ok:false, error:warn('upsertRow', table, res) };
    return { ok:true, data:res.data };
  }

  async function updateWhere(table, patch, eq){
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    var q=client().from(table).update(clone(patch||{}));
    Object.keys(eq||{}).forEach(function(k){ q=q.eq(k, eq[k]); });
    var res=await q;
    if(res.error) return { ok:false, error:warn('updateWhere', table, res) };
    return { ok:true, data:res.data };
  }

  async function deleteWhere(table, eq){
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    var q=client().from(table).delete();
    Object.keys(eq||{}).forEach(function(k){ q=q.eq(k, eq[k]); });
    var res=await q;
    if(res.error) return { ok:false, error:warn('deleteWhere', table, res) };
    return { ok:true, data:res.data };
  }

  async function deleteById(table, id){
    if(!id) return { ok:false, error:'Missing id' };
    return deleteWhere(table, { id:String(id) });
  }

  function rowToJson(row){
    row=row||{};
    var data=row.data && typeof row.data==='object' ? clone(row.data) : {};
    if(row.id != null && data.id == null) data.id=row.id;
    return data;
  }

  async function listJsonRows(table, opts){
    var rows=await selectRows(table, opts||{});
    return rows.map(rowToJson);
  }

  async function upsertJsonRow(table, id, data, extra){
    if(!id) throw new Error('Supabase row id is required for '+table);
    data=data&&typeof data==='object'?clone(data):{};
    data.id=data.id||id;
    var payload=Object.assign({ id:String(id), data:data, updated_at:nowIso() }, extra||{});
    return upsertRow(table, payload, { onConflict:'id' });
  }

  async function getSingleton(table, id, def){
    if(!hasClient()) return clone(def||{});
    var row=await selectOne(table, { eq:{ id:String(id) } });
    return row ? rowToJson(row) : clone(def||{});
  }

  async function saveSingleton(table, id, data, extra){
    return upsertJsonRow(table, id, data&&typeof data==='object'?data:{}, extra||{});
  }

  function makeJsonTable(table, opts){
    opts=opts||{};
    return {
      table:table,
      list:function(listOpts){ return listJsonRows(table, Object.assign({}, opts, listOpts||{})); },
      get:function(id, def){ return getSingleton(table, id, def); },
      upsert:function(id, data, extra){ return upsertJsonRow(table, id, data, extra); },
      remove:function(id){ return deleteById(table, id); },
      removeWhere:function(eq){ return deleteWhere(table, eq); }
    };
  }

  function makeSingleton(table, id, def){
    return {
      table:table,
      id:id,
      get:function(){ return getSingleton(table, id, def||{}); },
      save:function(data, extra){ return saveSingleton(table, id, data, extra||{}); }
    };
  }

  var tables={
    operationsAppointments:'operations_appointments',
    operationsMasterData:'operations_master_data',
    payrollEmployees:'payroll_employees',
    payrollSlips:'payroll_slips',
    payrollMasterData:'payroll_master_data',
    treasuryTransactions:'treasury_transactions',
    treasuryMasterData:'treasury_master_data',
    warehouseItems:'warehouse_items',
    warehouseTransactions:'warehouse_transactions',
    warehouseSettings:'warehouse_settings',
    childrenExpenses:'children_expenses',
    childrenBudgets:'children_expense_budgets',
    childrenMasterData:'children_master_data'
  };

  var operations={
    appointments:makeJsonTable(tables.operationsAppointments, { order:'created_at' }),
    master:makeSingleton(tables.operationsMasterData, 'operations_master', {}),
    listAppointments:function(){ return listJsonRows(tables.operationsAppointments, { order:'created_at' }); },
    saveAppointment:function(app){
      app=app&&typeof app==='object'?app:{};
      var uid=String(app.appointment_uid||app.uid||app.id||'');
      if(!uid) uid='op-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      var extra={
        appointment_uid:uid,
        status:str(app.status||app.state||''),
        appointment_date:app.date||app.appointment_date||null,
        vehicle:str(app.vehicle||app.vehicleName||''),
        customer_name:str(app.customerName||app.customer_name||app.clientName||''),
        customer_phone:str(app.customerPhone||app.customer_phone||app.phone||''),
        total_amount:Number(app.totalAmount||app.total||0)||0,
        paid_amount:Number(app.paidAmount||app.paid||0)||0,
        remaining_amount:Number(app.remainingAmount||app.remaining||0)||0
      };
      app.appointment_uid=uid;
      app.id=app.id||uid;
      return upsertJsonRow(tables.operationsAppointments, uid, app, extra);
    },
    removeAppointment:function(uid){ return deleteWhere(tables.operationsAppointments, { appointment_uid:String(uid) }); },
    getMaster:function(){ return getSingleton(tables.operationsMasterData, 'operations_master', {}); },
    saveMaster:function(data){ return saveSingleton(tables.operationsMasterData, 'operations_master', data||{}); }
  };

  var payroll={
    employees:makeJsonTable(tables.payrollEmployees, { order:'created_at' }),
    slips:makeJsonTable(tables.payrollSlips, { order:'created_at' }),
    master:makeSingleton(tables.payrollMasterData, 'payroll_master', {}),
    listEmployees:function(){ return listJsonRows(tables.payrollEmployees, { order:'created_at' }); },
    saveEmployee:function(emp){
      emp=emp&&typeof emp==='object'?emp:{};
      var id=String(emp.id||emp.code||'');
      if(!id) id='emp-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      emp.id=emp.id||id;
      return upsertJsonRow(tables.payrollEmployees, id, emp, { code:str(emp.code||''), name:str(emp.name||emp.fullName||''), job:str(emp.job||''), status:str(emp.status||'active') });
    },
    removeEmployee:function(id){ return deleteById(tables.payrollEmployees, id); },
    listSlips:function(){ return listJsonRows(tables.payrollSlips, { order:'created_at' }); },
    saveSlip:function(slip, extra){
      slip=slip&&typeof slip==='object'?slip:{};
      var id=String(slip.id||'');
      if(!id) id='slip-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      slip.id=slip.id||id;
      return upsertJsonRow(tables.payrollSlips, id, slip, Object.assign({ employee_id:str(slip.employeeId||slip.employee_id||''), period:str(slip.period||''), status:str(slip.status||''), net_amount:Number(slip.netAmount||slip.net||0)||0 }, extra||{}));
    },
    removeSlip:function(id){ return deleteById(tables.payrollSlips, id); },
    getMaster:function(){ return getSingleton(tables.payrollMasterData, 'payroll_master', {}); },
    saveMaster:function(data){ return saveSingleton(tables.payrollMasterData, 'payroll_master', data||{}); }
  };

  var treasury={
    transactions:makeJsonTable(tables.treasuryTransactions, { order:'created_at' }),
    master:makeSingleton(tables.treasuryMasterData, 'treasury_master', {}),
    listTransactions:function(){ return listJsonRows(tables.treasuryTransactions, { order:'created_at' }); },
    saveTransaction:function(tx){
      tx=tx&&typeof tx==='object'?tx:{};
      var id=String(tx.id||'');
      if(!id) id='trs-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      tx.id=tx.id||id;
      return upsertJsonRow(tables.treasuryTransactions, id, tx, { type:str(tx.type||''), tx_date:tx.date||tx.tx_date||null, amount:Number(tx.amount||0)||0, category:str(tx.category||'') });
    },
    removeTransaction:function(id){ return deleteById(tables.treasuryTransactions, id); },
    getMaster:function(){ return getSingleton(tables.treasuryMasterData, 'treasury_master', {}); },
    saveMaster:function(data){ return saveSingleton(tables.treasuryMasterData, 'treasury_master', data||{}); }
  };

  var warehouse={
    items:makeJsonTable(tables.warehouseItems, { order:'created_at' }),
    transactions:makeJsonTable(tables.warehouseTransactions, { order:'created_at' }),
    settings:makeSingleton(tables.warehouseSettings, 'warehouse_settings', {}),
    saveItem:function(item){
      item=item&&typeof item==='object'?item:{};
      var id=String(item.id||item.code||'');
      if(!id) id='whi-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      item.id=item.id||id;
      return upsertJsonRow(tables.warehouseItems, id, item, { code:str(item.code||''), name:str(item.name||item.itemName||''), status:str(item.status||'active') });
    },
    removeItem:function(id){ return deleteById(tables.warehouseItems, id); },
    saveTransaction:function(tx){
      tx=tx&&typeof tx==='object'?tx:{};
      var id=String(tx.id||'');
      if(!id) id='wht-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      tx.id=tx.id||id;
      return upsertJsonRow(tables.warehouseTransactions, id, tx, { item_id:str(tx.itemId||tx.item_id||''), tx_type:str(tx.type||tx.tx_type||''), quantity:Number(tx.qty||tx.quantity||0)||0 });
    },
    removeTransaction:function(id){ return deleteById(tables.warehouseTransactions, id); }
  };

  var childrenExpenses={
    expenses:makeJsonTable(tables.childrenExpenses, { order:'created_at' }),
    budgets:makeJsonTable(tables.childrenBudgets, { order:'created_at' }),
    master:makeSingleton(tables.childrenMasterData, 'children_master', {}),
    saveExpense:function(exp){
      exp=exp&&typeof exp==='object'?exp:{};
      var id=String(exp.id||'');
      if(!id) id='che-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      exp.id=exp.id||id;
      return upsertJsonRow(tables.childrenExpenses, id, exp, { expense_date:exp.date||exp.expense_date||null, amount:Number(exp.amount||0)||0, child_name:str(exp.childName||exp.child_name||''), category:str(exp.category||'') });
    },
    removeExpense:function(id){ return deleteById(tables.childrenExpenses, id); },
    saveBudget:function(budget){
      budget=budget&&typeof budget==='object'?budget:{};
      var id=String(budget.id||budget.period||'');
      if(!id) id='chb-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      budget.id=budget.id||id;
      return upsertJsonRow(tables.childrenBudgets, id, budget, { period:str(budget.period||''), amount:Number(budget.amount||0)||0 });
    },
    removeBudget:function(id){ return deleteById(tables.childrenBudgets, id); }
  };

  window.PETATOESupabaseRepository={
    version:VERSION,
    tables:tables,
    hasClient:hasClient,
    selectRows:selectRows,
    selectOne:selectOne,
    insertRow:insertRow,
    upsertRow:upsertRow,
    updateWhere:updateWhere,
    deleteWhere:deleteWhere,
    deleteById:deleteById,
    listJsonRows:listJsonRows,
    upsertJsonRow:upsertJsonRow,
    getSingleton:getSingleton,
    saveSingleton:saveSingleton,
    makeJsonTable:makeJsonTable,
    makeSingleton:makeSingleton,
    operations:operations,
    payroll:payroll,
    treasury:treasury,
    warehouse:warehouse,
    childrenExpenses:childrenExpenses,
    __ready:true,
    __enterpriseReady:true
  };

  console.log('✅ PETATOE Enterprise Supabase Repository loaded');
})(window);
