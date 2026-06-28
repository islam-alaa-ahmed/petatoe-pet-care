/* PETATOE v6.2.25 Phase 7D-SAFE
 * Warehouse Computed Read Facade
 * Scope:
 * - Read-only computed warehouse data only.
 * - No writes.
 * - No boot hooks.
 * - No event listeners.
 * - Does not modify warehouse-core.js contracts.
 *
 * Purpose:
 * - Prepare safe extraction by mirroring balance calculations in a shadow/read-only layer.
 * - Expose manual APIs for future parity checks before moving render/report code.
 */
(function(){
  'use strict';
  if (window.__PETATOE_WAREHOUSE_COMPUTED_FACADE_BOUND__) return;
  window.__PETATOE_WAREHOUSE_COMPUTED_FACADE_BOUND__ = true;

  var MAIN_STORE = 'المخزن الرئيسي';

  function warn(e){
    try{
      if (window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function') {
        window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-computed-facade.js', e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-computed-facade.js::warn-fallback', _e);
      }
    }
  }

  function num(v){
    var n = parseFloat(String(v == null ? '' : v).replace(/,/g, ''));
    return isFinite(n) ? n : 0;
  }

  function text(v){
    return String(v == null ? '' : v).trim();
  }

  function lower(v){
    return text(v).toLowerCase();
  }

  function getReadFacade(){
    return window.PETATOEWarehouseReadFacade || null;
  }

  function getSnapshot(){
    try{
      var facade = getReadFacade();
      if (facade && typeof facade.getSnapshot === 'function') {
        var snapshot = facade.getSnapshot();
        return snapshot && typeof snapshot === 'object' ? snapshot : {};
      }
    }catch(e){warn(e);}
    return {};
  }

  function getItems(){
    var snapshot = getSnapshot();
    return Array.isArray(snapshot.items) ? snapshot.items.slice() : [];
  }

  function getTransactions(){
    var snapshot = getSnapshot();
    return Array.isArray(snapshot.transactions) ? snapshot.transactions.slice() : [];
  }

  function getStores(){
    var snapshot = getSnapshot();
    if (Array.isArray(snapshot.stores) && snapshot.stores.length) return snapshot.stores.slice();
    return [MAIN_STORE, 'VAN A - AXB 2558', 'VAN B - SXB 6066'];
  }

  function getItemName(row){
    return text(row && (row.name || row.item || row.itemName || row.product || row.description));
  }

  function itemType(name){
    var n = lower(name);
    if (!n) return 'stock';
    var found = getItems().filter(function(x){ return lower(getItemName(x)) === n; })[0];
    return found ? text(found.type || 'stock') : 'stock';
  }

  function isActiveStockItem(item){
    if (!item) return false;
    var type = text(item.type || 'stock') || 'stock';
    var status = text(item.status || 'active') || 'active';
    return type === 'stock' && status !== 'inactive' && !!getItemName(item);
  }

  function getStockItemNames(){
    var map = {};
    getItems().forEach(function(item){
      if (isActiveStockItem(item)) map[getItemName(item)] = 1;
    });
    getTransactions().forEach(function(t){
      var item = text(t && t.item);
      if (item && itemType(item) === 'stock') map[item] = 1;
    });
    return Object.keys(map).filter(Boolean).sort();
  }

  function normalizeMovementType(type){
    return lower(type || 'in');
  }

  function toSignedRows(){
    var rows = [];
    getTransactions().forEach(function(t){
      if (!t || typeof t !== 'object') return;
      var type = normalizeMovementType(t.type);
      var item = text(t.item);
      var qty = num(t.qty || t.quantity || t.amount);
      var from = text(t.from || t.source || t.fromStore || MAIN_STORE) || MAIN_STORE;
      var to = text(t.to || t.target || t.toStore || MAIN_STORE) || MAIN_STORE;
      var base = {
        id: t.id || '',
        type: type,
        item: item,
        qty: qty,
        time: t.time || t.date || '',
        person: t.person || t.employee || '',
        ref: t.ref || t.reference || '',
        notes: t.notes || ''
      };
      if (!item || qty <= 0 || itemType(item) !== 'stock') return;

      if (type === 'in' || type === 'adjust_plus') {
        rows.push(Object.assign({}, base, {store: to || MAIN_STORE, from: from, to: to || MAIN_STORE, inQty: qty, outQty: 0}));
        return;
      }
      if (type === 'transfer') {
        rows.push(Object.assign({}, base, {store: from, from: from, to: to, inQty: 0, outQty: qty}));
        rows.push(Object.assign({}, base, {store: to, from: from, to: to, inQty: qty, outQty: 0}));
        return;
      }
      if (type === 'return') {
        rows.push(Object.assign({}, base, {store: from, from: from, to: to || MAIN_STORE, inQty: 0, outQty: qty}));
        rows.push(Object.assign({}, base, {store: to || MAIN_STORE, from: from, to: to || MAIN_STORE, inQty: qty, outQty: 0}));
        return;
      }
      if (type === 'adjust_minus' || type === 'out') {
        rows.push(Object.assign({}, base, {store: from, from: from, to: to, inQty: 0, outQty: qty}));
      }
    });
    return rows;
  }

  function getStockRows(){
    var map = {};
    getStores().forEach(function(store){
      getStockItemNames().forEach(function(item){
        map[store + '||' + item] = {store: store, item: item, balance: 0, last: ''};
      });
    });
    toSignedRows().forEach(function(row){
      var key = row.store + '||' + row.item;
      if (!map[key]) map[key] = {store: row.store, item: row.item, balance: 0, last: ''};
      map[key].balance += num(row.inQty) - num(row.outQty);
      if (row.time) map[key].last = row.time;
    });
    return Object.keys(map).map(function(key){
      var row = map[key];
      if (Math.abs(row.balance) < 0.000001) row.balance = 0;
      return row;
    });
  }

  function getBalance(store, item){
    var targetStore = text(store);
    var targetItem = text(item);
    return getStockRows().filter(function(row){
      return (!targetStore || row.store === targetStore) && (!targetItem || row.item === targetItem);
    }).reduce(function(sum, row){ return sum + num(row.balance); }, 0);
  }

  function getSummary(){
    var rows = getStockRows();
    var mainQty = rows.filter(function(r){ return r.store === MAIN_STORE; }).reduce(function(s,r){ return s + Math.max(0, num(r.balance)); }, 0);
    var vansQty = rows.filter(function(r){ return r.store !== MAIN_STORE; }).reduce(function(s,r){ return s + Math.max(0, num(r.balance)); }, 0);
    return Object.freeze({
      items: getStockItemNames().length,
      transactions: getTransactions().length,
      stockRows: rows.length,
      mainPositiveQty: mainQty,
      vansPositiveQty: vansQty,
      stores: getStores().length
    });
  }

  function runReadinessCheck(){
    return Object.freeze({
      version: 'v6.2.25-phase7d-safe-computed-read-facade',
      mode: 'manual-read-only',
      readFacadeReady: !!(getReadFacade() && typeof getReadFacade().isReady === 'function' && getReadFacade().isReady()),
      summary: getSummary()
    });
  }

  var api = {
    version: 'v6.2.25-phase7d-safe-computed-read-facade',
    mode: 'read-only-computed',
    getItems: getItems,
    getTransactions: getTransactions,
    getStores: getStores,
    getStockItemNames: getStockItemNames,
    getSignedRows: toSignedRows,
    getStockRows: getStockRows,
    getBalance: getBalance,
    getSummary: getSummary,
    runReadinessCheck: runReadinessCheck
  };

  try{ Object.freeze(api); }catch(e){warn(e);}
  window.PETATOEWarehouseComputedFacade = window.PETATOEWarehouseComputedFacade || api;
})();
