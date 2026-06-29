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

  function applyOrder(q, order){
    if(!order) return q;
    if(Array.isArray(order)){
      if(typeof q.order === 'function') return q.order(order);
      return q;
    }
    if(typeof order === 'string'){
      return typeof q.order === 'function' ? q.order(order) : q;
    }
    if(order && typeof order === 'object'){
      return typeof q.order === 'function' ? q.order(order.column || order.name || order, { ascending: order.ascending !== false }) : q;
    }
    return q;
  }

  var SALES_STABLE_ORDER = [
    { column:'invoice_date', ascending:true },
    { column:'invoice_no', ascending:true },
    { column:'client_name', ascending:true },
    { column:'item_name', ascending:true },
    { column:'price', ascending:true },
    { column:'total_inc', ascending:true },
    { column:'id', ascending:true }
  ];

  function normalizeReadAllRows(rows, table){
    rows = Array.isArray(rows) ? rows : [];
    // Defensive de-duplication by Supabase UUID prevents unstable page-boundary duplicates
    // if a browser serves an older client while the new stable order is loading.
    if(table !== 'sales_records') return rows;
    var seen = {};
    return rows.filter(function(r){
      var k = asText(r && r.id);
      if(!k) return true;
      if(seen[k]) return false;
      seen[k] = true;
      return true;
    });
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
      q = applyOrder(q, options.order);
      if(options.limit !== false){ q = q.limit(options.limit || DEFAULT_LIMIT); }
      return unwrap(await q);
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }


  async function readAll(table, options){
    options = options || {};
    var ready = ensureClient();
    if(ready.error) return ready.error;
    var pageSize = Math.max(1, Math.min(Number(options.pageSize || 1000) || 1000, 1000));
    var maxRows = options.maxRows === false ? Infinity : (Number(options.maxRows || 0) || Infinity);
    var offset = Math.max(0, Number(options.offset || 0) || 0);
    var all = [];
    var pages = 0;
    try{
      while(all.length < maxRows){
        var from = offset + all.length;
        var to = from + Math.min(pageSize, maxRows - all.length) - 1;
        var q = ready.client.from(table).select(options.columns || '*');
        if(options.eq && typeof options.eq === 'object'){
          Object.keys(options.eq).forEach(function(k){ q = q.eq(k, options.eq[k]); });
        }
        q = applyOrder(q, options.order);
        if(typeof q.range === 'function') q = q.range(from, to);
        else { q = q.limit(pageSize); if(typeof q.offset === 'function') q = q.offset(from); }
        var res = unwrap(await q);
        pages++;
        if(!res.ok) return res;
        var rows = Array.isArray(res.data) ? res.data : [];
        all = all.concat(rows);
        if(rows.length < pageSize) break;
      }
      all = normalizeReadAllRows(all, table);
      return ok(all, { table:table, rows:all.length, pages:pages, pageSize:pageSize, stableOrder: options.order || null });
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
    // PETATOE v8.0.2 hotfix: the database total_inc is the canonical sales total.
    // Do not let legacy camelCase/cached payload values override it in dashboard/report totals.
    var canonicalTotalInc = asNumber(r.total_inc);
    var canonicalTotalEx = asNumber(r.total_ex);
    var canonicalTax = asNumber(r.tax);
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
      disc: Math.abs(asNumber(r.discount)),
      tax: canonicalTax,
      totalEx: canonicalTotalEx,
      totalInc: canonicalTotalInc,
      total_inc: canonicalTotalInc,
      total_ex: canonicalTotalEx,
      __canonicalTotalInc: canonicalTotalInc,
      __canonicalTotalEx: canonicalTotalEx,
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
    var replaceResult = null;
    if(options.replace){
      replaceResult = await deleteAllSalesRecords();
      if(!replaceResult || !replaceResult.ok){
        return {
          ok:false,
          data:null,
          error: replaceResult && replaceResult.error ? replaceResult.error : 'Failed to clear existing sales_records before replace import',
          table:'sales_records',
          inserted:0,
          replaceRequested:true,
          replaceDeleteResult: replaceResult
        };
      }
    }
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
    return ok({ rows:inserted }, { table:'sales_records', inserted:inserted, batches:batches.length, source:'sales_import', replaceRequested:!!options.replace, replaceDeleteResult:replaceResult });
  }
  async function readSalesRecords(options){
    options = options || {};
    var res = await readAll('sales_records', {
      columns: options.columns || '*',
      pageSize: options.pageSize || 1000,
      maxRows: options.maxRows === undefined ? false : options.maxRows,
      order: options.order || SALES_STABLE_ORDER
    });
    if(!res.ok) return res;
    var rows = (res.data || []).map(mapSalesRecordFromSupabase);
    return ok(rows, { table:'sales_records', rows:rows.length, pages:res.pages, pageSize:res.pageSize });
  }

  function salesRecordFilters(recordOrId){
    var rec = (recordOrId && typeof recordOrId === 'object') ? recordOrId : { id: recordOrId };
    var id = asText(rec.supabase_id || rec.id);
    var legacy = asText(rec.legacy_id || rec.legacyId || rec.id);
    if(rec.supabase_id) return { id: rec.supabase_id };
    if(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { id: id };
    if(legacy) return { legacy_id: legacy };
    return null;
  }

  async function deleteSalesRecord(recordOrId){
    var filters = salesRecordFilters(recordOrId);
    if(!filters) return fail('Cannot delete sales record: no Supabase id or legacy_id was found', recordOrId);
    var res = await remove('sales_records', filters);
    if(res && res.ok) res.deleted = Array.isArray(res.data) ? res.data.length : null;
    return res;
  }

  async function deleteSalesInvoice(invoiceNo){
    invoiceNo = asText(invoiceNo);
    if(!invoiceNo) return fail('Cannot delete sales invoice: invoice number is empty');
    var res = await remove('sales_records', { invoice_no: invoiceNo });
    if(res && res.ok) res.deleted = Array.isArray(res.data) ? res.data.length : null;
    return res;
  }

  async function deleteAllSalesRecords(){
    var ready = ensureClient();
    if(ready.error) return ready.error;
    try{
      var res;
      if(ready.client.from('sales_records').not){
        res = await ready.client.from('sales_records').delete().not('id','is',null);
      }else{
        res = await ready.client.from('sales_records').delete().neq('invoice_no','__PETATOE_NEVER_MATCH__');
      }
      var out = unwrap(res);
      if(out && out.ok) out.deleted = Array.isArray(out.data) ? out.data.length : null;
      return out;
    }catch(error){
      return fail(error && error.message ? error.message : String(error), error);
    }
  }

  async function updateSalesRecord(recordOrId, values){
    var filters = salesRecordFilters(recordOrId);
    if(!filters) return fail('Cannot update sales record: no Supabase id or legacy_id was found', recordOrId);
    var payload = mapSalesRecordForSupabase(values || recordOrId || {}, 0);
    delete payload.legacy_payload;
    Object.keys(payload).forEach(function(k){ if(payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k]; });
    return update('sales_records', payload, filters);
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
    readAll: readAll,
    select: select,
    count: count,
    insert: insert,
    upsert: upsert,
    update: update,
    remove: remove,
    insertSalesRecords: insertSalesRecords,
    readSalesRecords: readSalesRecords,
    deleteSalesRecord: deleteSalesRecord,
    deleteSalesInvoice: deleteSalesInvoice,
    deleteAllSalesRecords: deleteAllSalesRecords,
    updateSalesRecord: updateSalesRecord,
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
  console.log('✅ PETATOE Data Layer loaded — SALES_STABLE_PAGINATION_FIX ready, no LocalStorage migration');
})();
