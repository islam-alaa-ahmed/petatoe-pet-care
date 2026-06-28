/* PETATOE v6.2.27 Phase 7F-SAFE
 * Warehouse Render Snapshot Facade
 * Scope:
 * - Read-only render snapshot preparation only.
 * - No DOM writes.
 * - No event listeners.
 * - No boot hooks.
 * - No storage writes.
 * - Does not modify warehouse-core.js contracts.
 *
 * Purpose:
 * - Prepare future Warehouse render extraction safely by generating escaped,
 *   inert HTML/text snapshots from the existing read-only view model.
 * - This file does not attach anything to the current UI path.
 */
(function(){
  'use strict';
  if (window.__PETATOE_WAREHOUSE_RENDER_SNAPSHOT_FACADE_BOUND__) return;
  window.__PETATOE_WAREHOUSE_RENDER_SNAPSHOT_FACADE_BOUND__ = true;

  function warn(e){
    try{
      if (window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function') {
        window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-render-snapshot-facade.js', e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-render-snapshot-facade.js::warn-fallback', _e);
      }
    }
  }

  function getViewModelFacade(){
    return window.PETATOEWarehouseViewModelFacade || null;
  }

  function text(value){
    return String(value == null ? '' : value);
  }

  function escapeHTML(value){
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeArray(value){
    return Array.isArray(value) ? value.slice() : [];
  }

  function getViewModel(options){
    try{
      var facade = getViewModelFacade();
      if (facade && typeof facade.getViewModel === 'function') {
        var vm = facade.getViewModel(options || {});
        return vm && typeof vm === 'object' ? vm : {};
      }
    }catch(e){ warn(e); }
    return {};
  }

  function renderSummaryCards(vm){
    try{
      return safeArray(vm && vm.summaryCards).map(function(card){
        return '<article class="warehouse-render-card" data-warehouse-card="' + escapeHTML(card && card.key) + '">' +
          '<span class="warehouse-render-card-label">' + escapeHTML(card && card.label) + '</span>' +
          '<strong class="warehouse-render-card-value">' + escapeHTML(card && card.value) + '</strong>' +
        '</article>';
      }).join('');
    }catch(e){ warn(e); return ''; }
  }

  function renderStockRows(vm){
    try{
      return safeArray(vm && vm.stockRows).map(function(row){
        return '<tr>' +
          '<td>' + escapeHTML(row && row.store) + '</td>' +
          '<td>' + escapeHTML(row && row.item) + '</td>' +
          '<td>' + escapeHTML(row && row.balanceText) + '</td>' +
          '<td>' + escapeHTML(row && row.last) + '</td>' +
        '</tr>';
      }).join('');
    }catch(e){ warn(e); return ''; }
  }

  function renderTransactionRows(vm){
    try{
      return safeArray(vm && vm.transactionRows).map(function(row){
        return '<tr>' +
          '<td>' + escapeHTML(row && row.time) + '</td>' +
          '<td>' + escapeHTML(row && row.type) + '</td>' +
          '<td>' + escapeHTML(row && row.store) + '</td>' +
          '<td>' + escapeHTML(row && row.item) + '</td>' +
          '<td>' + escapeHTML(row && row.inQtyText) + '</td>' +
          '<td>' + escapeHTML(row && row.outQtyText) + '</td>' +
          '<td>' + escapeHTML(row && row.person) + '</td>' +
          '<td>' + escapeHTML(row && row.ref) + '</td>' +
        '</tr>';
      }).join('');
    }catch(e){ warn(e); return ''; }
  }

  function getRenderSnapshot(options){
    var vm = getViewModel(options || {});
    var snapshot = {
      version: 'v6.2.27-phase7f-safe-render-snapshot-facade',
      mode: 'manual-read-only-render-snapshot',
      summaryCardsHTML: renderSummaryCards(vm),
      stockRowsHTML: renderStockRows(vm),
      transactionRowsHTML: renderTransactionRows(vm),
      counts: {
        summaryCards: safeArray(vm.summaryCards).length,
        stockRows: safeArray(vm.stockRows).length,
        transactionRows: safeArray(vm.transactionRows).length
      }
    };
    try{ Object.freeze(snapshot.counts); Object.freeze(snapshot); }catch(e){ warn(e); }
    return snapshot;
  }

  function runReadinessCheck(){
    var facade = getViewModelFacade();
    var snapshot = getRenderSnapshot({stockLimit: 3, transactionLimit: 3});
    return Object.freeze({
      version: 'v6.2.27-phase7f-safe-render-snapshot-facade',
      mode: 'manual-read-only',
      viewModelReady: !!(facade && typeof facade.getViewModel === 'function'),
      counts: snapshot.counts,
      hasSummaryHTML: !!snapshot.summaryCardsHTML,
      hasStockRowsHTML: !!snapshot.stockRowsHTML,
      hasTransactionRowsHTML: !!snapshot.transactionRowsHTML
    });
  }

  var api = {
    version: 'v6.2.27-phase7f-safe-render-snapshot-facade',
    mode: 'read-only-render-snapshot',
    escapeHTML: escapeHTML,
    getRenderSnapshot: getRenderSnapshot,
    runReadinessCheck: runReadinessCheck
  };

  try{ Object.freeze(api); }catch(e){ warn(e); }
  window.PETATOEWarehouseRenderSnapshotFacade = window.PETATOEWarehouseRenderSnapshotFacade || api;
})();
