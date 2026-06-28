/*
 * PETATOE OPX3 — Operations Scheduler SAFE Extraction
 * ----------------------------------------------------
 * SAFE / SHADOW ONLY.
 * This file does not replace operations-legacy-engine.js and does not mutate
 * appointments, routes, storage, loader, or navigation behavior.
 *
 * Purpose:
 * - Identify scheduler/calendar related public functions currently owned by legacy engine.
 * - Provide read-only validation and snapshot probes for the next extraction phase.
 * - Keep a guarded facade for future controlled migration without activating it now.
 */
(function initPETATOEOperationsSchedulerShadow(window){
  'use strict';

  var VERSION = 'v6.4.27-OPX3-SAFE';
  var MODE = 'SAFE_SHADOW_ONLY';

  var SCHEDULER_FUNCTIONS = [
    'appointmentDateTime',
    'saveAppointment',
    'setCalendarView',
    'calendarRange',
    'renderCalendar',
    'setDispatchDateToday',
    'dispatchDate',
    'renderTodayTimeline',
    'updateAppointmentsBadges',
    'setDailyOpsDateToday',
    'setVehicleOpsDateToday',
    'renderAppointmentsShell',
    'renderAppointmentsCurrent'
  ];

  var SCHEDULER_GLOBALS = [
    'PETATOEAppointments',
    'PETATOEOperationsFacade',
    'PETATOEOperationsStorage',
    'PETATOEOperationsContext',
    'PETATOERouter'
  ];

  var SCHEDULER_PANELS = [
    'appointmentsPanel',
    'appointments',
    'vehicleOperations',
    'vehicleOperationsReports'
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
    var facade = window.PETATOEOperationsFacade && typeof window.PETATOEOperationsFacade.resolve === 'function'
      ? window.PETATOEOperationsFacade.resolve(name)
      : null;

    return {
      name: name,
      directType: typeof direct,
      appointmentScopeType: typeof appointmentScope,
      facadeType: typeof facade,
      callable: typeof direct === 'function' || typeof appointmentScope === 'function' || typeof facade === 'function'
    };
  }

  function validate(){
    var functions = SCHEDULER_FUNCTIONS.map(resolve);
    var globals = SCHEDULER_GLOBALS.map(function(name){
      return { name: name, type: typeOfGlobal(name), present: typeof window[name] !== 'undefined' };
    });
    var panels = SCHEDULER_PANELS.map(function(id){
      return { id: id, present: hasElement(id) };
    });

    var callableCount = functions.filter(function(item){ return item.callable; }).length;
    var missingGlobals = globals.filter(function(item){ return !item.present; }).map(function(item){ return item.name; });

    return {
      version: VERSION,
      mode: MODE,
      activeMigration: false,
      legacyEngineUntouched: true,
      schedulerFunctionsTracked: functions.length,
      schedulerFunctionsCallable: callableCount,
      functions: functions,
      globals: globals,
      missingGlobals: missingGlobals,
      panels: panels,
      safeToProceedToOPX4: callableCount >= 3 && missingGlobals.indexOf('PETATOEOperationsFacade') === -1
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      mode: MODE,
      timestamp: new Date().toISOString(),
      validation: validate(),
      note: 'OPX3 is shadow-only. It does not open calendar, save appointments, mutate storage, or replace legacy functions.'
    };
  }

  function list(){
    return SCHEDULER_FUNCTIONS.slice();
  }

  window.PETATOEOperationsScheduler = window.PETATOEOperationsScheduler || null;
  window.PETATOEOperationsSchedulerShadow = {
    version: VERSION,
    mode: MODE,
    list: list,
    resolve: resolve,
    validate: validate,
    snapshot: snapshot
  };
})(window);
