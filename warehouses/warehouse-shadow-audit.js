/* PETATOE v6.2.24 Phase 7C-SAFE
 * Warehouse Shadow Audit
 * Scope:
 * - Optional diagnostic facade only.
 * - No boot hooks.
 * - No event listeners.
 * - No writes.
 * - Does not modify warehouse-core.js or storage data.
 * Usage from console only when needed:
 *   PETATOEWarehouseShadowAudit.run()
 */
(function(){
  'use strict';
  if (window.__PETATOE_WAREHOUSE_SHADOW_AUDIT_BOUND__) return;
  window.__PETATOE_WAREHOUSE_SHADOW_AUDIT_BOUND__ = true;

  function warn(e){
    try{
      if (window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function') {
        window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-shadow-audit.js', e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-shadow-audit.js::warn-fallback', _e);
      }
    }
  }

  function count(value){
    return Array.isArray(value) ? value.length : 0;
  }

  function safeCall(fn, fallback){
    try{
      if (typeof fn === 'function') {
        var value = fn();
        return value == null ? fallback : value;
      }
    }catch(e){warn(e);}
    return fallback;
  }

  function readStorageJSON(key, fallback){
    try{
      if (window.PETATOEStorage && typeof window.PETATOEStorage.readJSON === 'function') {
        var value = window.PETATOEStorage.readJSON(key, fallback);
        return value == null ? fallback : value;
      }
    }catch(e){warn(e);}
    return fallback;
  }

  function run(){
    var facade = window.PETATOEWarehouseReadFacade;
    var snapshot = facade && typeof facade.getSnapshot === 'function'
      ? safeCall(function(){ return facade.getSnapshot(); }, {})
      : {};

    var storageItems = readStorageJSON('warehouseItems', []);
    var storageTransactions = readStorageJSON('warehouseTransactions', []);
    var facadeItems = snapshot && snapshot.items ? snapshot.items : [];
    var facadeTransactions = snapshot && snapshot.transactions ? snapshot.transactions : [];

    return Object.freeze({
      version: 'v6.2.24-phase7c-safe-shadow-audit',
      mode: 'manual-read-only',
      facadeReady: !!(facade && typeof facade.isReady === 'function' && facade.isReady()),
      counts: Object.freeze({
        storageItems: count(storageItems),
        facadeItems: count(facadeItems),
        storageTransactions: count(storageTransactions),
        facadeTransactions: count(facadeTransactions)
      }),
      parity: Object.freeze({
        items: count(storageItems) === count(facadeItems),
        transactions: count(storageTransactions) === count(facadeTransactions)
      })
    });
  }

  var api = {
    version: 'v6.2.24-phase7c-safe-shadow-audit',
    mode: 'manual-read-only',
    run: run
  };
  try{ Object.freeze(api); }catch(e){warn(e);}
  window.PETATOEWarehouseShadowAudit = window.PETATOEWarehouseShadowAudit || api;
})();
