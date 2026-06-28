(function(){
  'use strict';

  /**
   * PETATOE Operations Reports Module
   *
   * Phase OPS-16: Reports Render Extraction boundary.
   * This module owns the Operations reports render boundary while still
   * delegating calculations and DOM-safe rendering to the golden internal
   * adapter exposed by appointments-core.js. The legacy PETATOEAppointments
   * public API remains as a final fallback.
   * No report calculations, DOM structure, filters, print layout, or UI
   * styles are changed in this phase.
   */
  if(window.PETATOEOperationsReports && window.PETATOEOperationsReports.version === 'OPS-16-reports-render-extraction') return;

  var REPORT_METHODS = [
    'renderVehicleExecutionReports',
    'renderOperationsKpiDashboard',
    'printDailyOperations',
    'renderDailyOperations',
    'dailyOpsRows',
    'operationsKpiRows'
  ];

  function internal(){
    return window.PETATOEOperationsReportsInternal || null;
  }

  function reportAdapter(){
    var api = internal();
    return api && api.reportAdapter ? api.reportAdapter : null;
  }

  function legacy(){
    return window.__PETATOEAppointmentsLegacyEngine || null;
  }

  function call(obj, method, args){
    if(obj && typeof obj[method] === 'function') return obj[method].apply(obj, args || []);
    return undefined;
  }


  function reportsRenderAdapter(){
    var internalAdapter = reportAdapter();
    return {
      version: 'OPS-16-reports-render-extraction',
      renderVehicleExecutionReports: function(){
        return call(internalAdapter, 'renderVehicleExecutionReports', arguments);
      },
      renderOperationsKpiDashboard: function(){
        return call(internalAdapter, 'renderOperationsKpiDashboard', arguments);
      },
      printDailyOperations: function(){
        return call(internalAdapter, 'printDailyOperations', arguments);
      },
      renderDailyOperations: function(){
        return call(internalAdapter, 'renderDailyOperations', arguments);
      },
      dailyOpsRows: function(){
        return call(internalAdapter, 'dailyOpsRows', arguments);
      },
      operationsKpiRows: function(){
        return call(internalAdapter, 'operationsKpiRows', arguments);
      }
    };
  }

  function renderAdapter(){
    var adapter = reportsRenderAdapter();
    return adapter;
  }

  function callReports(method, args){
    var adapter = renderAdapter();
    if(adapter && typeof adapter[method] === 'function'){
      var result = call(adapter, method, args);
      if(result !== undefined) return result;
    }
    var internalAdapter = reportAdapter();
    if(internalAdapter && typeof internalAdapter[method] === 'function') return call(internalAdapter, method, args);
    var internalApi = internal();
    if(internalApi && typeof internalApi[method] === 'function') return call(internalApi, method, args);
    return call(legacy(), method, args);
  }

  var api = {
    version: 'OPS-16-reports-render-extraction',
    methods: REPORT_METHODS.slice(),
    get internalApi(){ return internal(); },
    get reportAdapter(){ return reportAdapter(); },
    get renderAdapter(){ return renderAdapter(); },
    get legacyApi(){ return legacy(); },
    call: function(method){
      return callReports(method, Array.prototype.slice.call(arguments, 1));
    }
  };

  REPORT_METHODS.forEach(function(method){
    api[method] = function(){
      return callReports(method, arguments);
    };
  });

  window.PETATOEOperationsReports = api;
})();

try{ window.PETATOEOperationsReportsRender = window.PETATOEOperationsReports && window.PETATOEOperationsReports.renderAdapter; }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-reports.js",e);}
