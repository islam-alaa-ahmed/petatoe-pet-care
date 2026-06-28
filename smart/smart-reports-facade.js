/*
 * PETATOE SRX2 — Smart Reports Facade + Runtime Probe
 * Type: SAFE / NO BEHAVIOR CHANGE
 *
 * This file does NOT replace or wrap smart-reports-core.js.
 * It only reads the currently published Smart Reports globals and exposes
 * validation/probe helpers for the SRX extraction track.
 */
(function(window, document){
  'use strict';

  var VERSION = 'PETATOE_v6.4.33_PHASE_SRX2_SMART_REPORTS_FACADE_RUNTIME_PROBE';
  var createdAt = new Date().toISOString();
  var events = [];

  var EXPECTED_METHODS = [
    'renderSmartReports',
    'setSmartTab',
    'setCustomerAnalysisTab',
    'setSmartSalesYear',
    'setSmartSalesTaxMode',
    'setSmartVanYear',
    'setSmartVanDetailsYear',
    'setSmartServicesYear',
    'setSmartServicesSort',
    'setReportMode',
    'setReportYear',
    'setReportMetric',
    'setReportView',
    'setSalesYear',
    'setVanYear',
    'exportDashPdf',
    'exportDashExcel',
    'exportSalesPdf',
    'exportSalesExcel',
    'exportVansPdf',
    'exportVansExcel',
    'exportServicesPdf',
    'exportServicesExcel',
    'exportOverviewPdf',
    'exportOverviewExcel',
    'exportSmartSalesPdf',
    'exportSmartSalesExcel',
    'exportSmartVansPdf',
    'exportSmartVansExcel',
    'exportCustomersPdf',
    'exportCustomersExcel',
    'exportSmartServicesPdf',
    'exportSmartServicesExcel',
    'exportAdvancedPdf',
    'exportAdvancedExcel',
    'exportRecordsFilteredExcel',
    'openGlobalSearch',
    'closeGlobalSearch',
    'doGlobalSearch',
    'printCurrentPage'
  ];

  var RELATED_GLOBALS = [
    'PETATOEDataSource',
    'PETATOERouter',
    'PETATOESafeRender',
    'PETATOEReportsShadowOwnershipValidation',
    'PETATOEFullShadowSystemAudit',
    'PETATOEAtRiskClients',
    'PETATOENewReturningDetails',
    'PETATOECustomerCompareState',
    'PETATOECustomerCompareExportData',
    'PETATOECustomerActivityFollowupExportData',
    'petatoeSmartRecommendationsCache',
    'smartVehicleEfficiencyFilters',
    'smartOverviewCardsYear',
    'smartNewCustomerYear',
    'smartNewCustomerPeriod',
    'salesYoYSelectedYear',
    'salesYoYBaseYear',
    'salesYoYCompareYear'
  ];

  function now(){
    try { return new Date().toISOString(); }
    catch(e){ return String(Date.now()); }
  }

  function record(type, detail){
    var item = { time: now(), type: String(type || 'probe'), detail: detail || {} };
    events.push(item);
    if(events.length > 100){ events.shift(); }
    return item;
  }

  function typeOf(value){
    if(value === null){ return 'null'; }
    if(Array.isArray(value)){ return 'array'; }
    return typeof value;
  }

  function methodStatus(){
    var out = {};
    EXPECTED_METHODS.forEach(function(name){
      out[name] = typeOf(window[name]);
    });
    return out;
  }

  function relatedStatus(){
    var out = {};
    RELATED_GLOBALS.forEach(function(name){
      out[name] = typeOf(window[name]);
    });
    return out;
  }

  function domStatus(){
    var panel = document.getElementById('smart');
    var screen = document.getElementById('smartReportsScreen');
    var area = document.getElementById('smartReportsArea');
    return {
      smartPanel: !!panel,
      smartReportsScreen: !!screen,
      smartReportsArea: !!area,
      delegatedHandlersBound: !!window.__petatoeSmartDelegatedHandlersBound,
      smartActionNodes: document.querySelectorAll ? document.querySelectorAll('[data-smart-action]').length : 0,
      smartTabNodes: document.querySelectorAll ? document.querySelectorAll('[data-smart-tab], .smart-tab').length : 0
    };
  }

  function missingMethods(){
    return EXPECTED_METHODS.filter(function(name){ return typeof window[name] !== 'function'; });
  }

  function validate(){
    var missing = missingMethods();
    var dom = domStatus();
    var result = {
      ok: missing.length === 0 && dom.smartPanel && dom.smartReportsScreen,
      version: VERSION,
      createdAt: createdAt,
      checkedAt: now(),
      missingMethods: missing,
      methodStatus: methodStatus(),
      relatedStatus: relatedStatus(),
      domStatus: dom,
      mode: 'SAFE_FACADE_RUNTIME_PROBE',
      note: 'Read-only probe. Does not invoke or replace Smart Reports behavior.'
    };
    record('validate', { ok: result.ok, missingMethods: missing.length });
    return result;
  }

  function snapshot(){
    return {
      version: VERSION,
      createdAt: createdAt,
      checkedAt: now(),
      methodStatus: methodStatus(),
      relatedStatus: relatedStatus(),
      domStatus: domStatus(),
      events: events.slice()
    };
  }

  function resolve(name){
    var key = String(name || '').trim();
    var value = key ? window[key] : undefined;
    var result = {
      name: key,
      exists: typeof value !== 'undefined',
      type: typeOf(value),
      callable: typeof value === 'function',
      source: 'window',
      mode: 'READ_ONLY_RESOLVE'
    };
    record('resolve', result);
    return result;
  }

  function history(){ return events.slice(); }

  window.PETATOESmartReportsFacade = {
    version: VERSION,
    validate: validate,
    snapshot: snapshot,
    resolve: resolve,
    history: history,
    expectedMethods: EXPECTED_METHODS.slice,
    relatedGlobals: RELATED_GLOBALS.slice
  };

  record('load', { version: VERSION });
})(window, document);
