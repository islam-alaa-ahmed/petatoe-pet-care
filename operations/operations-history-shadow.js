/*
 * PETATOE OPX5 — Operations History & Status Log SAFE Extraction
 * --------------------------------------------------------------
 * SAFE / SHADOW ONLY.
 * This file does not replace operations-legacy-engine.js, does not mutate
 * history/status logs, does not change storage, router, loader, navigation,
 * reports, payroll, warehouse, or treasury behavior.
 *
 * Purpose:
 * - Identify history/status-log related functions currently owned by legacy engine.
 * - Provide read-only validation and snapshot probes for future controlled migration.
 * - Map rendering/security hotspots related to history/status log output.
 */
(function initPETATOEOperationsHistoryShadow(window){
  'use strict';

  var VERSION = 'v6.4.29-OPX5-SAFE';
  var MODE = 'SAFE_SHADOW_ONLY';

  var HISTORY_FUNCTIONS = [
    'renderVehicleStatusHistory',
    'renderVehicleHistory',
    'renderVehicleHistoryTable',
    'renderVehicleStatusLog',
    'renderVehicleTimeline',
    'renderVehicleFinalSummary',
    'vehicleStatusHistoryRows',
    'vehicleStatusLogRows',
    'vehicleHistoryRows',
    'appendVehicleStatusHistory',
    'addVehicleStatusHistoryEntry',
    'pushVehicleStatusLog',
    'logVehicleStatusChange',
    'normalizeVehicleStatusHistory',
    'normalizeVehicleStatusLog',
    'formatVehicleStatusHistoryDate',
    'formatVehicleStatusHistoryTime',
    'getVehicleStatusLabel',
    'getVehicleStatusMeta',
    'vehicleOpsRows',
    'vehicleWorkflowIndex',
    'closeVehicleSessionById',
    'reopenVehicleSessionById',
    'confirmVehicleSessionById'
  ];

  var HISTORY_GLOBALS = [
    'PETATOEAppointments',
    'PETATOEOperationsFacade',
    'PETATOEOperationsSchedulerShadow',
    'PETATOEOperationsWorkflowShadow',
    'PETATOEOperationsStorage',
    'PETATOEOperationsContext',
    'PETATOEOperationsStatusInternal',
    'PETATOEOperationsStatusActions',
    'PETATOEOperationsStatusRender',
    'PETATOEOperationsReportsInternal',
    'PETATOEOperationsReportsRender',
    'PETATOESafeRender',
    'PETATOEStorageAdapter',
    'PETATOERouter'
  ];

  var HISTORY_PANELS = [
    'vehicleOperations',
    'vehicleOperationsReports',
    'vehicleStatusHistory',
    'vehicleStatusLog',
    'operationsPanel',
    'appointmentsPanel'
  ];

  var RENDER_HOTSPOTS = [
    { key: 'historyTable', expectedOwner: 'operations-history.js', migration: 'future-real' },
    { key: 'statusTimeline', expectedOwner: 'operations-history.js', migration: 'future-real' },
    { key: 'finalSummary', expectedOwner: 'operations-workflow.js + operations-history.js', migration: 'future-real' },
    { key: 'statusLogRows', expectedOwner: 'operations-history.js', migration: 'future-real' }
  ];

  function typeOfGlobal(name){
    return typeof window[name];
  }

  function hasElement(id){
    return !!(window.document && window.document.getElementById(id));
  }

  function resolve(name){
    var direct = window[name];
    var appointmentScope = window.PETATOEAppointments && window.PETATOEAppointments[name];
    var facadeResolution = window.PETATOEOperationsFacade && typeof window.PETATOEOperationsFacade.resolve === 'function'
      ? window.PETATOEOperationsFacade.resolve(name)
      : null;

    return {
      name: name,
      directType: typeof direct,
      appointmentScopeType: typeof appointmentScope,
      facadeSelected: facadeResolution && facadeResolution.selected || null,
      facadeCallable: !!(facadeResolution && facadeResolution.callable),
      callable: typeof direct === 'function' || typeof appointmentScope === 'function' || !!(facadeResolution && facadeResolution.callable)
    };
  }

  function validate(){
    var functions = HISTORY_FUNCTIONS.map(resolve);
    var globals = HISTORY_GLOBALS.map(function(name){
      return { name: name, type: typeOfGlobal(name), present: typeof window[name] !== 'undefined' };
    });
    var panels = HISTORY_PANELS.map(function(id){
      return { id: id, present: hasElement(id) };
    });

    var callableCount = functions.filter(function(item){ return item.callable; }).length;
    var missingGlobals = globals.filter(function(item){ return !item.present; }).map(function(item){ return item.name; });

    return {
      version: VERSION,
      mode: MODE,
      activeMigration: false,
      legacyEngineUntouched: true,
      historyFunctionsTracked: functions.length,
      historyFunctionsCallable: callableCount,
      functions: functions,
      globals: globals,
      missingGlobals: missingGlobals,
      panels: panels,
      renderHotspots: RENDER_HOTSPOTS.slice(),
      safeRenderRequiredBeforeRealMigration: true,
      safeToProceedToOPX6: callableCount >= 2 && missingGlobals.indexOf('PETATOEOperationsFacade') === -1
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      mode: MODE,
      timestamp: new Date().toISOString(),
      validation: validate(),
      note: 'OPX5 is shadow-only. It does not write history entries, change status logs, mutate sessions, alter storage, or replace legacy rendering.'
    };
  }

  function list(){
    return HISTORY_FUNCTIONS.slice();
  }

  function hotspots(){
    return RENDER_HOTSPOTS.slice();
  }

  window.PETATOEOperationsHistoryShadow = {
    version: VERSION,
    mode: MODE,
    list: list,
    hotspots: hotspots,
    resolve: resolve,
    validate: validate,
    snapshot: snapshot
  };
})(window);
