/* PETATOE v10.0.25 SR4 — Canonical Smart Reports data provider.
 * Single read/sync contract for Smart Reports. No calculations or Supabase
 * queries are changed; this layer only reconciles PETATOEDataSource with the
 * legacy records array consumed by existing report functions.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_DATA_PROVIDER_SR4__) return;
  window.__PETATOE_SMART_REPORTS_DATA_PROVIDER_SR4__ = true;

  var BUILD = '10.0.25-smart-reports-sr4-data-provider';
  var revision = 0;
  var lastReason = 'startup';
  var lastError = '';
  var syncPromise = null;

  function sourceRows(){
    try{
      var source = window.PETATOEDataSource;
      if(source && typeof source.getRecordsSync === 'function'){
        var rows = source.getRecordsSync();
        if(Array.isArray(rows)) return rows;
      }
    }catch(error){ lastError = String(error && error.message || error); }
    return [];
  }

  function legacyRows(){
    try{ return Array.isArray(window.records) ? window.records : []; }
    catch(_e){ return []; }
  }

  function getRows(){
    var rows = sourceRows();
    if(rows.length) return rows.slice();
    return legacyRows().slice();
  }

  function syncLegacy(reason){
    lastReason = String(reason || 'smart-reports-data-sync');
    try{
      if(typeof window.petatoeApplySalesRecordsFromRuntime === 'function'){
        var result = window.petatoeApplySalesRecordsFromRuntime(lastReason);
        if(result === false) return false;
      }else{
        var rows = sourceRows();
        if(rows.length) window.records = rows.slice();
      }
      revision += 1;
      lastError = '';
      return true;
    }catch(error){
      lastError = String(error && error.message || error);
      try{ console.error('[PETATOE Smart Data] legacy synchronization failed', error); }catch(_e){}
      return false;
    }
  }

  function refresh(reason){
    if(syncPromise) return syncPromise;
    lastReason = String(reason || 'smart-reports-refresh');
    syncPromise = Promise.resolve().then(function(){
      if(typeof window.petatoeSyncSalesReportsFromSupabase === 'function'){
        return window.petatoeSyncSalesReportsFromSupabase();
      }
      return true;
    }).then(function(){
      syncLegacy(lastReason + '-canonical-commit');
      return getRows();
    }).catch(function(error){
      lastError = String(error && error.message || error);
      throw error;
    }).finally(function(){ syncPromise = null; });
    return syncPromise;
  }

  function status(){
    return {
      __ready: true,
      version: BUILD,
      revision: revision,
      sourceRows: sourceRows().length,
      legacyRows: legacyRows().length,
      busy: !!syncPromise,
      lastReason: lastReason,
      lastError: lastError
    };
  }

  var api = Object.freeze({
    __ready: true,
    version: BUILD,
    getRows: getRows,
    syncLegacy: syncLegacy,
    refresh: refresh,
    getStatus: status
  });

  window.PETATOESmartReportsData = api;
  window.petatoeSmartReportsRows = getRows;

  window.addEventListener('petatoe:records-changed', function(event){
    var reason = event && event.detail && event.detail.reason || 'records-changed';
    syncLegacy(reason);
    try{
      window.dispatchEvent(new CustomEvent('petatoe:smart-reports-data-ready', {detail: status()}));
    }catch(_e){}
  });
})();
