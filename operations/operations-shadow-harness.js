(function(){
  'use strict';

  /**
   * PETATOE Operations Shadow Harness
   * Phase G8
   *
   * Passive diagnostics layer only.
   * - Does not replace Operations methods.
   * - Does not change tab/render/storage/router/navigation behavior.
   * - Records delegated UI events and checks method availability.
   * - Intended to protect the appointments tab chain before any future extraction.
   */
  if(window.PETATOEOperationsShadowHarness) return;

  var MAX_EVENTS = 120;
  var eventLog = [];
  var started = false;

  var EXPECTED_METHODS = [
    'setTab',
    'render',
    'clearForm',
    'saveAppointment',
    'edit',
    'remove',
    'changeStatus',
    'resetFilters',
    'setQuickRange',
    'setCalendarView',
    'applyCustomerSuggestion',
    'refreshPetSuggestions',
    'applyPetSuggestion',
    'newCustomer',
    'refreshBreedOptions',
    'setVehicleOpsDateToday',
    'renderVehicleOperations',
    'setVehicleOpsViewTab',
    'selectVehicleAppointment',
    'setVehicleStatusById',
    'nextVehicleStatusById',
    'saveVehicleSessionById',
    'closeVehicleSessionById',
    'reopenVehicleSessionById',
    'confirmVehicleSessionById',
    'renderVehicleExecutionReports',
    'renderOperationsKpiDashboard'
  ];

  function nowIso(){
    try { return new Date().toISOString(); } catch(e){ return String(Date.now()); }
  }

  function getFacade(){ return window.PETATOEOperations || null; }
  function getLegacy(){ return window.__PETATOEAppointmentsLegacyEngine || null; }

  function closestAction(target){
    if(!target || !target.closest) return null;
    return target.closest('[data-op-click],[data-op-change],[data-op-input],[data-op-blur]');
  }

  function actionFromElement(el, eventName){
    if(!el || !el.dataset) return '';
    if(eventName === 'click') return el.dataset.opClick || '';
    if(eventName === 'change') return el.dataset.opChange || '';
    if(eventName === 'input') return el.dataset.opInput || '';
    if(eventName === 'blur') return el.dataset.opBlur || '';
    return '';
  }

  function pushEvent(type, el, action){
    eventLog.push({
      at: nowIso(),
      event: type,
      action: action || '',
      tag: el && el.tagName ? String(el.tagName).toLowerCase() : '',
      id: el && el.id ? el.id : '',
      classes: el && el.className ? String(el.className).slice(0, 160) : '',
      text: el && el.textContent ? String(el.textContent).replace(/\s+/g, ' ').trim().slice(0, 120) : ''
    });
    if(eventLog.length > MAX_EVENTS) eventLog.shift();
  }

  function onUiEvent(ev){
    var el = closestAction(ev.target);
    if(!el) return;
    pushEvent(ev.type, el, actionFromElement(el, ev.type));
  }

  function start(){
    if(started || !document || !document.addEventListener) return false;
    started = true;
    ['click','change','input','blur'].forEach(function(eventName){
      document.addEventListener(eventName, onUiEvent, true);
    });
    return true;
  }

  function stop(){
    if(!started || !document || !document.removeEventListener) return false;
    ['click','change','input','blur'].forEach(function(eventName){
      document.removeEventListener(eventName, onUiEvent, true);
    });
    started = false;
    return true;
  }

  function methodStatus(method){
    var facade = getFacade();
    var legacy = getLegacy();
    return {
      method: method,
      facade: !!(facade && typeof facade[method] === 'function'),
      legacy: !!(legacy && typeof legacy[method] === 'function')
    };
  }

  function scanDomActions(){
    if(!document || !document.querySelectorAll) return [];
    var nodes = document.querySelectorAll('[data-op-click],[data-op-change],[data-op-input],[data-op-blur]');
    return Array.prototype.slice.call(nodes).map(function(el){
      return {
        id: el.id || '',
        tag: el.tagName ? String(el.tagName).toLowerCase() : '',
        click: el.dataset ? (el.dataset.opClick || '') : '',
        change: el.dataset ? (el.dataset.opChange || '') : '',
        input: el.dataset ? (el.dataset.opInput || '') : '',
        blur: el.dataset ? (el.dataset.opBlur || '') : '',
        text: el.textContent ? String(el.textContent).replace(/\s+/g, ' ').trim().slice(0, 100) : ''
      };
    });
  }

  function audit(){
    var methods = EXPECTED_METHODS.map(methodStatus);
    var missingFacade = methods.filter(function(row){ return !row.facade; }).map(function(row){ return row.method; });
    var missingLegacy = methods.filter(function(row){ return !row.legacy; }).map(function(row){ return row.method; });
    var actions = scanDomActions();
    return {
      phase: 'G8 Operations Shadow Harness',
      at: nowIso(),
      started: started,
      facadeAvailable: !!getFacade(),
      legacyAvailable: !!getLegacy(),
      legacyQuarantined: !!(getFacade() && getFacade().legacyQuarantined),
      methodCount: methods.length,
      methods: methods,
      missingFacade: missingFacade,
      missingLegacy: missingLegacy,
      delegatedActionCount: actions.length,
      delegatedActions: actions,
      recentEvents: eventLog.slice()
    };
  }

  window.PETATOEOperationsShadowHarness = {
    version: 'G8-operations-shadow-harness',
    start: start,
    stop: stop,
    audit: audit,
    getEvents: function(){ return eventLog.slice(); },
    clearEvents: function(){ eventLog = []; },
    isStarted: function(){ return started; }
  };

  start();
})();
