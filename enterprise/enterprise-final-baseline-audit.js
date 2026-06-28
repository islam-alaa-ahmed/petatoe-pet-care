(function(window){
  'use strict';

  var VERSION = 'PETATOE_v6.4.44_PHASE_ENTERPRISE_FINAL_MODULAR_BASELINE_AUDIT';
  var REQUIRED_LAYERS = [
    ['routerFinalization', 'PETATOERouterFinalizationAudit'],
    ['operationsFinal', 'PETATOEOperationsFinalStabilityAudit'],
    ['smartReportsFinal', 'PETATOESmartReportsFinalStabilityAudit'],
    ['childrenFinal', 'PETATOEChildrenExpensesFinalStabilityAudit'],
    ['warehouseFacadeProbe', 'PETATOEWarehouseConsolidatedFacadeProbe']
  ];

  var TRACKS = {
    router: {
      status: 'golden-baseline',
      completed: ['RX1-RX11', 'R1-R5'],
      risk: 'low',
      next: 'No further router migration unless a real lazy-loading pilot is approved.'
    },
    operations: {
      status: 'controlled-migration-complete',
      completed: ['OPX1', 'OPX2', 'OPX3', 'OPX4', 'OPX5', 'OPX6', 'OPX7'],
      risk: 'medium',
      next: 'Manual regression on appointments, vehicle workflow, status history, payments, and operation reports.'
    },
    smartReports: {
      status: 'controlled-migration-complete',
      completed: ['SRX1', 'SRX2', 'SRX3', 'SRX4', 'SRX5', 'SRX6', 'SRX7'],
      risk: 'medium-high',
      next: 'Manual regression on all report tabs, filters, charts, export and PDF actions.'
    },
    childrenExpenses: {
      status: 'controlled-migration-complete',
      completed: ['CHX1', 'CHX2', 'CHX3', 'CHX4'],
      risk: 'medium-low',
      next: 'Manual regression on budget, entry, records, annual report and charts.'
    },
    warehouse: {
      status: 'consolidated-facade-probe-complete',
      completed: ['WHX-A'],
      risk: 'medium-low',
      next: 'Manual regression on warehouse dashboard, vehicle stock, movements and exports. WHX-B optional only if issues appear.'
    }
  };

  function hasGlobal(name){
    return !!window[name];
  }

  function safeCall(obj, method){
    try{
      if(!obj || typeof obj[method] !== 'function'){
        return { ok:false, missing:true, error:'missing method ' + method };
      }
      var value = obj[method]();
      return { ok:true, value:value };
    }catch(error){
      return { ok:false, error:error && error.message ? error.message : String(error) };
    }
  }

  function layerSnapshot(){
    return REQUIRED_LAYERS.map(function(pair){
      var key = pair[0];
      var globalName = pair[1];
      var ref = window[globalName];
      var validation = safeCall(ref, 'validate');
      var snapshot = safeCall(ref, 'snapshot');
      return {
        key: key,
        globalName: globalName,
        present: hasGlobal(globalName),
        validateAvailable: !!(ref && typeof ref.validate === 'function'),
        snapshotAvailable: !!(ref && typeof ref.snapshot === 'function'),
        validate: validation,
        snapshot: snapshot
      };
    });
  }

  function validate(){
    var layers = layerSnapshot();
    var missing = layers.filter(function(item){ return !item.present; });
    var failed = layers.filter(function(item){ return item.validateAvailable && item.validate && item.validate.ok === false; });
    return {
      ok: missing.length === 0 && failed.length === 0,
      version: VERSION,
      status: missing.length === 0 && failed.length === 0 ? 'enterprise-modular-baseline-ready' : 'needs-review',
      missingLayers: missing.map(function(item){ return item.globalName; }),
      failedValidations: failed.map(function(item){ return item.globalName; }),
      tracks: TRACKS
    };
  }

  function checklist(){
    return [
      'Open Dashboard and confirm KPI cards render.',
      'Open Smart Reports and test all tabs, filters, charts, Show Data, PDF/export actions.',
      'Open Payroll Management and Salary Slip from both main screen and navigation.',
      'Open Warehouse module and test main warehouse screens, movements and exports.',
      'Open Treasury module and test account statement, cash delivery, transfer/spend actions.',
      'Open Operations: appointments, vehicle operations, status changes, payment attachments and operation reports.',
      'Open Children Expenses: budget, entry, records, reports, annual report and charts.',
      'Check browser console for errors during navigation and after each export action.',
      'Run PETATOEEnterpriseFinalBaselineAudit.validate() and confirm status is enterprise-modular-baseline-ready.'
    ];
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      validation: validate(),
      layers: layerSnapshot(),
      tracks: TRACKS,
      checklist: checklist(),
      recommendation: 'Adopt this build as PETATOE Enterprise Modular Baseline if manual regression passes. Do not continue broad Router Migration. Start future work with true lazy-loading pilot or module-specific cleanup only.'
    };
  }

  window.PETATOEEnterpriseFinalBaselineAudit = {
    version: VERSION,
    validate: validate,
    snapshot: snapshot,
    checklist: checklist,
    tracks: function(){ return JSON.parse(JSON.stringify(TRACKS)); }
  };
})(window);
