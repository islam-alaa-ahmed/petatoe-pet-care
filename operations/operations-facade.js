/*
 * PETATOE OPX2 — Operations Facade + Runtime Probe
 * Type: SAFE / NO BEHAVIOR CHANGE
 *
 * This file does NOT replace window.PETATOEAppointments.
 * It only mirrors the currently published operations API and exposes
 * validation/probe helpers for the OPX extraction track.
 */
(function(window, document){
  'use strict';

  var VERSION = 'PETATOE_v6.4.26_PHASE_OPX2_OPERATIONS_FACADE_RUNTIME_PROBE';
  var PUBLIC_API_NAME = 'PETATOEAppointments';
  var LEGACY_API_NAME = '__PETATOEAppointmentsLegacyEngine';
  var createdAt = new Date().toISOString();
  var events = [];

  var EXPECTED_METHODS = [
    'init',
    'render',
    'renderAppointmentsShell',
    'renderAppointmentsCurrent',
    'renderCalendar',
    'renderDispatch',
    'renderDailyOperations',
    'renderVehicleOperations',
    'renderVehicleExecutionReports',
    'renderOperationsKpiDashboard'
  ];

  var RELATED_GLOBALS = [
    'PETATOEOperationsStorage',
    'PETATOEOperationsContext',
    'PETATOEOperationsAppointments',
    'PETATOEOperationsAppointmentsActions',
    'PETATOEOperationsVehiclesInternal',
    'PETATOEOperationsStatusInternal',
    'PETATOEOperationsStatusActions',
    'PETATOEOperationsStatusRender',
    'PETATOEOperationsPaymentsInternal',
    'PETATOEOperationsPaymentsActions',
    'PETATOEOperationsReportsInternal',
    'PETATOEOperationsHistoryInternal',
    'PETATOESafeRender',
    'PETATOEDataSource',
    'PETATOERouter'
  ];

  function now(){
    try { return new Date().toISOString(); }
    catch(e){ return String(Date.now()); }
  }

  function record(type, detail){
    var item = {
      time: now(),
      type: String(type || 'probe'),
      detail: detail || {}
    };
    events.push(item);
    if(events.length > 75){ events.shift(); }
    return item;
  }

  function getPublicApi(){
    return window[PUBLIC_API_NAME] || null;
  }

  function getLegacyApi(){
    return window[LEGACY_API_NAME] || null;
  }

  function typeOf(value){
    if(value === null){ return 'null'; }
    if(Array.isArray(value)){ return 'array'; }
    return typeof value;
  }

  function methodStatus(api){
    var out = {};
    EXPECTED_METHODS.forEach(function(name){
      out[name] = !!(api && typeof api[name] === 'function');
    });
    return out;
  }

  function globalsStatus(){
    var out = {};
    RELATED_GLOBALS.forEach(function(name){
      out[name] = typeOf(window[name]);
    });
    return out;
  }

  function activePanels(){
    var panels = [];
    try {
      document.querySelectorAll('.panel').forEach(function(panel){
        var id = panel && panel.id || '';
        var cls = panel && panel.className || '';
        var visible = false;
        try {
          visible = panel.classList.contains('active') ||
                    panel.style.display === 'block' ||
                    panel.getAttribute('aria-hidden') === 'false';
        } catch(e){ visible = false; }
        if(id && visible){
          panels.push(id);
        }
      });
    } catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('operations/operations-facade.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations/operations-facade.js',_petatoeSilentCatch);}}
    return panels;
  }

  function snapshot(){
    var publicApi = getPublicApi();
    var legacyApi = getLegacyApi();
    return {
      version: VERSION,
      mode: 'SAFE_FACADE_RUNTIME_PROBE',
      createdAt: createdAt,
      publicApiName: PUBLIC_API_NAME,
      publicApiExists: !!publicApi,
      legacyApiName: LEGACY_API_NAME,
      legacyApiExists: !!legacyApi,
      publicApiType: typeOf(publicApi),
      legacyApiType: typeOf(legacyApi),
      publicApiMethods: methodStatus(publicApi),
      legacyApiMethods: methodStatus(legacyApi),
      relatedGlobals: globalsStatus(),
      activePanels: activePanels(),
      eventCount: events.length,
      recentEvents: events.slice(-10)
    };
  }

  function validate(){
    var snap = snapshot();
    var missingExpected = [];
    Object.keys(snap.publicApiMethods).forEach(function(name){
      if(!snap.publicApiMethods[name]){ missingExpected.push(name); }
    });
    var warnings = [];
    if(!snap.publicApiExists){ warnings.push('window.PETATOEAppointments is not available yet.'); }
    if(!snap.legacyApiExists){ warnings.push('window.__PETATOEAppointmentsLegacyEngine is not available yet.'); }
    if(missingExpected.length){ warnings.push('Missing expected public API methods: ' + missingExpected.join(', ')); }
    var ok = snap.publicApiExists && snap.legacyApiExists;
    record('validate', { ok: ok, warnings: warnings, missingExpected: missingExpected });
    return {
      ok: ok,
      safe: true,
      behaviorChanged: false,
      ownershipChanged: false,
      warnings: warnings,
      missingExpected: missingExpected,
      snapshot: snap
    };
  }

  function resolve(methodName){
    var api = getPublicApi();
    var legacy = getLegacyApi();
    var name = String(methodName || '');
    var result = {
      method: name,
      publicApiAvailable: !!api,
      legacyApiAvailable: !!legacy,
      publicMethod: !!(api && typeof api[name] === 'function'),
      legacyMethod: !!(legacy && typeof legacy[name] === 'function'),
      selected: null,
      callable: false,
      safe: true
    };
    if(result.publicMethod){
      result.selected = PUBLIC_API_NAME + '.' + name;
      result.callable = true;
    } else if(result.legacyMethod){
      result.selected = LEGACY_API_NAME + '.' + name;
      result.callable = true;
    }
    record('resolve', result);
    return result;
  }

  function probe(){
    var result = validate();
    record('probe', { ok: result.ok, activePanels: result.snapshot.activePanels });
    return result;
  }

  function history(){
    return events.slice();
  }

  function clearHistory(){
    events = [];
    record('clearHistory', { cleared: true });
    return history();
  }

  var facade = {
    version: VERSION,
    mode: 'SAFE_FACADE_RUNTIME_PROBE',
    validate: validate,
    snapshot: snapshot,
    resolve: resolve,
    probe: probe,
    history: history,
    clearHistory: clearHistory,
    getPublicApi: getPublicApi,
    getLegacyApi: getLegacyApi
  };

  if(window.PETATOEOperationsFacade && window.PETATOEOperationsFacade.version){
    window.__PETATOEOperationsFacadePrevious = window.PETATOEOperationsFacade;
  }

  window.PETATOEOperationsFacade = facade;

  document.addEventListener('DOMContentLoaded', function(){
    record('DOMContentLoaded', { activePanels: activePanels() });
  });

  document.addEventListener('petatoe:tabchange', function(e){
    var detail = e && e.detail || {};
    record('petatoe:tabchange', {
      tabId: detail.tabId || detail.tab || '',
      activePanels: activePanels()
    });
  });

})(window, document);
