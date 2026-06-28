/* PETATOE v6.2.26 Phase 7E-SAFE
 * Warehouse View-Model Facade
 * Scope:
 * - Read-only view-model preparation only.
 * - No DOM writes.
 * - No event listeners.
 * - No boot hooks.
 * - No storage writes.
 * - Does not modify warehouse-core.js contracts.
 *
 * Purpose:
 * - Prepare future Warehouse render extraction safely by creating pure data models
 *   that can later feed render functions without touching the current UI path.
 */
(function(){
  'use strict';
  if (window.__PETATOE_WAREHOUSE_VIEW_MODEL_FACADE_BOUND__) return;
  window.__PETATOE_WAREHOUSE_VIEW_MODEL_FACADE_BOUND__ = true;

  function warn(e){
    try{
      if (window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function') {
        window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-view-model-facade.js', e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-view-model-facade.js::warn-fallback', _e);
      }
    }
  }

  function text(v){
    return String(v == null ? '' : v).trim();
  }

  function num(v){
    var n = parseFloat(String(v == null ? '' : v).replace(/,/g, ''));
    return isFinite(n) ? n : 0;
  }

  function fmtNumber(v){
    var n = num(v);
    try{ return n.toLocaleString('en-US', {maximumFractionDigits: 2}); }
    catch(e){ warn(e); return String(Math.round(n * 100) / 100); }
  }

  function getComputed(){
    return window.PETATOEWarehouseComputedFacade || null;
  }

  function safeArray(value){
    return Array.isArray(value) ? value.slice() : [];
  }

  function getSummaryCards(){
    try{
      var computed = getComputed();
      var summary = computed && typeof computed.getSummary === 'function' ? computed.getSummary() : {};
      return Object.freeze([
        Object.freeze({key: 'items', label: 'الأصناف المخزنية', value: fmtNumber(summary.items || 0)}),
        Object.freeze({key: 'transactions', label: 'الحركات المخزنية', value: fmtNumber(summary.transactions || 0)}),
        Object.freeze({key: 'stockRows', label: 'صفوف الأرصدة', value: fmtNumber(summary.stockRows || 0)}),
        Object.freeze({key: 'stores', label: 'المخازن', value: fmtNumber(summary.stores || 0)})
      ]);
    }catch(e){ warn(e); return Object.freeze([]); }
  }

  function getStockTableRows(limit){
    try{
      var computed = getComputed();
      var rows = computed && typeof computed.getStockRows === 'function' ? safeArray(computed.getStockRows()) : [];
      rows = rows.map(function(row){
        return Object.freeze({
          store: text(row && row.store),
          item: text(row && row.item),
          balance: num(row && row.balance),
          balanceText: fmtNumber(row && row.balance),
          last: text(row && row.last)
        });
      }).sort(function(a, b){
        return a.store.localeCompare(b.store) || a.item.localeCompare(b.item);
      });
      if (limit && limit > 0) rows = rows.slice(0, limit);
      return Object.freeze(rows);
    }catch(e){ warn(e); return Object.freeze([]); }
  }

  function getTransactionTableRows(limit){
    try{
      var computed = getComputed();
      var rows = computed && typeof computed.getSignedRows === 'function' ? safeArray(computed.getSignedRows()) : [];
      rows = rows.map(function(row){
        return Object.freeze({
          time: text(row && row.time),
          type: text(row && row.type),
          store: text(row && row.store),
          item: text(row && row.item),
          inQty: num(row && row.inQty),
          outQty: num(row && row.outQty),
          inQtyText: fmtNumber(row && row.inQty),
          outQtyText: fmtNumber(row && row.outQty),
          person: text(row && row.person),
          ref: text(row && row.ref)
        });
      });
      if (limit && limit > 0) rows = rows.slice(0, limit);
      return Object.freeze(rows);
    }catch(e){ warn(e); return Object.freeze([]); }
  }

  function getViewModel(options){
    options = options || {};
    return Object.freeze({
      version: 'v6.2.26-phase7e-safe-view-model-facade',
      mode: 'manual-read-only-view-model',
      summaryCards: getSummaryCards(),
      stockRows: getStockTableRows(options.stockLimit || 0),
      transactionRows: getTransactionTableRows(options.transactionLimit || 0)
    });
  }

  function runReadinessCheck(){
    var computed = getComputed();
    var vm = getViewModel({stockLimit: 5, transactionLimit: 5});
    return Object.freeze({
      version: 'v6.2.26-phase7e-safe-view-model-facade',
      mode: 'manual-read-only',
      computedReady: !!(computed && typeof computed.getSummary === 'function'),
      counts: Object.freeze({
        summaryCards: vm.summaryCards.length,
        stockRowsSample: vm.stockRows.length,
        transactionRowsSample: vm.transactionRows.length
      })
    });
  }

  var api = {
    version: 'v6.2.26-phase7e-safe-view-model-facade',
    mode: 'read-only-view-model',
    getSummaryCards: getSummaryCards,
    getStockTableRows: getStockTableRows,
    getTransactionTableRows: getTransactionTableRows,
    getViewModel: getViewModel,
    runReadinessCheck: runReadinessCheck
  };

  try{ Object.freeze(api); }catch(e){ warn(e); }
  window.PETATOEWarehouseViewModelFacade = window.PETATOEWarehouseViewModelFacade || api;
})();
