/* PETATOE v6.2.45 - Phase 9F SAFE Payroll Event Bridge
   Shadow-contract bridge only. No DOM mutation, no storage writes, no event takeover.
   Purpose: inventory existing payroll UI/event contracts and expose a safe mapping for future extraction. */
(function(){
  'use strict';

  var FILE = 'payroll/payroll-event-bridge.js';
  var VERSION = 'v6.2.45-phase9f-safe-payroll-event-bridge';
  var lastSnapshot = null;
  var lastError = null;
  var scheduled = false;

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(FILE, e);
      }
    }catch(_e){
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch(FILE + '::warn-fallback', _e);
      }
    }
  }

  function fnExists(name){
    try{ return !!(window.PETATOEPayroll && typeof window.PETATOEPayroll[name] === 'function'); }
    catch(e){ lastError = e; warn(e); return false; }
  }

  function elState(id){
    try{
      var el = document.getElementById(id);
      return {
        id: id,
        exists: !!el,
        tag: el && el.tagName ? String(el.tagName).toLowerCase() : '',
        type: el && el.type ? String(el.type) : '',
        valueLength: el && typeof el.value === 'string' ? el.value.length : 0,
        checked: !!(el && el.checked),
        disabled: !!(el && el.disabled),
        datasetKeys: el && el.dataset ? Object.keys(el.dataset).sort() : []
      };
    }catch(e){ lastError = e; warn(e); return { id:id, exists:false, error:true, datasetKeys:[] }; }
  }

  function getPayrollContracts(){
    var names = [
      'render','openTab','renderSalarySlip','exportCurrentSalarySlipPDF',
      'saveEmployee','editEmployee','deleteEmployee','clearEmployeeForm',
      'loadSlipForm','saveSlip','deleteSlip','boardApprove','rejectSlip',
      'employeeApprove','employeeObject','accountsApprove','markPaid','cancelApproval',
      'exportPayrollArchivePDF','exportPayrollArchiveCSV','exportMonthlyReportPDF','exportMonthlyReportCSV',
      'addLine','toggleEmployeeStatusMenu','setEmployeeStatus'
    ];
    var contracts = {};
    names.forEach(function(name){ contracts[name] = fnExists(name); });
    return contracts;
  }

  function getUiEventTargets(){
    var ids = [
      'payrollArea','salarySlipArea','payPeriod','payEmployee','peId','peCode','peName','peJob','peUserId',
      'peCommissionEmployeeName','peBase','peHousing','peTransport','pePaymentMethod','peStatus',
      'payEmpCodePrefix','payEmpCodeNext','payEmpCodeDigits','payArchiveYear','payArchiveMonth',
      'payArchiveEmployee','payArchivePayment','payMonthlyReportYear','payMonthlyReportMonth','payMonthlyReportPayment'
    ];
    return ids.map(elState);
  }

  function countReadyTargets(targets){ return targets.filter(function(t){ return !!t.exists; }).length; }
  function countContracts(contracts){ return Object.keys(contracts).filter(function(k){ return !!contracts[k]; }).length; }

  var EVENT_CONTRACT = Object.freeze({
    mode: 'shadow-only',
    currentOwner: 'payroll-core delegated handlers',
    futureOwner: 'payroll event bridge after validation',
    takeoverAllowedNow: false,
    readOnlyActions: Object.freeze([
      'open-tab','open-config-tab','load-slip-form','render-salary-slip','select-my-salary-slip',
      'export-current-salary-slip-pdf','export-monthly-report-pdf','export-monthly-report-csv'
    ]),
    writeActionsDeferred: Object.freeze([
      'save-employee','delete-employee','save-slip','delete-slip','board-approve','reject-slip',
      'employee-approve','employee-object','accounts-approve','mark-paid','cancel-approval',
      'save-employee-code-config','save-job-type','delete-job-type'
    ]),
    selectors: Object.freeze([
      '#payrollArea [data-payroll-action]',
      '#salarySlipArea [data-payroll-action]',
      '#payrollArea [data-payroll-change]',
      '#salarySlipArea [data-payroll-change]'
    ])
  });

  function countPayrollInlineHandlers(){
    var counts = { onclick:0, onchange:0, oninput:0, onblur:0, total:0 };
    var roots = [];
    try{
      var p = document.getElementById('payrollArea');
      var s = document.getElementById('salarySlipArea');
      if(p) roots.push(p);
      if(s) roots.push(s);
    }catch(e){ lastError = e; warn(e); return counts; }
    ['onclick','onchange','oninput','onblur'].forEach(function(attr){
      var n = 0;
      roots.forEach(function(root){
        try{ n += root.querySelectorAll('[' + attr + ']').length; }
        catch(e){ lastError = e; warn(e); }
      });
      counts[attr] = n;
    });
    counts.total = counts.onclick + counts.onchange + counts.oninput + counts.onblur;
    return counts;
  }

  function buildSnapshot(reason){
    var contracts = getPayrollContracts();
    var targets = getUiEventTargets();
    var renderBridgeReady = !!(window.PETATOEPayrollRenderBridge && typeof window.PETATOEPayrollRenderBridge.runManualCheck === 'function');
    var vmReady = !!(window.PETATOEPayrollViewModelFacade && typeof window.PETATOEPayrollViewModelFacade.summaryViewModel === 'function');
    var snapshot = {
      version: VERSION,
      mode: 'shadow-event-bridge-read-only',
      reason: String(reason || 'manual'),
      time: new Date().toISOString(),
      contract: EVENT_CONTRACT,
      contracts: contracts,
      contractCount: countContracts(contracts),
      targets: targets,
      targetCount: countReadyTargets(targets),
      inlineHandlersInPayrollPanels: countPayrollInlineHandlers(),
      renderBridgeReady: renderBridgeReady,
      viewModelReady: vmReady,
      canPlanFutureDelegation: renderBridgeReady && vmReady && countContracts(contracts) > 0,
      listenersAttachedForBehavior: 0,
      takeoverApplied: false,
      domWritesApplied: 0,
      storageWritesApplied: 0
    };
    try{ Object.freeze(snapshot.contracts); Object.freeze(snapshot.targets); Object.freeze(snapshot.inlineHandlersInPayrollPanels); Object.freeze(snapshot); }catch(e){ warn(e); }
    lastSnapshot = snapshot;
    try{ window.__PETATOEPayrollEventBridgeLastSnapshot = snapshot; }catch(e){ lastError = e; warn(e); }
    try{
      document.dispatchEvent(new CustomEvent('petatoe:payroll:event-bridge-shadow-ready', { detail: snapshot }));
    }catch(e){ lastError = e; warn(e); }
    return snapshot;
  }

  function schedule(reason){
    if(scheduled) return;
    scheduled = true;
    setTimeout(function(){
      scheduled = false;
      try{ buildSnapshot(reason || 'scheduled'); }catch(e){ lastError = e; warn(e); }
    }, 100);
  }

  function runManualCheck(){ return buildSnapshot('manual-check'); }
  function getLastSnapshot(){ return lastSnapshot; }
  function getLastError(){ return lastError; }
  function getContract(){ return EVENT_CONTRACT; }

  try{
    document.addEventListener('petatoe:payroll:render-bridge-shadow-ready', function(){ schedule('render-bridge-ready'); });
    document.addEventListener('petatoe:tabchange', function(e){
      var t = (e.detail || {}).tabId;
      if(t === 'payroll' || t === 'salarySlip') schedule('payroll-tab-visible');
    });
  }catch(e){ lastError = e; warn(e); }

  var api = {
    version: VERSION,
    mode: 'shadow-read-only-event-bridge',
    getContract: getContract,
    runManualCheck: runManualCheck,
    getLastSnapshot: getLastSnapshot,
    getLastError: getLastError,
    schedule: schedule
  };

  try{ Object.freeze(api); }catch(e){ warn(e); }
  window.PETATOEPayrollEventBridge = window.PETATOEPayrollEventBridge || api;
})();
