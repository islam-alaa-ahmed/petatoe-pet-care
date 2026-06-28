/* PETATOE v6.2.30 - Phase 7I SAFE Warehouse Parallel Validation
   Manual/read-only validation layer only. No DOM writes, no storage writes, no render calls,
   no event takeover, no loader/router/navigation hooks.
   Purpose: compare legacy/public warehouse contracts and storage-backed facades before any takeover. */
(function(){
  'use strict';

  if (window.__PETATOE_WAREHOUSE_PARALLEL_VALIDATION_BOUND__) return;
  window.__PETATOE_WAREHOUSE_PARALLEL_VALIDATION_BOUND__ = true;

  var FILE = 'warehouses/warehouse-parallel-validation.js';
  var VERSION = 'v6.2.30-phase7i-safe-parallel-validation';
  var lastResult = null;
  var lastError = null;

  function warn(e){
    lastError = e || lastError;
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(FILE, e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('warehouses/warehouse-parallel-validation.js::warn-fallback', _e);
      }
    }
  }

  function safeArray(value){ return Array.isArray(value) ? value.slice() : []; }
  function count(value){ return Array.isArray(value) ? value.length : 0; }
  function num(v){ var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function text(v){ return String(v == null ? '' : v).trim(); }

  function readStorageJSON(key, fallback){
    try{
      if(window.PETATOEStorage && typeof window.PETATOEStorage.readJSON === 'function'){
        var value = window.PETATOEStorage.readJSON(key, fallback);
        return value == null ? fallback : value;
      }
    }catch(e){ warn(e); }
    return fallback;
  }

  function getLegacyItems(){
    try{
      if(window.PETATOEWarehouseItems && typeof window.PETATOEWarehouseItems.getAll === 'function'){
        return safeArray(window.PETATOEWarehouseItems.getAll());
      }
      if(window.PETATOEWarehouseItems && typeof window.PETATOEWarehouseItems.read === 'function'){
        return safeArray(window.PETATOEWarehouseItems.read());
      }
    }catch(e){ warn(e); }
    return safeArray(readStorageJSON('warehouseItems', []));
  }

  function getStorageTransactions(){ return safeArray(readStorageJSON('warehouseTransactions', [])); }

  function getReadSnapshot(){
    try{
      var facade = window.PETATOEWarehouseReadFacade;
      if(facade && typeof facade.getSnapshot === 'function'){
        var snapshot = facade.getSnapshot();
        return snapshot && typeof snapshot === 'object' ? snapshot : {};
      }
    }catch(e){ warn(e); }
    return {};
  }

  function getComputedSummary(){
    try{
      var facade = window.PETATOEWarehouseComputedFacade;
      if(facade && typeof facade.getSummary === 'function'){
        var summary = facade.getSummary();
        return summary && typeof summary === 'object' ? summary : {};
      }
    }catch(e){ warn(e); }
    return {};
  }

  function getComputedStockRows(){
    try{
      var facade = window.PETATOEWarehouseComputedFacade;
      if(facade && typeof facade.getStockRows === 'function') return safeArray(facade.getStockRows());
    }catch(e){ warn(e); }
    return [];
  }

  function getComputedSignedRows(){
    try{
      var facade = window.PETATOEWarehouseComputedFacade;
      if(facade && typeof facade.getSignedRows === 'function') return safeArray(facade.getSignedRows());
    }catch(e){ warn(e); }
    return [];
  }

  function getViewModel(){
    try{
      var facade = window.PETATOEWarehouseViewModelFacade;
      if(facade && typeof facade.getViewModel === 'function'){
        var vm = facade.getViewModel({stockLimit: 25, transactionLimit: 25});
        return vm && typeof vm === 'object' ? vm : {};
      }
    }catch(e){ warn(e); }
    return {};
  }

  function getRenderSnapshot(){
    try{
      var facade = window.PETATOEWarehouseRenderSnapshotFacade;
      if(facade && typeof facade.getSnapshot === 'function'){
        var snap = facade.getSnapshot({stockLimit: 25, transactionLimit: 25});
        return snap && typeof snap === 'object' ? snap : {};
      }
    }catch(e){ warn(e); }
    return {};
  }

  function getBridgeResult(){
    try{
      var bridge = window.PETATOEWarehouseRenderBridge;
      if(bridge && typeof bridge.build === 'function'){
        return bridge.build('phase7i-parallel-validation');
      }
    }catch(e){ warn(e); }
    return null;
  }

  function sumBalances(rows){
    return safeArray(rows).reduce(function(total, row){ return total + num(row && row.balance); }, 0);
  }

  function run(){
    var storageItems = safeArray(readStorageJSON('warehouseItems', []));
    var storageTransactions = getStorageTransactions();
    var legacyItems = getLegacyItems();
    var readSnapshot = getReadSnapshot();
    var facadeItems = safeArray(readSnapshot.items);
    var facadeTransactions = safeArray(readSnapshot.transactions);
    var computedSummary = getComputedSummary();
    var stockRows = getComputedStockRows();
    var signedRows = getComputedSignedRows();
    var viewModel = getViewModel();
    var renderSnapshot = getRenderSnapshot();
    var bridgeResult = getBridgeResult();

    var checks = {
      readFacadeReady: !!(window.PETATOEWarehouseReadFacade && typeof window.PETATOEWarehouseReadFacade.isReady === 'function' && window.PETATOEWarehouseReadFacade.isReady()),
      storageVsLegacyItemsCount: count(storageItems) === count(legacyItems),
      storageVsFacadeItemsCount: count(storageItems) === count(facadeItems),
      storageVsFacadeTransactionsCount: count(storageTransactions) === count(facadeTransactions),
      computedTransactionsCount: num(computedSummary.transactions) === count(storageTransactions),
      computedStockRowsCount: num(computedSummary.stockRows) === count(stockRows),
      signedRowsNotLessThanTransactions: count(signedRows) >= count(storageTransactions),
      viewModelHasSummaryCards: count(viewModel && viewModel.summaryCards) > 0,
      renderSnapshotReady: !!(renderSnapshot && (renderSnapshot.summaryCardsHTML || renderSnapshot.stockRowsHTML || renderSnapshot.transactionRowsHTML)),
      renderBridgeShadowOnly: !!(bridgeResult && bridgeResult.writesApplied === 0)
    };

    var failures = Object.keys(checks).filter(function(key){ return !checks[key]; });
    var result = {
      version: VERSION,
      mode: 'manual-read-only-parallel-validation',
      timestamp: new Date().toISOString(),
      counts: {
        storageItems: count(storageItems),
        legacyItems: count(legacyItems),
        facadeItems: count(facadeItems),
        storageTransactions: count(storageTransactions),
        facadeTransactions: count(facadeTransactions),
        computedSignedRows: count(signedRows),
        computedStockRows: count(stockRows),
        viewModelStockRows: count(viewModel && viewModel.stockRows),
        viewModelTransactionRows: count(viewModel && viewModel.transactionRows)
      },
      totals: {
        computedBalanceTotal: sumBalances(stockRows),
        mainPositiveQty: num(computedSummary.mainPositiveQty),
        vansPositiveQty: num(computedSummary.vansPositiveQty)
      },
      checks: checks,
      failures: failures,
      pass: failures.length === 0,
      writesApplied: 0,
      storageWrites: 0,
      domWrites: 0
    };

    try{ Object.freeze(result.counts); Object.freeze(result.totals); Object.freeze(result.checks); Object.freeze(result.failures); Object.freeze(result); }catch(e){ warn(e); }
    lastResult = result;
    try{ window.__PETATOEWarehouseParallelValidationLastResult = result; }catch(e){ warn(e); }
    try{ document.dispatchEvent(new CustomEvent('petatoe:warehouse:parallel-validation-ready', { detail: result })); }catch(e){ warn(e); }
    return result;
  }

  function getLastResult(){ return lastResult; }
  function getLastError(){ return lastError; }

  var api = {
    version: VERSION,
    mode: 'manual-read-only-parallel-validation',
    run: run,
    getLastResult: getLastResult,
    getLastError: getLastError
  };

  try{ Object.freeze(api); }catch(e){ warn(e); }
  window.PETATOEWarehouseParallelValidation = window.PETATOEWarehouseParallelValidation || api;
})();
