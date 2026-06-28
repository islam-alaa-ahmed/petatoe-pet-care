/*
 * PETATOE OPX4 — Operations Workflow SAFE Extraction
 * ---------------------------------------------------
 * SAFE / SHADOW ONLY.
 * This file does not replace operations-legacy-engine.js and does not mutate
 * appointments, vehicle sessions, storage, loader, router, or navigation behavior.
 *
 * Purpose:
 * - Identify vehicle operations workflow/status related functions currently owned by legacy engine.
 * - Provide read-only validation and snapshot probes for the next extraction phase.
 * - Keep a guarded workflow map for future controlled migration without activating it now.
 */
(function initPETATOEOperationsWorkflowShadow(window){
  'use strict';

  var VERSION = 'v6.4.28-OPX4-SAFE';
  var MODE = 'SAFE_SHADOW_ONLY';

  var WORKFLOW_FUNCTIONS = [
    'renderVehicleOperations',
    'selectVehicleAppointment',
    'setVehicleOpsViewTab',
    'vehicleOpsRows',
    'vehicleWorkflowIndex',
    'validateVehicleCollection',
    'validateVehicleStatusTransition',
    'setVehicleStatusById',
    'setVehicleStatusByIndex',
    'nextVehicleStatusById',
    'nextVehicleStatusByIndex',
    'closeVehicleSessionById',
    'reopenVehicleSessionById',
    'confirmVehicleSessionById',
    'saveVehicleSessionById',
    'saveVehicleSessionByIndex',
    'vehicleOpsIsClosed',
    'vehicleOpsIsConfirmed',
    'vehicleOpsIsLocked',
    'vehicleOpsCanClose',
    'vehicleOpsCanReopen',
    'vehicleOpsCanConfirm',
    'vehicleStatusButtons',
    'vehicleProgressBar',
    'renderVehicleStageContent',
    'renderVehicleOperationalStage',
    'renderVehiclePaymentPanel',
    'renderVehicleFinalSummary'
  ];

  var WORKFLOW_GLOBALS = [
    'PETATOEAppointments',
    'PETATOEOperationsFacade',
    'PETATOEOperationsSchedulerShadow',
    'PETATOEOperationsStorage',
    'PETATOEOperationsContext',
    'PETATOEOperationsVehiclesInternal',
    'PETATOEOperationsStatusInternal',
    'PETATOEOperationsStatusActions',
    'PETATOEOperationsStatusRender',
    'PETATOEOperationsPaymentsInternal',
    'PETATOEOperationsPaymentsActions',
    'PETATOESafeRender',
    'PETATOERouter'
  ];

  var WORKFLOW_PANELS = [
    'vehicleOperations',
    'vehicleOperationsReports',
    'appointmentsPanel',
    'operationsPanel'
  ];

  var STAGES = [
    { key: 'scheduled', label: 'Scheduled', readonly: true },
    { key: 'dispatched', label: 'Dispatched', readonly: true },
    { key: 'arrived', label: 'Arrived', readonly: true },
    { key: 'inProgress', label: 'In Progress', readonly: true },
    { key: 'payment', label: 'Payment', readonly: true },
    { key: 'closed', label: 'Closed', readonly: true }
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
    var functions = WORKFLOW_FUNCTIONS.map(resolve);
    var globals = WORKFLOW_GLOBALS.map(function(name){
      return { name: name, type: typeOfGlobal(name), present: typeof window[name] !== 'undefined' };
    });
    var panels = WORKFLOW_PANELS.map(function(id){
      return { id: id, present: hasElement(id) };
    });

    var callableCount = functions.filter(function(item){ return item.callable; }).length;
    var missingGlobals = globals.filter(function(item){ return !item.present; }).map(function(item){ return item.name; });

    return {
      version: VERSION,
      mode: MODE,
      activeMigration: false,
      legacyEngineUntouched: true,
      workflowFunctionsTracked: functions.length,
      workflowFunctionsCallable: callableCount,
      functions: functions,
      globals: globals,
      missingGlobals: missingGlobals,
      panels: panels,
      stageMap: STAGES.slice(),
      safeToProceedToOPX5: callableCount >= 3 && missingGlobals.indexOf('PETATOEOperationsFacade') === -1
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      mode: MODE,
      timestamp: new Date().toISOString(),
      validation: validate(),
      note: 'OPX4 is shadow-only. It does not change vehicle status, close/reopen sessions, collect payments, mutate storage, or replace legacy functions.'
    };
  }

  function list(){
    return WORKFLOW_FUNCTIONS.slice();
  }

  function stages(){
    return STAGES.slice();
  }

  window.PETATOEOperationsWorkflow = window.PETATOEOperationsWorkflow || null;
  window.PETATOEOperationsWorkflowShadow = {
    version: VERSION,
    mode: MODE,
    list: list,
    stages: stages,
    resolve: resolve,
    validate: validate,
    snapshot: snapshot
  };
})(window);
