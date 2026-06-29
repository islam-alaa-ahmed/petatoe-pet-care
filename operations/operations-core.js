(function(){
  'use strict';

  /**
   * PETATOE Operations Module Facade
   *
   * Phase OPS-11: Appointments, vehicle operations, status workflow, payments,
   * reports, history, storage, and shared context boundaries are isolated in window.PETATOEOperationsAppointments,
   * window.PETATOEOperationsVehicles, window.PETATOEOperationsStatus,
   * window.PETATOEOperationsPayments, window.PETATOEOperationsReports, and
   * window.PETATOEOperationsHistory.
   * Remaining operations areas still delegate to the current golden implementation:
   * window.PETATOEAppointments.
   */
  if(window.PETATOEOperations) return;

  var APPOINTMENTS_METHODS = [
    'setTab', 'clearForm', 'saveAppointment', 'render', 'edit', 'remove', 'changeStatus',
    'resetFilters', 'setQuickRange', 'setCalendarView', 'applyCustomerSuggestion',
    'refreshPetSuggestions', 'applyPetSuggestion', 'newCustomer', 'refreshBreedOptions',
    'addMasterItem', 'addBreed', 'removeMasterItem', 'editMasterItem', 'resetMasterData',
    'setMasterSection', 'addMasterCustomer', 'editMasterCustomer', 'removeMasterCustomer',
    'triggerMasterCustomersExcelImport', 'handleMasterCustomersExcelImport', 'exportMasterCustomersExcel',
    'addMasterService', 'triggerMasterServicesExcelImport', 'handleMasterServicesExcelImport', 'exportMasterServicesExcel',
    'addAppointmentServiceRow', 'removeAppointmentServiceRow', 'onAppointmentServiceChange', 'recalculateAppointmentServices',
    'addAppointmentAnimalRow', 'removeAppointmentAnimalRow', 'onAppointmentAnimalTypeChange',
    'addOperationsVehicle', 'addOperationsDriver', 'addOperationsGroomer',
    'removeOperationsVehicle', 'removeOperationsDriver', 'removeOperationsGroomer',
    'setCustomerDatabaseReportSearch', 'exportCustomersDatabaseReportExcel',
    'setFinanceReportFilter', 'resetFinanceReportFilters', 'showMoreFinanceReportRows',
    'setAppointmentLocalReportFilter', 'resetAppointmentLocalReportFilters', 'showMoreAppointmentLocalReportRows',
    'saveVehicleAssignment', 'editVehicleAssignment', 'toggleVehicleAssignment', 'removeVehicleAssignment', 'applyVehicleStaffAssignment',
    'setDispatchDateToday', 'setDailyOpsDateToday', 'printDailyOperations', 'showAppointmentDetails', 'closeAppointmentDetails',
    'selectCustomerProfile', 'setCustomerSearch', 'clearCustomerSearch', 'refreshCustomersCrm'
  ];

  var VEHICLE_METHODS = [
    'setVehicleOpsDateToday', 'renderVehicleOperations', 'setVehicleOpsViewTab',
    'selectVehicleAppointment', 'saveVehicleSessionById', 'saveVehicleSessionByIndex',
    'closeVehicleSessionById', 'reopenVehicleSessionById', 'confirmVehicleSessionById'
  ];

  var STATUS_METHODS = [
    'setVehicleStatusById', 'setVehicleStatusByIndex', 'nextVehicleStatusById', 'nextVehicleStatusByIndex'
  ];

  var PAYMENT_METHODS = [
    'handlePaymentAttachment'
  ];

  var REPORT_METHODS = [
    'renderVehicleExecutionReports', 'renderOperationsKpiDashboard'
  ];

  function legacy(){
    return window.__PETATOEAppointmentsLegacyEngine || null;
  }

  function appointmentsModule(){
    return window.PETATOEOperationsAppointments || null;
  }

  function callLegacy(method, args){
    var api = legacy();
    if(!api || typeof api[method] !== 'function') return undefined;
    return api[method].apply(api, args || []);
  }

  function callAppointments(method, args){
    var api = appointmentsModule();
    if(api && typeof api[method] === 'function') return api[method].apply(api, args || []);
    return callLegacy(method, args);
  }

  function vehiclesModule(){
    return window.PETATOEOperationsVehicles || null;
  }

  function callVehicles(method, args){
    var api = vehiclesModule();
    if(api && typeof api[method] === 'function') return api[method].apply(api, args || []);
    return callLegacy(method, args);
  }

  function statusModule(){
    return window.PETATOEOperationsStatus || null;
  }

  function callStatus(method, args){
    var api = statusModule();
    if(api && typeof api[method] === 'function') return api[method].apply(api, args || []);
    return callLegacy(method, args);
  }

  function paymentsModule(){
    return window.PETATOEOperationsPayments || null;
  }

  function callPayments(method, args){
    var api = paymentsModule();
    if(api && typeof api[method] === 'function') return api[method].apply(api, args || []);
    return callLegacy(method, args);
  }

  function reportsModule(){
    return window.PETATOEOperationsReports || null;
  }

  function callReports(method, args){
    var api = reportsModule();
    if(api && typeof api[method] === 'function') return api[method].apply(api, args || []);
    return callLegacy(method, args);
  }



  function operationArgsFromDataset(el, eventType){
    var args = [];
    for(var i = 1; i <= 6; i += 1){
      var key = 'opArg' + i;
      if(el.dataset && Object.prototype.hasOwnProperty.call(el.dataset, key)) args.push(el.dataset[key]);
    }
    if(el.dataset && el.dataset.opUseId === 'true') args.push(el.dataset.id || '');
    if(el.dataset && el.dataset.opUseValue === 'true') args.push(el.value);
    if(el.dataset && el.dataset.opPassSelf === 'true') args.push(el);
    return args;
  }

  function dispatchOperationAction(actionList, el, eventType, ev){
    if(!actionList || !window.PETATOEInlineHandlers || typeof window.PETATOEInlineHandlers.moduleCall !== 'function') return false;
    String(actionList).split(',').map(function(x){ return String(x || '').trim(); }).filter(Boolean).forEach(function(action, index){
      var args = index === 0 ? operationArgsFromDataset(el, eventType) : [];
      window.PETATOEInlineHandlers.moduleCall.apply(window.PETATOEInlineHandlers, ['operations', action].concat(args));
    });
    return true;
  }

  function bindOperationDelegatedHandlers(){
    if(window.__PETATOEOperationsDelegatedHandlersBound) return;
    window.__PETATOEOperationsDelegatedHandlersBound = true;
    document.addEventListener('click', function(ev){
      var el = ev.target && ev.target.closest ? ev.target.closest('[data-op-click]') : null;
      if(!el) return;
      if(el.dataset && el.dataset.opStop === 'true') ev.stopPropagation();
      dispatchOperationAction(el.dataset.opClick, el, 'click', ev);
    }, true);
    ['change','input','blur'].forEach(function(eventName){
      document.addEventListener(eventName, function(ev){
        var attr = eventName === 'change' ? 'opChange' : (eventName === 'input' ? 'opInput' : 'opBlur');
        var selector = '[data-' + attr.replace(/[A-Z]/g, function(ch){ return '-' + ch.toLowerCase(); }) + ']';
        var el = ev.target && ev.target.closest ? ev.target.closest(selector) : null;
        if(!el || !el.dataset) return;
        dispatchOperationAction(el.dataset[attr], el, eventName, ev);
      }, true);
    });
  }

  bindOperationDelegatedHandlers();

  var facade = {
    version: 'OPS-22-legacy-quarantine',
    modules: {
      appointments: 'PETATOEOperationsAppointments',
      vehicles: 'PETATOEOperationsVehicles',
      status: 'PETATOEOperationsStatus',
      payments: 'PETATOEOperationsPayments',
      reports: 'PETATOEOperationsReports',
      history: 'PETATOEOperationsHistory',
      storage: 'PETATOEOperationsStorage',
      context: 'PETATOEOperationsContext',
      legacy: '__PETATOEAppointmentsLegacyEngine'
    },
    get legacyApi(){ return legacy(); },
    get legacyQuarantined(){ return true; },
    get appointmentsApi(){ return appointmentsModule(); },
    get vehiclesApi(){ return vehiclesModule(); },
    get statusApi(){ return statusModule(); },
    get paymentsApi(){ return paymentsModule(); },
    get reportsApi(){ return reportsModule(); },
    get historyApi(){ return window.PETATOEOperationsHistory || null; },
    get storageApi(){ return window.PETATOEOperationsStorage || null; },
    get contextApi(){ return window.PETATOEOperationsContext || null; },
    call: function(method){
      var args = Array.prototype.slice.call(arguments, 1);
      if(APPOINTMENTS_METHODS.indexOf(method) !== -1) return callAppointments(method, args);
      if(VEHICLE_METHODS.indexOf(method) !== -1) return callVehicles(method, args);
      if(STATUS_METHODS.indexOf(method) !== -1) return callStatus(method, args);
      if(PAYMENT_METHODS.indexOf(method) !== -1) return callPayments(method, args);
      if(REPORT_METHODS.indexOf(method) !== -1) return callReports(method, args);
      return callLegacy(method, args);
    }
  };

  APPOINTMENTS_METHODS.forEach(function(method){
    facade[method] = function(){
      return callAppointments(method, arguments);
    };
  });

  VEHICLE_METHODS.forEach(function(method){
    facade[method] = function(){
      return callVehicles(method, arguments);
    };
  });

  STATUS_METHODS.forEach(function(method){
    facade[method] = function(){
      return callStatus(method, arguments);
    };
  });

  PAYMENT_METHODS.forEach(function(method){
    facade[method] = function(){
      return callPayments(method, arguments);
    };
  });

  REPORT_METHODS.forEach(function(method){
    facade[method] = function(){
      return callReports(method, arguments);
    };
  });

  window.PETATOEOperations = facade;
})();
