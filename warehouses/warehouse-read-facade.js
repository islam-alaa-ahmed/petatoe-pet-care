/* PETATOE v8.0.2 — Warehouse Supabase Read Facade
 * Read-only facade for warehouse data loaded from Supabase.
 * No LocalStorage fallback, no migration, no writes.
 */
(function(){
  'use strict';
  if (window.__PETATOE_WAREHOUSE_READ_FACADE_BOUND__) return;
  window.__PETATOE_WAREHOUSE_READ_FACADE_BOUND__ = true;

  var STORES = Object.freeze(['المخزن الرئيسي','VAN A - AXB 2558','VAN B - SXB 6066']);
  var KEYS = Object.freeze({
    items: 'warehouse_items',
    transactions: 'warehouse_transactions',
    lowLimit: 'warehouse_settings.lowLimit'
  });

  function warn(e){
    try{
      if (window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function') {
        window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-read-facade.js', e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-read-facade.js::warn-fallback', _e);
      }
    }
  }

  function cloneArray(value){
    try{
      if (!Array.isArray(value)) return [];
      return value.map(function(row){
        if (row && typeof row === 'object') return JSON.parse(JSON.stringify(row));
        return row;
      });
    }catch(e){warn(e); return [];}
  }

  function store(){ return window.PETATOEWarehouseDataStore || null; }

  function getItems(){
    try{ var s=store(); return cloneArray(s && typeof s.getItems === 'function' ? s.getItems() : []); }
    catch(e){ warn(e); return []; }
  }

  function getTransactions(){
    try{ var s=store(); return cloneArray(s && typeof s.getTransactions === 'function' ? s.getTransactions() : []); }
    catch(e){ warn(e); return []; }
  }

  function getLowLimit(){
    try{
      var s=store();
      var value=s && typeof s.getSetting === 'function' ? s.getSetting('lowLimit', 5) : 5;
      var n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
      return isFinite(n) ? n : 5;
    }catch(e){ warn(e); return 5; }
  }

  function getStores(){ return STORES.slice(); }

  function getSnapshot(){
    return Object.freeze({
      items: getItems(),
      transactions: getTransactions(),
      lowLimit: getLowLimit(),
      stores: getStores()
    });
  }

  function isReady(){
    try{ var s=store(); return !!(s && typeof s.isReady === 'function' && s.isReady()); }
    catch(e){ warn(e); return false; }
  }

  var facade = {
    version: 'v8.0.2-supabase-read-only',
    mode: 'supabase-read-only',
    keys: KEYS,
    isReady: isReady,
    getStores: getStores,
    getItems: getItems,
    getTransactions: getTransactions,
    getLowLimit: getLowLimit,
    getSnapshot: getSnapshot
  };

  try{ Object.freeze(facade); }catch(e){warn(e);}
  window.PETATOEWarehouseReadFacade = window.PETATOEWarehouseReadFacade || facade;
})();
