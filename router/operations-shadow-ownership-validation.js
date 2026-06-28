/* PETATOE v6.4.17 Phase RX10-SAFE - Operations Shadow Ownership Validation
 * Purpose: passively validate Operations/Appointments/Vehicle Operations route/module ownership before any real router ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open, close, activate, or render tabs.
 * - Does NOT lazy-load or defer scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, operations data, or operations modules.
 * - Reads metadata only and exposes a validation snapshot for QA.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.17-rx10-safe-operations-shadow-ownership-validation';
  var OPERATIONS_ROUTE_IDS = ['operations', 'appointments', 'vehicles', 'vehicleOperationsReports'];
  var OPTIONAL_ROUTE_IDS = ['operationKpis'];
  var OPERATIONS_MODULE_ID = 'operations';
  var OPERATIONS_OWNER_ID = 'operations';
  var OPERATIONS_PANEL_IDS = ['appointments', 'vehicleOperations', 'vehicleOperationsReports', 'operationKpis'];
  var OPERATIONS_DOM_IDS = [
    'appointments',
    'appointmentsKpis',
    'appointmentClient',
    'appointmentClientSuggestions',
    'appointmentAddress',
    'appointmentNotes',
    'appointmentsCalendarWarnings',
    'appointmentsCalendar',
    'appointmentsDispatchWarnings',
    'appointmentsDispatchSummary',
    'appointmentsDispatchRoutes',
    'appointmentsDailyOpsSummary',
    'appointmentsDailyOperations',
    'appointmentsTodayTimeline',
    'appointmentsAlertsSummary',
    'appointmentsAlertsList',
    'vehicleOperations',
    'vehicleOpsDate',
    'vehicleOpsVehicleFilter',
    'vehicleOpsSummary',
    'vehicleOpsBoard',
    'vehicleOperationsReports',
    'vehicleOpsReportFrom',
    'vehicleOpsReportTo',
    'vehicleOpsReportVehicleFilter',
    'vehicleOpsReportsSummary',
    'vehicleOpsReports',
    'operationKpis',
    'operationsKpiFrom',
    'operationsKpiTo',
    'operationsKpiVehicleFilter',
    'operationsKpiSummary',
    'operationsKpiDashboard'
  ];
  var REQUIRED_HINTS = [
    'operations/operations-storage.js',
    'operations/operations-context.js',
    'operations/operations-legacy-engine.js',
    'operations/operations-appointments.js',
    'operations/operations-vehicles.js',
    'operations/operations-status.js',
    'operations/operations-payments.js',
    'operations/operations-reports.js',
    'operations/operations-history.js',
    'operations/operations-core.js',
    'inline-extracted/appointments-core.js'
  ];
  var REQUIRED_OP_ACTIONS = [
    'setTab',
    'newCustomer',
    'setCalendarView',
    'setDailyOpsDateToday',
    'printDailyOperations',
    'setQuickRange',
    'setVehicleOpsDateToday',
    'renderVehicleOperations',
    'renderVehicleExecutionReports',
    'renderOperationsKpiDashboard'
  ];
  var REQUIRED_APPOINTMENT_SECTIONS = ['add','calendar','dispatch','dailyOps','timeline','alerts','log','customers','master','reports'];

  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    observedTabChanges: 0,
    lastObservedRoute: '',
    lastValidationStatus: 'not-run',
    lastValidatedAt: ''
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){
    return String(value || '').trim();
  }

  function warn(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('operations-shadow-ownership-validation.js', err);
        return;
      }
      if(window.console && typeof window.console.warn === 'function'){
        window.console.warn('[PETATOE][RX10][OperationsShadow]', err);
      }
    }catch(_err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/operations-shadow-ownership-validation.js',_err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/operations-shadow-ownership-validation.js',_petatoeSilentCatch);}}
  }

  function getRoute(routeId){
    try{
      var registry = window.PETATOERouteRegistry;
      if(!registry || typeof registry.get !== 'function') return null;
      return registry.get(routeId);
    }catch(err){
      warn(err);
      return null;
    }
  }

  function getOwnershipByRoute(routeId){
    try{
      var ownership = window.PETATOEModuleOwnershipShadow;
      if(!ownership || typeof ownership.findByRoute !== 'function') return null;
      return ownership.findByRoute(routeId);
    }catch(err){
      warn(err);
      return null;
    }
  }

  function getReadiness(routeId){
    try{
      var gate = window.PETATOELazyLoadingReadinessGate;
      if(!gate) return null;
      if(typeof gate.check === 'function') return gate.check(routeId);
      if(typeof gate.get === 'function') return gate.get(routeId);
      if(typeof gate.snapshot === 'function'){
        var snap = gate.snapshot();
        var rows = snap && (snap.routes || snap.items || snap.results || []);
        if(Array.isArray(rows)){
          for(var i = 0; i < rows.length; i += 1){
            if(normalize(rows[i].routeId || rows[i].route || rows[i].id) === routeId) return rows[i];
          }
        }
      }
      return null;
    }catch(err){
      warn(err);
      return null;
    }
  }

  function elementState(id){
    var el = document.getElementById(id);
    if(!el){
      return { id: id, exists: false, tagName: '', dataPetModule: '', dataOpClick: '', dataOpChange: '', dataAppointmentSection: '', className: '' };
    }
    return {
      id: id,
      exists: true,
      tagName: normalize(el.tagName).toLowerCase(),
      dataPetModule: normalize(el.getAttribute('data-pet-module')),
      dataOpClick: normalize(el.getAttribute('data-op-click')),
      dataOpChange: normalize(el.getAttribute('data-op-change')),
      dataAppointmentSection: normalize(el.getAttribute('data-appointment-section')),
      className: normalize(el.className)
    };
  }

  function scriptState(hint){
    var scripts = Array.prototype.slice.call(document.getElementsByTagName('script') || []);
    var matches = scripts.filter(function(script){
      return normalize(script.getAttribute('src')).indexOf(hint) !== -1;
    });
    return { hint: hint, found: matches.length > 0, count: matches.length };
  }

  function opActionState(actionName){
    var nodes = [];
    try{
      nodes = Array.prototype.slice.call(document.querySelectorAll('[data-op-click="' + actionName + '"],[data-op-change="' + actionName + '"]') || []);
    }catch(_err){ nodes = []; }
    return {
      action: actionName,
      exists: nodes.length > 0,
      count: nodes.length,
      sampleText: nodes[0] ? normalize(nodes[0].textContent || nodes[0].value || nodes[0].id || '') : ''
    };
  }

  function appointmentSectionState(sectionName){
    var node = null;
    try{ node = document.querySelector('[data-appointment-section="' + sectionName + '"]'); }
    catch(_err){ node = null; }
    return { section: sectionName, exists: !!node, className: node ? normalize(node.className) : '' };
  }

  function boolCheck(name, passed, details){
    return { name: name, passed: !!passed, details: details || null };
  }

  function validateRoute(routeId){
    var route = getRoute(routeId);
    var ownership = getOwnershipByRoute(routeId);
    var readiness = getReadiness(routeId);
    return {
      routeId: routeId,
      route: route,
      ownership: ownership,
      readiness: readiness,
      routeExists: !!route,
      moduleMatches: !!route && route.moduleId === OPERATIONS_MODULE_ID,
      ownerMatches: !!route && route.owner === OPERATIONS_OWNER_ID,
      eager: !!route && route.eager === true,
      lazyCandidate: !!route && route.lazyCandidate === true,
      ownershipMatches: !!ownership && ownership.moduleId === OPERATIONS_MODULE_ID,
      realOwnershipBlocked: !!ownership && ownership.blockedForRealOwnership === true
    };
  }

  function validate(){
    var routeValidations = {};
    OPERATIONS_ROUTE_IDS.forEach(function(routeId){ routeValidations[routeId] = validateRoute(routeId); });
    OPTIONAL_ROUTE_IDS.forEach(function(routeId){ routeValidations[routeId] = validateRoute(routeId); });

    var requiredRoutes = OPERATIONS_ROUTE_IDS.map(function(routeId){ return routeValidations[routeId]; });
    var optionalRoutes = OPTIONAL_ROUTE_IDS.map(function(routeId){ return routeValidations[routeId]; });
    var dom = OPERATIONS_DOM_IDS.map(elementState);
    var scripts = REQUIRED_HINTS.map(scriptState);
    var actions = REQUIRED_OP_ACTIONS.map(opActionState);
    var sections = REQUIRED_APPOINTMENT_SECTIONS.map(appointmentSectionState);
    var checks = [];

    checks.push(boolCheck('route-registry-has-operations-routes', requiredRoutes.every(function(item){ return item.routeExists; }), requiredRoutes));
    checks.push(boolCheck('operations-routes-module-is-operations', requiredRoutes.every(function(item){ return item.moduleMatches; }), requiredRoutes));
    checks.push(boolCheck('operations-routes-owner-is-operations', requiredRoutes.every(function(item){ return item.ownerMatches; }), requiredRoutes));
    checks.push(boolCheck('operations-routes-still-eager', requiredRoutes.every(function(item){ return item.eager; }), requiredRoutes));
    checks.push(boolCheck('operations-routes-lazy-candidate-only', requiredRoutes.every(function(item){ return item.lazyCandidate; }), requiredRoutes));
    checks.push(boolCheck('operations-ownership-shadow-has-required-routes', requiredRoutes.every(function(item){ return item.ownershipMatches; }), requiredRoutes));
    checks.push(boolCheck('operations-ownership-real-transfer-blocked', requiredRoutes.every(function(item){ return item.realOwnershipBlocked; }), requiredRoutes));
    checks.push(boolCheck('operation-kpis-remains-panel-only-or-registered', optionalRoutes.every(function(item){ return !item.routeExists || (item.moduleMatches && item.ownerMatches); }), optionalRoutes));
    checks.push(boolCheck('operations-panels-exist', OPERATIONS_PANEL_IDS.every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('operations-panel-module-markers-exist', ['appointments','vehicleOperations','vehicleOperationsReports','operationKpis'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists && item.dataPetModule.indexOf('operations') !== -1; }); }), dom));
    checks.push(boolCheck('appointments-required-sections-exist', sections.every(function(item){ return item.exists; }), sections));
    checks.push(boolCheck('appointments-critical-render-targets-exist', ['appointmentsKpis','appointmentsCalendar','appointmentsDispatchRoutes','appointmentsTodayTimeline','appointmentsAlertsList'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('vehicle-operations-critical-targets-exist', ['vehicleOpsDate','vehicleOpsVehicleFilter','vehicleOpsSummary','vehicleOpsBoard'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('vehicle-reports-critical-targets-exist', ['vehicleOpsReportFrom','vehicleOpsReportTo','vehicleOpsReportVehicleFilter','vehicleOpsReportsSummary','vehicleOpsReports'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('operations-kpi-critical-targets-exist', ['operationsKpiFrom','operationsKpiTo','operationsKpiVehicleFilter','operationsKpiSummary','operationsKpiDashboard'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('operations-data-op-actions-exist', actions.every(function(item){ return item.exists; }), actions));
    checks.push(boolCheck('required-operations-scripts-still-eager', scripts.every(function(item){ return item.found; }), scripts));
    checks.push(boolCheck('legacy-router-still-present', !!window.PETATOERouter, !!window.PETATOERouter));
    checks.push(boolCheck('navigation-controller-still-present', !!window.PETATOENavigationController, !!window.PETATOENavigationController));
    checks.push(boolCheck('no-real-lazy-loading-from-rx10', true, 'RX10 is validation-only and does not load or defer scripts.'));

    var failed = checks.filter(function(check){ return !check.passed; });
    var status = failed.length ? 'warning' : 'pass';
    activity.lastValidationStatus = status;
    activity.lastValidatedAt = new Date().toISOString();

    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      moduleId: OPERATIONS_MODULE_ID,
      owner: OPERATIONS_OWNER_ID,
      routes: OPERATIONS_ROUTE_IDS.slice(),
      optionalRoutes: OPTIONAL_ROUTE_IDS.slice(),
      panels: OPERATIONS_PANEL_IDS.slice(),
      status: status,
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      routeValidations: routeValidations,
      dom: dom,
      sections: sections,
      actions: actions,
      scripts: scripts,
      activity: clone(activity),
      safeOnly: true,
      realOwnershipTransfer: false,
      realLazyLoading: false
    };
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      activity: clone(activity),
      lastValidation: validate()
    };
  }

  function observeTabChange(evt){
    try{
      var detail = evt && evt.detail ? evt.detail : {};
      var route = normalize(detail.tab || detail.route || detail.id || detail.target || '');
      if(OPERATIONS_ROUTE_IDS.indexOf(route) !== -1 || OPTIONAL_ROUTE_IDS.indexOf(route) !== -1 || OPERATIONS_PANEL_IDS.indexOf(route) !== -1){
        activity.observedTabChanges += 1;
        activity.lastObservedRoute = route;
      }
    }catch(err){ warn(err); }
  }

  try{
    document.addEventListener('petatoe:tab-change', observeTabChange, false);
    document.addEventListener('petatoe:navigation:after-open', observeTabChange, false);
  }catch(err){ warn(err); }

  window.PETATOEOperationsShadowOwnershipValidation = Object.freeze({
    version: VERSION,
    validate: validate,
    snapshot: snapshot
  });
})();
