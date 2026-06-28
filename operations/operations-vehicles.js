(function(){
  'use strict';

  /**
   * PETATOE Operations Vehicles Boundary
   *
   * Phase OPS-19: Vehicle operations actions boundary extraction.
   * This module isolates the vehicle operations-facing public API behind an
   * operations vehicles namespace while delegating the existing golden
   * implementation to avoid changing UI, storage, status workflow, payments,
   * reports, or business rules.
   */
  if(window.PETATOEOperationsVehicles) return;

  var VEHICLE_METHODS = [
    'setVehicleOpsDateToday',
    'renderVehicleOperations',
    'setVehicleOpsViewTab',
    'selectVehicleAppointment',
    'saveVehicleSessionById',
    'saveVehicleSessionByIndex',
    'closeVehicleSessionById',
    'reopenVehicleSessionById',
    'confirmVehicleSessionById'
  ];

  function internal(){
    return window.PETATOEOperationsVehiclesInternal || null;
  }

  function legacy(){
    return window.__PETATOEAppointmentsLegacyEngine || null;
  }

  function renderAdapter(){
    var internalApi = internal();
    return internalApi && internalApi.vehicleRenderAdapter ? internalApi.vehicleRenderAdapter : null;
  }


  function actionsAdapter(){
    var internalApi = internal();
    return internalApi && internalApi.vehicleActionsAdapter ? internalApi.vehicleActionsAdapter : null;
  }

  function vehicleAdapter(){
    var internalApi = internal();
    return internalApi && internalApi.vehicleAdapter ? internalApi.vehicleAdapter : null;
  }

  function target(method){
    var internalApi = internal();
    if(internalApi && typeof internalApi[method] === 'function') return internalApi;
    var legacyApi = legacy();
    if(legacyApi && typeof legacyApi[method] === 'function') return legacyApi;
    return null;
  }

  function callVehicle(method, args){
    var api = target(method);
    if(!api) return undefined;
    return api[method].apply(api, args || []);
  }

  var api = {
    version: 'OPS-19-vehicles-actions-boundary',
    methods: VEHICLE_METHODS.slice(),
    get internalApi(){ return internal(); },
    get legacyApi(){ return legacy(); },
    get renderApi(){ return renderAdapter(); },
    get actionsApi(){ return actionsAdapter(); },
    get adapter(){ return vehicleAdapter(); },
    call: function(method){
      return callVehicle(method, Array.prototype.slice.call(arguments, 1));
    }
  };

  VEHICLE_METHODS.forEach(function(method){
    api[method] = function(){
      return callVehicle(method, arguments);
    };
  });



  var RENDER_METHODS = [
    'renderVehicleOperations',
    'renderVehicleOptions',
    'renderSessionHistory',
    'renderVehicleSessionDetailsTable',
    'renderVehiclePaymentPanel',
    'renderVehicleFinalSummary',
    'renderVehicleOperationalStage',
    'renderVehicleStageContent',
    'vehicleStatusButtons',
    'vehicleProgressBar'
  ];

  api.render = function(){
    return callVehicle('renderVehicleOperations', arguments);
  };

  RENDER_METHODS.forEach(function(method){
    if(api[method]) return;
    api[method] = function(){
      var renderer = renderAdapter();
      if(renderer && typeof renderer[method] === 'function'){
        return renderer[method].apply(renderer, arguments);
      }
      return callVehicle(method, arguments);
    };
  });



  var ACTION_METHODS = [
    'selectVehicleAppointment',
    'setVehicleOpsViewTab',
    'saveVehicleSessionById',
    'saveVehicleSessionByIndex',
    'closeVehicleSessionById',
    'reopenVehicleSessionById',
    'confirmVehicleSessionById'
  ];

  ACTION_METHODS.forEach(function(method){
    api[method] = function(){
      var actions = actionsAdapter();
      if(actions && typeof actions[method] === 'function'){
        return actions[method].apply(actions, arguments);
      }
      return callVehicle(method, arguments);
    };
  });

  window.PETATOEOperationsVehicles = api;
})();
