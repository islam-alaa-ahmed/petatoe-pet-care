/* PETATOE v8.0.2 — Data Layer Skeleton
   Phase DL-1: Supabase-ready data access layer.
   IMPORTANT: This file does NOT migrate LocalStorage data and does NOT run any automatic writes. */
(function(){
  'use strict';

  var PHASE = 'DATA_LAYER_SKELETON_ONLY';
  var DEFAULT_LIMIT = 1000;

  function getClient(){
    return window.PETATOE_SUPABASE_CLIENT || window.supabase || null;
  }

  function ok(data, meta){
    return Object.assign({ ok:true, data:data, error:null }, meta || {});
  }

  function fail(message, details){
    var error = { message:String(message || 'PETATOE DataLayer error'), details:details || null };
    return { ok:false, data:null, error:error };
  }

  function unwrap(result){
    if(!result) return fail('Empty Supabase response');
    if(result.error) return { ok:false, data:null, error:result.error, status:result.status || 0, count:result.count == null ? null : result.count };
    return { ok:true, data:result.data, error:null, status:result.status || 0, count:result.count == null ? null : result.count };
  }

  function ensureClient(){
    var client = getClient();
    if(!client || typeof client.from !== 'function'){
      return { client:null, error:fail('Supabase client is not ready. Make sure supabase-client.js is loaded before data-layer.js') };
    }
    return { client:client, error:null };
  }

  function normalizeRows(rows){
    if(rows == null) return [];
    return Array.isArray(rows) ? rows : [rows];
  }

  async function read(table, options){
    options = options || {};
    var ready = ensureClient();
    if(ready.error) return ready.error;
    try{
      var q = ready.client.from(table).select(options.columns || '*');
      if(options.eq && typeof options.eq === 'object'){
        Object.keys(options.eq).forEach(function(k){ q = q.eq(k, options.eq[k]); });
      }
      if(options.order){ q = q.order(options.order.column || options.order, { ascending: options.order.ascending !== false }); }
      if(options.limit !== false){ q = q.limit(options.limit || DEFAULT_LIMIT); }
      return unwrap(await q);
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }

  async function count(table){
    var ready = ensureClient();
    if(ready.error) return ready.error;
    try{
      return unwrap(await ready.client.from(table).select('*', { count:'exact', head:true }));
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }

  async function insert(table, rows, options){
    options = options || {};
    var ready = ensureClient();
    if(ready.error) return ready.error;
    try{
      var payload = normalizeRows(rows);
      if(!payload.length) return ok([], { inserted:0, table:table });
      var res = await ready.client.from(table).insert(payload, options);
      var out = unwrap(res);
      if(out.ok) out.inserted = Array.isArray(out.data) ? out.data.length : payload.length;
      out.table = table;
      return out;
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }

  async function upsert(table, rows, options){
    options = options || {};
    var ready = ensureClient();
    if(ready.error) return ready.error;
    try{
      var payload = normalizeRows(rows);
      if(!payload.length) return ok([], { upserted:0, table:table });
      var res = await ready.client.from(table).upsert(payload, options);
      var out = unwrap(res);
      if(out.ok) out.upserted = Array.isArray(out.data) ? out.data.length : payload.length;
      out.table = table;
      return out;
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }

  async function update(table, values, filters){
    filters = filters || {};
    var ready = ensureClient();
    if(ready.error) return ready.error;
    try{
      var q = ready.client.from(table).update(values || {});
      Object.keys(filters).forEach(function(k){ q = q.eq(k, filters[k]); });
      return unwrap(await q);
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }

  async function remove(table, filters){
    filters = filters || {};
    var ready = ensureClient();
    if(ready.error) return ready.error;
    try{
      var q = ready.client.from(table).delete();
      Object.keys(filters).forEach(function(k){ q = q.eq(k, filters[k]); });
      return unwrap(await q);
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }

  async function health(){
    var ready = ensureClient();
    if(ready.error) return ready.error;
    var roles = await read('roles', { columns:'code', limit:1 });
    var sales = await count('sales_records');
    return {
      ok: !!roles.ok && !!sales.ok,
      phase: PHASE,
      clientReady: true,
      roles: roles,
      sales_records: sales,
      migrationEnabled: false,
      localStorageMigrationEnabled: false
    };
  }

  var api = {
    __phase: PHASE,
    __noLocalStorageMigration: true,
    __writeOnlyWhenCalled: true,
    getClient: getClient,
    read: read,
    count: count,
    insert: insert,
    upsert: upsert,
    update: update,
    remove: remove,
    health: health,
    tables: {
      users: 'app_users',
      roles: 'roles',
      customers: 'customers',
      pets: 'pets',
      services: 'services',
      vehicles: 'vehicles',
      appointments: 'appointments',
      sales: 'sales_records',
      warehouseItems: 'warehouse_items',
      warehouseTransactions: 'warehouse_transactions',
      treasuryTransactions: 'treasury_transactions',
      payrollEmployees: 'payroll_employees',
      payrollSlips: 'payroll_slips',
      settings: 'system_settings',
      auditLogs: 'audit_logs'
    }
  };

  window.PETATOEDataLayer = api;
  window.petatoeDataLayerHealth = health;
  console.log('✅ PETATOE Data Layer loaded — skeleton only, no LocalStorage migration, no automatic writes');
})();
