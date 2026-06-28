/* PETATOE v6.4.16 Phase RX9-SAFE - Treasury Shadow Ownership Validation
 * Purpose: passively validate Treasury route/module ownership before any real router ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open, close, activate, or render tabs.
 * - Does NOT lazy-load or defer scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, treasury data, or treasury modules.
 * - Reads metadata only and exposes a validation snapshot for QA.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.16-rx9-safe-treasury-shadow-ownership-validation';
  var TREASURY_ROUTE_IDS = ['treasury'];
  var TREASURY_MODULE_ID = 'treasury';
  var TREASURY_OWNER_ID = 'treasury';
  var TREASURY_PANEL_IDS = ['treasury'];
  var TREASURY_DOM_IDS = [
    'treasury',
    'treasuryKpis',
    'treasuryOwnerVaultCard',
    'treasuryVaultCards',
    'treasuryStatementCard',
    'trStatementTitle',
    'trStatementSub',
    'trStatementKpis',
    'trStatementFrom',
    'trStatementTo',
    'trStatementSearch',
    'trStatementBody',
    'trVehicle',
    'trAmount',
    'trOfficer',
    'trReference',
    'trNotes',
    'trExpenseSource',
    'trExpenseTarget',
    'trExpenseAmount',
    'trExpenseOfficer',
    'trExpenseReference',
    'trExpenseNotes',
    'trSearch',
    'trFilterVehicle',
    'trFilterType',
    'treasuryMovementBody'
  ];
  var REQUIRED_HINTS = [
    'treasury/treasury-core.js',
    'treasury/treasury-read-facade.js',
    'treasury/treasury-computed-facade.js',
    'treasury/treasury-view-model-facade.js',
    'treasury/treasury-render-bridge.js',
    'treasury/treasury-event-bridge.js',
    'treasury/treasury-parallel-validation.js'
  ];
  var REQUIRED_ACTIONS = [
    'printStatement',
    'exportStatementCsv',
    'closeStatement',
    'handover',
    'clearForm',
    'expense',
    'clearExpenseForm'
  ];

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
        window.PETATOEUtils.warnSilentCatch('treasury-shadow-ownership-validation.js', err);
        return;
      }
      if(window.console && typeof window.console.warn === 'function'){
        window.console.warn('[PETATOE][RX9][TreasuryShadow]', err);
      }
    }catch(_err){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/treasury-shadow-ownership-validation.js',_err,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/treasury-shadow-ownership-validation.js',_petatoeSilentCatch);}}
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
      return { id: id, exists: false, tagName: '', dataPetModule: '', dataPetFilter: '', dataPetAction: '', className: '' };
    }
    return {
      id: id,
      exists: true,
      tagName: normalize(el.tagName).toLowerCase(),
      dataPetModule: normalize(el.getAttribute('data-pet-module')),
      dataPetFilter: normalize(el.getAttribute('data-pet-filter')),
      dataPetAction: normalize(el.getAttribute('data-pet-action')),
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

  function inlineActionState(actionName){
    var selector = '[onclick*="moduleCall(\'treasury\',\'' + actionName + '\')"],[onclick*="moduleCall(&quot;treasury&quot;,&quot;' + actionName + '&quot;)"]';
    var node = null;
    try{ node = document.querySelector(selector); }catch(_err){ node = null; }
    return { action: actionName, exists: !!node, text: node ? normalize(node.textContent) : '' };
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
      moduleMatches: !!route && route.moduleId === TREASURY_MODULE_ID,
      ownerMatches: !!route && route.owner === TREASURY_OWNER_ID,
      eager: !!route && route.eager === true,
      lazyCandidate: !!route && route.lazyCandidate === true,
      sensitive: !!route && route.sensitive === true,
      ownershipMatches: !!ownership && ownership.moduleId === TREASURY_MODULE_ID,
      realOwnershipBlocked: !!ownership && ownership.blockedForRealOwnership === true
    };
  }

  function validate(){
    var treasuryRoute = validateRoute('treasury');
    var dom = TREASURY_DOM_IDS.map(elementState);
    var scripts = REQUIRED_HINTS.map(scriptState);
    var actions = REQUIRED_ACTIONS.map(inlineActionState);
    var checks = [];

    checks.push(boolCheck('route-registry-has-treasury', treasuryRoute.routeExists, treasuryRoute.route));
    checks.push(boolCheck('treasury-route-module-is-treasury', treasuryRoute.moduleMatches, treasuryRoute.route && treasuryRoute.route.moduleId));
    checks.push(boolCheck('treasury-route-owner-is-treasury', treasuryRoute.ownerMatches, treasuryRoute.route && treasuryRoute.route.owner));
    checks.push(boolCheck('treasury-route-is-sensitive', treasuryRoute.sensitive, treasuryRoute.route && treasuryRoute.route.sensitive));
    checks.push(boolCheck('treasury-route-is-still-eager', treasuryRoute.eager, treasuryRoute.route && treasuryRoute.route.eager));
    checks.push(boolCheck('treasury-route-is-lazy-candidate-only', treasuryRoute.lazyCandidate, treasuryRoute.route && treasuryRoute.route.lazyCandidate));
    checks.push(boolCheck('treasury-ownership-shadow-has-treasury-route', treasuryRoute.ownershipMatches, treasuryRoute.ownership));
    checks.push(boolCheck('treasury-ownership-real-transfer-blocked', treasuryRoute.realOwnershipBlocked, treasuryRoute.ownership && treasuryRoute.ownership.blockedForRealOwnership));
    checks.push(boolCheck('treasury-panel-exists', dom.some(function(item){ return item.id === 'treasury' && item.exists; }), dom));
    checks.push(boolCheck('treasury-panel-module-marker', dom.some(function(item){ return item.id === 'treasury' && item.dataPetModule === 'treasury'; }), dom));
    checks.push(boolCheck('treasury-required-render-targets-exist', ['treasuryKpis','treasuryOwnerVaultCard','treasuryVaultCards','treasuryMovementBody','trStatementBody'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('treasury-required-form-fields-exist', ['trVehicle','trAmount','trOfficer','trExpenseSource','trExpenseAmount','trExpenseOfficer'].every(function(id){ return dom.some(function(item){ return item.id === id && item.exists; }); }), dom));
    checks.push(boolCheck('treasury-inline-actions-exist', actions.every(function(item){ return item.exists; }), actions));
    checks.push(boolCheck('required-treasury-scripts-still-eager', scripts.every(function(item){ return item.found; }), scripts));
    checks.push(boolCheck('legacy-router-still-present', !!window.PETATOERouter, !!window.PETATOERouter));
    checks.push(boolCheck('navigation-controller-still-present', !!window.PETATOENavigationController, !!window.PETATOENavigationController));
    checks.push(boolCheck('no-real-lazy-loading-from-rx9', true, 'RX9 is validation-only and does not load or defer scripts.'));

    var failed = checks.filter(function(check){ return !check.passed; });
    var status = failed.length ? 'warning' : 'pass';
    activity.lastValidationStatus = status;
    activity.lastValidatedAt = new Date().toISOString();

    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      moduleId: TREASURY_MODULE_ID,
      owner: TREASURY_OWNER_ID,
      routes: TREASURY_ROUTE_IDS.slice(),
      panels: TREASURY_PANEL_IDS.slice(),
      status: status,
      failedChecks: failed.map(function(check){ return check.name; }),
      checks: checks,
      routeValidations: { treasury: treasuryRoute },
      dom: dom,
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
      if(route === 'treasury'){
        activity.observedTabChanges += 1;
        activity.lastObservedRoute = route;
      }
    }catch(err){ warn(err); }
  }

  try{
    document.addEventListener('petatoe:tab-change', observeTabChange, false);
    document.addEventListener('petatoe:navigation:after-open', observeTabChange, false);
  }catch(err){ warn(err); }

  window.PETATOETreasuryShadowOwnershipValidation = Object.freeze({
    version: VERSION,
    validate: validate,
    snapshot: snapshot
  });
})();
