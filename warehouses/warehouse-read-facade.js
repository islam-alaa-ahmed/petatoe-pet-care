/* PETATOE v6.2.23 Phase 7B-SAFE
 * Warehouse Read-Only Facade
 * Scope:
 * - Read-only access only.
 * - No writes.
 * - No boot hooks.
 * - No event listeners.
 * - No mutation of warehouse-core.js contracts.
 */
(function(){
  'use strict';
  if (window.__PETATOE_WAREHOUSE_READ_FACADE_BOUND__) return;
  window.__PETATOE_WAREHOUSE_READ_FACADE_BOUND__ = true;

  var STORES = Object.freeze(['المخزن الرئيسي','VAN A - AXB 2558','VAN B - SXB 6066']);
  var KEYS = Object.freeze({
    items: 'warehouseItems',
    transactions: 'warehouseTransactions',
    lowLimit: 'warehouseLowLimit'
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
        if (row && typeof row === 'object') return Object.assign({}, row);
        return row;
      });
    }catch(e){warn(e); return [];}
  }

  function readJSON(logicalKey, fallback){
    try{
      if (window.PETATOEStorage && typeof window.PETATOEStorage.readJSON === 'function') {
        var value = window.PETATOEStorage.readJSON(logicalKey, fallback);
        return value == null ? fallback : value;
      }
    }catch(e){warn(e);}
    return fallback;
  }

  function readValue(logicalKey, fallback){
    try{
      if (window.PETATOEStorage && typeof window.PETATOEStorage.get === 'function') {
        var value = window.PETATOEStorage.get(logicalKey, fallback);
        return value == null ? fallback : value;
      }
    }catch(e){warn(e);}
    return fallback;
  }

  function getItems(){
    return cloneArray(readJSON(KEYS.items, []));
  }

  function getTransactions(){
    return cloneArray(readJSON(KEYS.transactions, []));
  }

  function getLowLimit(){
    var value = readValue(KEYS.lowLimit, 5);
    var n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
    return isFinite(n) ? n : 5;
  }

  function getStores(){
    return STORES.slice();
  }

  function getSnapshot(){
    return Object.freeze({
      items: getItems(),
      transactions: getTransactions(),
      lowLimit: getLowLimit(),
      stores: getStores()
    });
  }

  function isReady(){
    return !!(window.PETATOEStorage && typeof window.PETATOEStorage.readJSON === 'function');
  }

  var facade = {
    version: 'v6.2.23-phase7b-safe-read-only',
    mode: 'read-only',
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
