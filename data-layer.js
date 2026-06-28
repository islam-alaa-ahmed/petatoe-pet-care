/* PETATOE v8.0.2 — Data Layer Skeleton
   Phase DL-2: Supabase-ready data access layer + official Excel insert support.
   IMPORTANT: This file does NOT migrate LocalStorage data and does NOT run any automatic writes.
   Writes happen only when PETATOEDataLayer.insertSalesRecords(...) is called by the import engine. */
(function(){
  'use strict';

  var PHASE = 'DATA_LAYER_SUPABASE_IMPORT_READY';
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


  function asText(v){ return String(v == null ? '' : v).trim(); }
  function asNumber(v){
    if(typeof v === 'number') return isFinite(v) ? v : 0;
    var raw = String(v == null ? '' : v)
      .replace(/[٠-٩]/g, function(d){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/[۰-۹]/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .replace(/SAR|ريال|ر\.س/ig, '')
      .replace(/,/g, '')
      .replace(/\s+/g, '')
      .replace(/[^0-9.\-]/g, '');
    var n = parseFloat(raw);
    return isFinite(n) ? Math.round(n * 1000) / 1000 : 0;
  }
  function pad2(n){ return String(n).padStart(2, '0'); }
  function asDate(v){
    if(!v) return null;
    if(v instanceof Date && !isNaN(v)) return v.getFullYear() + '-' + pad2(v.getMonth()+1) + '-' + pad2(v.getDate());
    var s = asText(v);
    if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)){
      var a = s.split('-');
      return a[0] + '-' + pad2(a[1]) + '-' + pad2(a[2]);
    }
    if(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(s)){
      var b = s.split(/[\/\-]/);
      return b[2] + '-' + pad2(b[1]) + '-' + pad2(b[0]);
    }
    var d = new Date(s);
    if(!isNaN(d)) return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
    return null;
  }
  function detectInvoiceTypeForSales(r){
    var txt = (asText(r.invoice) + ' ' + asText(r.client) + ' ' + asText(r.payment_method || r.pay)).toLowerCase();
    if((txt.indexOf('cash') >= 0 || txt.indexOf('كاش') >= 0 || txt.indexOf('نقد') >= 0) && !asNumber(r.tax)) return 'CASH';
    return r.invoiceType || r.invoice_type || 'TAX';
  }
  function mapSalesRecordForSupabase(r, index){
    r = r || {};
    var invoice = asText(r.invoice || r.invoice_no || r.invoiceNo || r.billNo || r.number);
    var item = asText(r.item || r.item_name || r.service || r.name || r.product);
    var vehicle = asText(r.van || r.vehicle_name || r.vehicle || r.car || r.carName || r.vehicleName);
    var client = asText(r.client || r.client_name || r.customer || r.customerName);
    var totalInc = asNumber(r.totalInc || r.total_inc || r.total || r.gross || r.amount);
    var totalEx = asNumber(r.totalEx || r.total_ex || r.net || (totalInc ? totalInc - asNumber(r.tax) : 0));
    var tax = asNumber(r.tax);
    var payload = {
      legacy_id: asText(r.id || r.legacy_id || ('petatoe_' + Date.now() + '_' + index)),
      invoice_no: invoice,
      invoice_date: asDate(r.date || r.invoice_date || r.invoiceDate || r.createdAt),
      client_name: client,
      item_name: item,
      vehicle_name: vehicle,
      payment_method: asText(r.pay || r.payment_method || r.payment || r.paymentMethod || r.paymentType),
      qty: asNumber(r.qty || r.quantity),
      price: asNumber(r.price || r.unit_price || r.unitPrice),
      discount: asNumber(r.disc || r.discount),
      tax: tax,
      total_ex: totalEx,
      total_inc: totalInc,
      invoice_type: detectInvoiceTypeForSales(r),
      legacy_payload: Object.assign({}, r, {
        petatoe_source: 'excel_import',
        petatoe_mapped_at: new Date().toISOString()
      })
    };
    return payload;
  }
  function mapSalesRecordFromSupabase(r){
    r = r || {};
    return {
      id: r.legacy_id || r.id,
      invoice: r.invoice_no || '',
      date: r.invoice_date || '',
      client: r.client_name || '',
      item: r.item_name || '',
      van: r.vehicle_name || '',
      pay: r.payment_method || '',
      qty: asNumber(r.qty),
      price: asNumber(r.price),
      disc: asNumber(r.discount),
      tax: asNumber(r.tax),
      totalEx: asNumber(r.total_ex),
      totalInc: asNumber(r.total_inc),
      invoiceType: r.invoice_type || '',
      supabase_id: r.id,
      source: 'supabase'
    };
  }
  async function insertSalesRecords(rows, options){
    options = options || {};
    var payload = normalizeRows(rows).map(mapSalesRecordForSupabase).filter(function(r){
      return r.invoice_no || r.item_name || r.client_name || r.total_inc || r.total_ex;
    });
    if(!payload.length) return ok([], { table:'sales_records', inserted:0, source:'sales_import', warning:'NO_VALID_ROWS' });
    var chunkSize = options.chunkSize || 500;
    var inserted = 0;
    var batches = [];
    for(var i=0;i<payload.length;i+=chunkSize){
      var part = payload.slice(i, i + chunkSize);
      var res = await insert('sales_records', part, { count:'exact' });
      batches.push(res);
      if(!res.ok){
        return { ok:false, data:null, error:res.error, table:'sales_records', inserted:inserted, failedBatch:batches.length, batches:batches };
      }
      inserted += part.length;
    }
    return ok({ rows:inserted }, { table:'sales_records', inserted:inserted, batches:batches.length, source:'sales_import', replaceRequested:!!options.replace });
  }
  async function readSalesRecords(options){
    options = options || {};
    var res = await read('sales_records', {
      columns: options.columns || '*',
      limit: options.limit || 10000,
      order: options.order || { column:'invoice_date', ascending:true }
    });
    if(!res.ok) return res;
    var rows = (res.data || []).map(mapSalesRecordFromSupabase);
    return ok(rows, { table:'sales_records', rows:rows.length, count:res.count });
  }

  async function select(table, options){
    return read(table, options || {});
  }

  function getLastCommit(){
    try{ return window.__PETATOE_LAST_IMPORT_COMMIT__ || null; }catch(_e){ return null; }
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
      insertReady: true,
      roles: roles,
      sales_records: sales,
      migrationEnabled: false,
      localStorageMigrationEnabled: false
    };
  }

  var api = {
    __phase: PHASE,
    __noLocalStorageMigration: true,
    __officialExcelImportReady: true,
    __writeOnlyWhenCalled: true,
    getClient: getClient,
    read: read,
    select: select,
    count: count,
    insert: insert,
    upsert: upsert,
    update: update,
    remove: remove,
    insertSalesRecords: insertSalesRecords,
    readSalesRecords: readSalesRecords,
    getLastCommit: getLastCommit,
    mapSalesRecordForSupabase: mapSalesRecordForSupabase,
    mapSalesRecordFromSupabase: mapSalesRecordFromSupabase,
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
  console.log('✅ PETATOE Data Layer loaded — SALES_UNIFICATION_PHASE1 ready, no LocalStorage migration');
})();
