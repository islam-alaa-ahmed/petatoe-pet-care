(function(){
  'use strict';

  /**
   * PETATOE Appointments Compatibility Facade
   *
   * OPS-20 Final Deep Extraction:
   * The operational implementation now lives behind window.PETATOEOperations
   * and the extracted operations modules under operations/.
   *
   * This file intentionally remains as a small compatibility layer for any
   * legacy references that still call window.PETATOEAppointments.*.
   */

  function operations(){
    return window.PETATOEOperations || null;
  }

  function legacyEngine(){
    return window.__PETATOEAppointmentsLegacyEngine || null;
  }

  function call(method, args){
    var ops = operations();
    if(ops && typeof ops[method] === 'function'){
      return ops[method].apply(ops, args || []);
    }
    var legacy = legacyEngine();
    if(legacy && typeof legacy[method] === 'function'){
      return legacy[method].apply(legacy, args || []);
    }
    return undefined;
  }

  var METHODS = [
    'setTab', 'clearForm', 'saveAppointment', 'render', 'edit', 'remove', 'changeStatus',
    'resetFilters', 'setQuickRange', 'setCalendarView', 'applyCustomerSuggestion',
    'refreshPetSuggestions', 'applyPetSuggestion', 'newCustomer', 'refreshBreedOptions',
    'addMasterItem', 'addBreed', 'removeMasterItem', 'editMasterItem', 'resetMasterData',
    'setDispatchDateToday', 'setDailyOpsDateToday', 'printDailyOperations',
    'setVehicleOpsDateToday', 'renderVehicleOperations', 'renderVehicleExecutionReports',
    'renderOperationsKpiDashboard', 'setVehicleOpsViewTab', 'selectVehicleAppointment',
    'setVehicleStatusById', 'setVehicleStatusByIndex', 'nextVehicleStatusById',
    'nextVehicleStatusByIndex', 'saveVehicleSessionById', 'saveVehicleSessionByIndex',
    'closeVehicleSessionById', 'reopenVehicleSessionById', 'confirmVehicleSessionById',
    'handlePaymentAttachment'
  ];

  var facade = {
    version: 'OPS-22-legacy-quarantine-facade',
    get operationsApi(){ return operations(); },
    get legacyApi(){ return legacyEngine(); },
    get legacyQuarantined(){ return true; },
    call: function(method){
      var args = Array.prototype.slice.call(arguments, 1);
      return call(method, args);
    }
  };

  METHODS.forEach(function(method){
    facade[method] = function(){
      return call(method, arguments);
    };
  });

  window.PETATOEAppointments = facade;
})();
