(function(){
  'use strict';

  var MOBILE_QUERY = '(max-width: 760px), (max-height: 600px) and (hover: none) and (pointer: coarse)';
  var isMobile = false;
  try { isMobile = window.PETATOEDeviceProfile ? window.PETATOEDeviceProfile.isMobileDevice() : !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches); } catch (_) {}

  var groups = Object.create(null);
  var states = Object.create(null);
  var runtimeDiagnostics = { sequence: 0, active: null, history: [] };
  var registrationOwners = Object.create(null);
  var registrationConflicts = [];

  function canonicalScriptSource(src){
    return String(src || '').split('#')[0].split('?')[0].replace(/^\.\//,'');
  }

  function diagnosticSourceMatches(filename, src){
    filename = String(filename || '').split('#')[0];
    src = String(src || '').split('#')[0];
    if(!filename || !src) return true;
    var cleanFilename = filename.split('?')[0];
    var cleanSrc = src.split('?')[0];
    return cleanFilename === cleanSrc || cleanFilename.slice(-cleanSrc.length) === cleanSrc || cleanSrc.slice(-cleanFilename.length) === cleanFilename;
  }

  function pushRuntimeDiagnostic(entry){
    runtimeDiagnostics.history.push(entry);
    if(runtimeDiagnostics.history.length > 40) runtimeDiagnostics.history.splice(0, runtimeDiagnostics.history.length - 40);
  }

  function captureActiveRuntimeError(kind, event){
    var active = runtimeDiagnostics.active;
    if(!active) return;
    var filename = kind === 'error' ? String(event && event.filename || '') : '';
    if(filename && !diagnosticSourceMatches(filename, active.src)) return;
    var raw = kind === 'error' ? (event && (event.error || event.message)) : (event && event.reason);
    var message = String(raw && raw.message || raw || (kind === 'error' ? 'Unknown runtime script error' : 'Unhandled promise rejection'));
    var record = {
      id: active.id, group: active.group, src: active.src, phase: 'executing', kind: kind,
      message: message, filename: filename || active.src,
      line: Number(event && event.lineno || 0), column: Number(event && event.colno || 0),
      stack: String(raw && raw.stack || ''), timestamp: Date.now()
    };
    active.executionError = record;
    pushRuntimeDiagnostic(record);
  }

  window.addEventListener('error', function(event){ captureActiveRuntimeError('error', event); }, true);
  window.addEventListener('unhandledrejection', function(event){ captureActiveRuntimeError('unhandledrejection', event); });
  var desktopLazyGroups = {
    diagnostics: true, xlsx: true, settingsSetup: true, children: true,
    operations: true, warehouses: true, payroll: true, treasury: true,
    smartReports: true, smartSalesInvoices: true, customer360: true, sales: true, salesShared: true, salesCrud: true, salesEntry: true, salesImport: true, salesRecords: true, salesManualItems: true, salesContracts: true, salesAnalytics: true, commission: true, printing: true
  };

  function shouldLazyLoad(group){
    group = normalizeGroup(String(group || ''));
    return isMobile || desktopLazyGroups[group] === true;
  }
  var startupInteractive = document.readyState !== 'loading';
  var pendingStartupGroups = Object.create(null);

  function rememberPendingStartupGroup(group){
    group = normalizeGroup(String(group || ''));
    if(group) pendingStartupGroups[group] = true;
  }

  function hydratePendingStartupGroups(){
    var pending = Object.keys(pendingStartupGroups);
    pendingStartupGroups = Object.create(null);
    pending.forEach(function(group){
      ensureGroup(group).catch(function(error){
        if(window.console && console.warn) console.warn('[PETATOE Mobile Gate] deferred startup hydration failed', group, error);
      });
    });
  }

  var mobileBootFinished = false;
  var mobileBootStartedAt = Date.now();
  var mobileBootDeadlineId = 0;

  function finishBoot(reason){
    if(mobileBootFinished) return;
    mobileBootFinished = true;
    if(mobileBootDeadlineId) window.clearTimeout(mobileBootDeadlineId);
    document.documentElement.classList.remove('pet-mobile-booting');
    try{ window.dispatchEvent(new CustomEvent('petatoe:mobile-boot-ready',{detail:{reason:reason||'shell-ready',duration:Date.now()-mobileBootStartedAt}})); }catch(_){}
  }

  function armBootDeadline(){
    if(!isMobile || mobileBootFinished) return;
    mobileBootDeadlineId = window.setTimeout(function(){ finishBoot('safety-deadline'); }, 1100);
  }

  function scheduleCriticalShellRelease(){
    if(!isMobile) return;
    var release=function(){ window.requestAnimationFrame(function(){ window.requestAnimationFrame(function(){ finishBoot('critical-shell-painted'); }); }); };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',release,{once:true}); else release();
    armBootDeadline();
  }

  var aliases = {
    operation: 'operations', operations: 'operations', appointments: 'operations',
    payroll: 'payroll', salarySlip: 'payroll', commissionStatement: 'commission',
    treasury: 'treasury',
    warehouse: 'warehouses', warehouses: 'warehouses', warehouseAlerts: 'warehouses',
    children: 'children', childrenExpenses: 'children',
    fleet: 'fleet', obligations: 'obligations', movement: 'movement', movementCenter: 'movement',
    settingsSetup: 'settingsSetup', localizationRemote: 'localizationRemote',
    xlsx: 'xlsx', excel: 'xlsx', diagnostics: 'diagnostics', audit: 'diagnostics', observability: 'diagnostics',
    smartReports: 'smartReports', smart: 'smartReports', analytics: 'smartReports', smartSalesInvoices: 'smartSalesInvoices', salesInvoices: 'smartSalesInvoices', customer360: 'customer360', customers: 'customer360',
    reportsUI: 'reportsUI', reports: 'reportsUI', printing: 'printing', print: 'printing', pdf: 'printing',
    salesShared: 'salesShared', salesCrud: 'salesCrud', salesEntry: 'salesEntry', entry: 'salesEntry', salesImport: 'salesImport', import: 'salesImport', salesRecords: 'salesRecords', records: 'salesRecords', salesManualItems: 'salesManualItems', salesContracts: 'salesContracts', salesAnalytics: 'salesAnalytics',
    sales: 'sales', invoices: 'sales', commission: 'commission', commissions: 'commission'
  };

  var dependencies = {
    smartReports: [],
    smartSalesInvoices: [],
    customer360: [],
    salesShared: [],
    salesCrud: [],
    salesManualItems: ['salesShared'],
    salesEntry: ['salesShared', 'salesCrud', 'salesManualItems'],
    salesImport: ['salesShared'],
    salesRecords: ['salesCrud'],
    salesContracts: [],
    salesAnalytics: ['reportsUI'],
    /* Compatibility aggregate only. No route should require the full sales
       runtime after Phase 5; old callers may still request it safely. */
    sales: ['salesEntry', 'salesImport', 'salesRecords', 'smartSalesInvoices', 'salesContracts'],
    printing: ['reportsUI']
  };

  /* SG-4.6.9: Smart Reports must not be blocked by the full reportsUI provider
     contract. Start reportsUI hydration in parallel as a soft dependency while
     allowing the canonical Smart Reports group to load its router and runtime
     controller immediately. */
  var optionalDependencies = {
    smartReports: ['reportsUI'],
    smartSalesInvoices: ['reportsUI']
  };

  function normalizeGroup(name){ return aliases[name] || name; }

  function safeSrc(src){
    src = String(src || '').trim();
    if(!src || /^(?:javascript|data):/i.test(src)) throw new Error('Unsafe lazy script source');
    return src;
  }

  function writeDesktopScript(src, defer){
    var html = '<script src="' + String(src).replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '"' + (defer ? ' defer' : '') + '><\\/script>';
    document.write(html);
  }

  function registerOrWrite(group, src, defer){
    group = normalizeGroup(String(group || 'misc'));
    src = safeSrc(src);
    var canonical = canonicalScriptSource(src);
    var owner = registrationOwners[canonical];
    if(owner){
      if(owner.group !== group){
        registrationConflicts.push({src:canonical,firstGroup:owner.group,duplicateGroup:group,at:Date.now()});
      }
      return owner;
    }
    if(!groups[group]) groups[group] = [];
    var lazy = shouldLazyLoad(group);
    var item = { src: src, canonicalSrc: canonical, defer: !!defer, desktopWritten: !lazy };
    groups[group].push(item);
    registrationOwners[canonical] = { group: group, src: src, defer: !!defer, desktopWritten: !lazy };
    if(!lazy){
      writeDesktopScript(src, !!defer);
    }
    return registrationOwners[canonical];
  }

  function attributedError(message, attribution){
    var error = new Error(message);
    error.petatoeAttribution = attribution || null;
    return error;
  }

  function loadOne(item, group, state){
    return new Promise(function(resolve, reject){
      var context = {
        id: ++runtimeDiagnostics.sequence,
        group: group,
        src: item.src,
        phase: 'loading',
        startedAt: Date.now(),
        executionError: null
      };
      runtimeDiagnostics.active = context;
      state.currentScript = item.src;
      state.currentPhase = 'loading';
      var node = document.createElement('script');
      node.src = item.src;
      node.async = false;
      node.dataset.petatoeMobileLazyLoaded = '1';
      node.dataset.petatoeLazyGroup = group;
      node.onload = function(){
        context.phase = 'executing';
        state.currentPhase = 'executing';
        window.setTimeout(function(){
          if(runtimeDiagnostics.active === context) runtimeDiagnostics.active = null;
          if(context.executionError){
            state.failedScript = item.src;
            state.currentScript = '';
            state.currentPhase = 'failed';
            return reject(attributedError('Runtime execution failed in ' + item.src + ': ' + context.executionError.message, context.executionError));
          }
          if(/xlsx/i.test(item.src)){
            try{ delete window.__PETATOE_XLSX_STUB__; }catch(_){ window.__PETATOE_XLSX_STUB__ = false; }
          }
          state.loadedScripts = state.loadedScripts || [];
          state.loadedScripts.push(item.src);
          state.lastLoadedScript = item.src;
          state.currentScript = '';
          state.currentPhase = 'loaded';
          pushRuntimeDiagnostic({ id: context.id, group: group, src: item.src, phase: 'loaded', kind: 'script', message: '', filename: item.src, line: 0, column: 0, stack: '', timestamp: Date.now() });
          resolve(item.src);
        }, 0);
      };
      node.onerror = function(){
        if(runtimeDiagnostics.active === context) runtimeDiagnostics.active = null;
        var attribution = { id: context.id, group: group, src: item.src, phase: 'loading', kind: 'network', message: 'Unable to load script', filename: item.src, line: 0, column: 0, stack: '', timestamp: Date.now() };
        pushRuntimeDiagnostic(attribution);
        state.failedScript = item.src;
        state.currentScript = '';
        state.currentPhase = 'failed';
        reject(attributedError('Unable to load ' + item.src, attribution));
      };
      document.head.appendChild(node);
    });
  }

  function notify(group, ok, error){
    var detail = { group: group, ok: !!ok, error: error ? String(error.message || error) : '' };
    try{ window.dispatchEvent(new CustomEvent('petatoe:mobile-lazy-group', { detail: detail })); }catch(_){}
    try{ document.dispatchEvent(new CustomEvent('petatoe:mobile-lazy-group', { detail: detail })); }catch(_){}
  }

  function refreshActiveModule(group){
    try{
      var active = document.querySelector('.panel.active, .panel.is-active, [data-panel].active');
      var tabId = active && active.id ? active.id : '';
      if(group === 'operations' && window.PETATOEAppointments){
        if(typeof window.PETATOEAppointments.render === 'function') window.PETATOEAppointments.render();
      }else if(group === 'commission'){
        var commissionRuntime = window.PETATOECommissionRuntime;
        if(tabId === 'commissions' && commissionRuntime && typeof commissionRuntime.renderSystem === 'function') commissionRuntime.renderSystem();
        else if(tabId === 'commissionStatement' && commissionRuntime && typeof commissionRuntime.renderStatement === 'function') commissionRuntime.renderStatement();
      }else if(group === 'salesEntry' || group === 'salesManualItems'){
        if(tabId === 'entry' && typeof window.petInvoiceManualMultiItemsBoot === 'function') window.petInvoiceManualMultiItemsBoot();
      }else if(group === 'salesRecords'){
        if(tabId === 'records' && typeof window.renderRecords === 'function') window.renderRecords();
      }else if(group === 'salesAnalytics'){
        if(tabId === 'sales' && typeof window.renderDeep === 'function') window.renderDeep();
      }else if(group === 'smartSalesInvoices'){
        if(tabId === 'smart' && typeof window.injectSalesInvoiceReport === 'function') window.injectSalesInvoiceReport('salesInvoices');
        if(tabId === 'smart' && window.PETATOESalesInvoiceReport && typeof window.PETATOESalesInvoiceReport.render === 'function') window.PETATOESalesInvoiceReport.render();
      }else if(group === 'smartReports'){
        var smartRuntime = window.PETATOESmartReportsRuntime;
        if(tabId === 'smart' && smartRuntime && smartRuntime.__ready && typeof smartRuntime.render === 'function') smartRuntime.render('', 'lazy-hydration');
      }else if(group === 'customer360'){
        var customer360Runtime = window.PETATOECustomer360Runtime;
        if(customer360Runtime && customer360Runtime.__ready === true && typeof customer360Runtime.render === 'function') customer360Runtime.render();
      }else if(group === 'children' && window.PETATOEChildrenExpenses && typeof window.PETATOEChildrenExpenses.render === 'function'){
        window.PETATOEChildrenExpenses.render();
      }else if(group === 'warehouses'){
        var wh = window.PETATOEWarehouseUI || window.PETATOEWarehouse;
        if(wh && typeof wh.render === 'function') wh.render();
      }else if(group === 'payroll' && window.PETATOEPayroll){
        if(tabId === 'salarySlip' && typeof window.PETATOEPayroll.renderSalarySlip === 'function') window.PETATOEPayroll.renderSalarySlip();
        else if(typeof window.PETATOEPayroll.render === 'function') window.PETATOEPayroll.render();
      }else if(group === 'diagnostics'){
        var mount = document.getElementById('petatoeObservabilitySettingsMount');
        if(mount && window.PETATOEObservability && typeof window.PETATOEObservability.renderInto === 'function') window.PETATOEObservability.renderInto(mount);
      }
      if(tabId){
        var router=window.PETATOERouter||{};
        var intent=router.current===tabId?(router.currentIntent||{}):{};
        document.dispatchEvent(new CustomEvent('petatoe:tabchange', { detail: {
          tabId: tabId,
          lazyHydration: true,
          appointmentsSubTab: tabId==='appointments'?String(intent.appointmentsSubTab||''):'',
          navigationScreen: String(intent.navigationScreen||tabId||''),
          source: 'lazy-hydration-refresh'
        } }));
      }
    }catch(e){
      if(window.console && console.warn) console.warn('[PETATOE Mobile Gate] refresh failed', group, e);
    }
  }


  var desktopProviderFallbacks = {
    payroll: 'payroll/payroll-core.js?v=10.0.25'
  };

  var desktopReadinessContracts = {
    xlsx: function(){
      /* E5.2.10.3: the fallback guard intentionally exposes an XLSX-shaped stub.
         It must never satisfy the lazy provider contract, otherwise ensureGroup('xlsx')
         resolves before the real parser is loaded and imports fail without a network request. */
      return !!(window.XLSX &&
        window.__PETATOE_XLSX_STUB__ !== true &&
        typeof window.XLSX.read === 'function' &&
        window.XLSX.utils &&
        typeof window.XLSX.utils.sheet_to_json === 'function' &&
        typeof window.XLSX.utils.book_new === 'function');
    },
    operations: function(){
      var appointments = window.PETATOEAppointments;
      return !!(appointments &&
        appointments.__ready === true &&
        appointments.__owner === 'inline-extracted/appointments-core.js' &&
        typeof appointments.setTab === 'function' &&
        typeof appointments.render === 'function' &&
        window.__PETATOEAppointmentsLegacyEngine &&
        window.__PETATOEAppointmentsLegacyEngine.__legacyEngine === true &&
        window.PETATOEOperationsVehiclePolicy &&
        window.PETATOEOperationsVehiclePolicy.__ready === true &&
        window.PETATOEOperationsVehiclePolicy.__owner === 'operations/operations-vehicle-policy.js' &&
        window.PETATOEOperationsVehicles &&
        window.PETATOEOperationsReports &&
        window.PETATOEOperationsStatus &&
        window.PETATOEOperationsPayments);
    },
    warehouses: function(){
      return !!(window.PETATOEWarehouses && typeof window.PETATOEWarehouses.render === 'function' &&
        window.PETATOEWarehouseUI && typeof window.PETATOEWarehouseUI.renderAll === 'function' &&
        window.PETATOEWarehouseReadFacade && typeof window.PETATOEWarehouseReadFacade.getItems === 'function' &&
        window.PETATOEWarehouseComputedFacade && typeof window.PETATOEWarehouseComputedFacade.getSummary === 'function' &&
        window.PETATOEWarehouseViewModelFacade && typeof window.PETATOEWarehouseViewModelFacade.getViewModel === 'function');
    },
    treasury: function(){
      return !!(window.PETATOETreasury && typeof window.PETATOETreasury.render === 'function' &&
        window.PETATOETreasuryReadFacade && typeof window.PETATOETreasuryReadFacade.transactions === 'function' &&
        window.PETATOETreasuryComputedFacade && typeof window.PETATOETreasuryComputedFacade.dashboardSnapshot === 'function' &&
        window.PETATOETreasuryViewModelFacade && typeof window.PETATOETreasuryViewModelFacade.dashboardViewModel === 'function');
    },
    children: function(){
      var children = window.PETATOEChildrenExpenses;
      return !!(children &&
        children.__ready === true &&
        children.__owner === 'inline-extracted/children-expenses-core.js' &&
        typeof children.render === 'function' &&
        window.__PETATOEChildrenExpensesLegacyEngine &&
        window.__PETATOEChildrenExpensesLegacyEngine.__legacyEngine === true);
    },
    commission: function(){
      var runtime = window.PETATOECommissionRuntime;
      return !!(runtime && runtime.__ready === true && runtime.status === 'ready' &&
        typeof runtime.ensurePanels === 'function' &&
        typeof runtime.renderSystem === 'function' &&
        typeof runtime.renderStatement === 'function' &&
        document.getElementById('commissions') &&
        document.getElementById('commissionStatement'));
    },
    customer360: function(){
      var runtime=window.PETATOECustomer360Runtime;
      return !!(runtime && runtime.__ready === true &&
        runtime.__owner === 'inline-extracted/customer360-runtime-data-binding-fix.js' &&
        typeof runtime.render === 'function' &&
        typeof runtime.show === 'function' &&
        typeof runtime.open === 'function' &&
        typeof runtime.back === 'function' &&
        typeof runtime.exportExcel === 'function');
    },
    settingsSetup: function(){
      return !!(
        window.__PETATOE_SETTINGS_CORE_BOOTED__ === true &&
        typeof window.renderSettingsPanelV110 === 'function' &&
        window.PETATOEUsersModule && typeof window.PETATOEUsersModule.renderUsersBody === 'function' &&
        window.PETATOEPermissions && typeof window.PETATOEPermissions.renderPermissionsBody === 'function' &&
        window.PETATOESetup && typeof window.PETATOESetup.renderSetupBody === 'function' &&
        window.PETATOEBackup && typeof window.PETATOEBackup.renderBackupBody === 'function'
      );
    },
    diagnostics: function(){
      return !!(window.PETATOEObservability && window.PETATOEObservability.__ready === true && typeof window.PETATOEObservability.snapshot === 'function');
    },
    fleet: function(){
      return !!(window.PETATOEFleet && typeof window.PETATOEFleet.render === 'function');
    },
    obligations: function(){
      return typeof window.petObligationsBoot === 'function';
    },
    movement: function(){
      return typeof window.renderMovementCenter === 'function';
    },
    localizationRemote: function(){
      return !!(window.PETATOE_LOCALIZATION_LOADER && typeof window.PETATOE_LOCALIZATION_LOADER.load === 'function');
    },
    payroll: function(){
      return !!(window.PETATOEPayroll &&
        typeof window.PETATOEPayroll.openTab === 'function' &&
        typeof window.PETATOEPayroll.renderSalarySlip === 'function' &&
        typeof window.PETATOEPayroll.exportCsv === 'function' &&
        window.PETATOEPayrollReadFacade && typeof window.PETATOEPayrollReadFacade.slips === 'function' &&
        window.PETATOEPayrollComputedFacade && typeof window.PETATOEPayrollComputedFacade.slipTotals === 'function' &&
        window.PETATOEPayrollViewModelFacade && typeof window.PETATOEPayrollViewModelFacade.dashboard === 'function');
    },
    salesShared: function(){
      return !!(window.PETATOESalesDuplicatePolicy && typeof window.PETATOESalesDuplicatePolicy.findDuplicates === 'function');
    },
    salesCrud: function(){
      return window.__PETATOE_SALES_CRUD_SUPABASE_BINDING__ === true;
    },
    salesManualItems: function(){
      return window.__PETATOE_INVOICE_MANUAL_MULTI_ITEMS_SINGLETON__ === true && typeof window.petInvoiceManualMultiItemsBoot === 'function';
    },
    salesEntry: function(){
      return window.__PETATOE_ENTRY_REFERENCES_BINDINGS__ === '1' &&
        window.__PETATOE_SALES_CRUD_SUPABASE_BINDING__ === true &&
        window.__PETATOE_INVOICE_MANUAL_MULTI_ITEMS_SINGLETON__ === true &&
        typeof window.petInvoiceManualMultiItemsBoot === 'function';
    },
    salesImport: function(){
      return window.__PETATOE_SALES_IMPORT_ENGINE_SINGLETON__ === true &&
        typeof window.processFile === 'function' && typeof window.confirmImport === 'function';
    },
    salesRecords: function(){
      return window.__PETATOE_SALES_CRUD_SUPABASE_BINDING__ === true && typeof window.renderRecords === 'function';
    },
    salesContracts: function(){
      return window.__PETATOE_CONTRACT_CANDIDATES_REPORT_BINDINGS__ === '1';
    },
    salesAnalytics: function(){
      return typeof window.renderDeep === 'function';
    },
    smartSalesInvoices: function(){
      return !!(window.PETATOESalesInvoiceReport && window.PETATOESalesInvoiceReport.__ready === true &&
        window.PETATOESalesInvoiceReport.__owner === 'sales/sales-invoice-report.js' &&
        typeof window.PETATOESalesInvoiceReport.render === 'function' &&
        typeof window.injectSalesInvoiceReport === 'function' &&
        window.PETATOESalesInvoicePrintAdapter && window.PETATOESalesInvoicePrintAdapter.__ready === true);
    },
    smartReports: function(){
      var tabs = window.PETATOESmartTabs || (window.PETATOE && window.PETATOE.SmartReports);
      var services = window.PETATOESmartServices;
      var servicesReady = !!(services && services.__ready && typeof services.scopedData === 'function') ||
        typeof window.smartServicesScopedData === 'function';
      return typeof window.renderSmartReports === 'function' &&
        servicesReady &&
        !!(tabs && tabs.__ready && typeof tabs.setSmartTab === 'function') &&
        typeof window.setSmartTab === 'function' &&
        !!(window.PETATOESmartReportsRuntime && window.PETATOESmartReportsRuntime.__ready === true &&
          typeof window.PETATOESmartReportsRuntime.render === 'function' &&
          typeof window.PETATOESmartReportsRuntime.refresh === 'function');
    },
    reportsUI: function(){
      return !!(
        window.PETATOEReports &&
        window.PETATOECards &&
        window.PETATOETables &&
        window.PETATOEKPI &&
        window.PETATOECharts &&
        window.PETATOEHeatmap &&
        window.PETATOEReportAdapters &&
        window.PETATOEFiltersState &&
        window.PETATOEFiltersRender &&
        window.PETATOEFiltersEvents &&
        window.PETATOEFilters &&
        window.PETATOEFiltersAdapters &&
        window.PETATOEButtons && typeof window.PETATOEButtons.bind === 'function' &&
        window.PETATOEExport &&
        window.PETATOETables && typeof window.PETATOETables.render === 'function' &&
        window.PETATOEFilters && typeof window.PETATOEFilters.normalize === 'function'
      );
    },
    sales: function(){
      return groupContractReady('salesEntry') && groupContractReady('salesImport') &&
        groupContractReady('salesRecords') && groupContractReady('smartSalesInvoices') &&
        groupContractReady('salesContracts');
    },
    printing: function(){
      return !!(
        typeof window.petatoeOpenPdfModal === 'function' &&
        typeof window.petatoeRefreshPdfReport === 'function' &&
        typeof window.petatoePrintPdf === 'function' &&
        typeof window.petatoeExportActivePagePdf === 'function' &&
        typeof window.petatoeEnsureFullPagePdfButtons === 'function' &&
        window.PETATOE_FULL_PAGE_PDF_EXPORT_READY === true
      );
    }
  };


  /* Phase 7: readiness is split into three tiers. Only required contracts
     may block the first render. Optional and deferred providers are reported
     for diagnostics and regression checks, but never hold a route hostage. */
  var optionalReadinessContracts = {
    operations: function(){ return !!(window.PETATOEOperationsFacade && typeof window.PETATOEOperationsFacade.resolve === 'function'); },
    payroll: function(){ return !!(window.PETATOEPayrollRenderBridge && typeof window.PETATOEPayrollRenderBridge.runManualCheck === 'function'); },
    treasury: function(){ return !!(window.PETATOETreasuryRenderBridge && typeof window.PETATOETreasuryRenderBridge.runManualCheck === 'function'); },
    warehouses: function(){ return !!(window.PETATOEWarehouseRenderSnapshotFacade && typeof window.PETATOEWarehouseRenderSnapshotFacade.getRenderSnapshot === 'function'); },
    children: function(){ return !!(window.PETATOEChildrenExpensesFacade && typeof window.PETATOEChildrenExpensesFacade.resolve === 'function'); },
    settingsSetup: function(){ return !!(window.PETATOEObservability && window.PETATOEObservability.__ready === true); },
    smartReports: function(){ return !!(window.PETATOESmartReportsRenderEngine && window.PETATOESmartReportsRenderEngine.__ready === true); }
  };

  var deferredReadinessContracts = {
    operations: function(){ return !!(window.PETATOEOperationsFinalStabilityAudit || window.PETATOEOperationsShadowHarness); },
    payroll: function(){ return !!(window.PETATOEPayrollEventBridge && window.PETATOEPayrollParallelValidation); },
    treasury: function(){ return !!(window.PETATOETreasuryEventBridge && window.PETATOETreasuryParallelValidation); },
    warehouses: function(){ return !!(window.PETATOEWarehouseEventBridge && window.PETATOEWarehouseParallelValidation); },
    children: function(){ return !!(window.PETATOEChildrenExpensesFinalStabilityAudit || window.PETATOEChildrenExpensesControlledMigration); },
    settingsSetup: function(){ return !!window.PETATOEObservability; },
    smartReports: function(){ return !!window.PETATOESmartReportsRuntime; }
  };

  function contractTierReady(registry, name){
    try{
      var contract = registry[name];
      return typeof contract === 'function' ? contract() === true : null;
    }catch(_){ return false; }
  }

  function readinessProfile(name){
    return {
      required: groupContractReady(name),
      optional: contractTierReady(optionalReadinessContracts, name),
      deferred: contractTierReady(deferredReadinessContracts, name)
    };
  }

  function loadDesktopProviderFallback(name){
    var src = desktopProviderFallbacks[name];
    if(!src) return Promise.resolve(false);
    var state = states[name] || (states[name] = {});
    if(state.providerFallbackPromise) return state.providerFallbackPromise;
    state.providerFallbackPromise = loadOne({src:src,defer:false}).then(function(){
      try{ window.dispatchEvent(new CustomEvent('petatoe:desktop-provider-fallback',{detail:{group:name,src:src}})); }catch(_){}
      return true;
    }).catch(function(error){
      state.providerFallbackError = String(error && error.message || error);
      return false;
    });
    return state.providerFallbackPromise;
  }

  function desktopGroupReady(name){
    try{
      var contract = desktopReadinessContracts[name];
      return typeof contract === 'function' ? contract() === true : false;
    }catch(_){ return false; }
  }


  function groupContractReady(name){
    return desktopGroupReady(name);
  }

  function readinessSnapshot(name){
    var profile = readinessProfile(name);
    var services = window.PETATOESmartServices;
    var tabs = window.PETATOESmartTabs || (window.PETATOE && window.PETATOE.SmartReports);
    if(name === 'customer360'){
      return {
        profile: profile,
        renderCustomer360Panel: typeof window.renderCustomer360Panel === 'function',
        showCustomer360: typeof window.showCustomer360 === 'function',
        openCustomer360: typeof window.openCustomer360 === 'function'
      };
    }
    if(name === 'smartReports'){
      return {
        profile: profile,
        renderEngine: !!(window.PETATOESmartReportsRenderEngine && window.PETATOESmartReportsRenderEngine.__ready === true && typeof window.PETATOESmartReportsRenderEngine.render === 'function'),
        smartServices: !!(services && services.__ready && typeof services.scopedData === 'function'),
        legacySmartServices: typeof window.smartServicesScopedData === 'function',
        smartTabs: !!(tabs && tabs.__ready && typeof tabs.setSmartTab === 'function'),
        runtimeController: !!(window.PETATOESmartReportsRuntime && window.PETATOESmartReportsRuntime.__ready === true),
        runtimeRender: !!(window.PETATOESmartReportsRuntime && typeof window.PETATOESmartReportsRuntime.render === 'function'),
        runtimeRefresh: !!(window.PETATOESmartReportsRuntime && typeof window.PETATOESmartReportsRuntime.refresh === 'function')
      };
    }
    if(name === 'operations'){
      var appointments = window.PETATOEAppointments;
      return {
        profile: profile,
        appointmentsApi: !!appointments,
        setTab: !!(appointments && typeof appointments.setTab === 'function'),
        render: !!(appointments && typeof appointments.render === 'function'),
        init: !!(appointments && typeof appointments.init === 'function'),
        vehicles: !!window.PETATOEOperationsVehicles,
        reports: !!window.PETATOEOperationsReports,
        status: !!window.PETATOEOperationsStatus,
        payments: !!window.PETATOEOperationsPayments
      };
    }
    if(name === 'payroll'){
      return {
        profile: profile,
        payroll: !!window.PETATOEPayroll,
        openTab: !!(window.PETATOEPayroll && typeof window.PETATOEPayroll.openTab === 'function'),
        renderSalarySlip: !!(window.PETATOEPayroll && typeof window.PETATOEPayroll.renderSalarySlip === 'function'),
        exportCsv: !!(window.PETATOEPayroll && typeof window.PETATOEPayroll.exportCsv === 'function')
      };
    }
    return { ready: profile.required, profile: profile };
  }

  function waitForGroupContract(name, timeoutMs){
    timeoutMs = Math.max(250, Number(timeoutMs || 6000));
    if(groupContractReady(name)) return Promise.resolve(true);
    return new Promise(function(resolve){
      var deadline = Date.now() + timeoutMs;
      (function check(){
        if(groupContractReady(name)) return resolve(true);
        if(Date.now() >= deadline) return resolve(false);
        window.setTimeout(check, 25);
      })();
    });
  }

  function waitForDesktopGroup(name){
    if(groupContractReady(name)) return Promise.resolve(true);
    var existing = states[name];
    if(existing && existing.promise && existing.status !== 'not-ready' && existing.status !== 'failed') return existing.promise;

    var queue = (groups[name] || []).slice();
    var state = states[name] = existing || {};
    state.status = state.scriptsLoaded ? 'waiting-desktop' : 'loading-desktop';
    state.startedAt = Date.now();
    state.finishedAt = 0;
    state.error = '';
    state.attempts = (state.attempts || 0) + 1;
    var dependencyQueue = (dependencies[name] || []).slice();
    var optionalDependencyQueue = (optionalDependencies[name] || []).slice();
    optionalDependencyQueue.forEach(function(dependency){
      ensureGroup(dependency).catch(function(error){
        if(window.console && console.warn) console.warn('[PETATOE Mobile Gate] optional dependency hydration failed', dependency, '->', name, error);
      });
    });

    state.promise = dependencyQueue.reduce(function(chain, dependency){
      return chain.then(function(){
        return ensureGroup(dependency).then(function(ready){
          if(ready !== true) throw new Error('Dependency not ready: ' + dependency + ' -> ' + name);
          return true;
        });
      });
    }, Promise.resolve()).then(function(){
      if(state.scriptsLoaded || !queue.length) return true;
      return queue.reduce(function(chain, item){
        return chain.then(function(){ return loadOne(item, name, state); });
      }, Promise.resolve()).then(function(){ state.scriptsLoaded = true; return true; });
    }).then(function(){
      state.status = 'waiting-desktop';
      return waitForGroupContract(name, 6000);
    }).then(function(ready){
      state.finishedAt = Date.now();
      state.promise = null;
      if(!ready){
        state.status = 'not-ready';
        state.error = 'Desktop group not ready: ' + name;
        state.readiness = readinessSnapshot(name);
        state.errorAttribution = { group: name, phase: 'provider-contract', lastLoadedScript: state.lastLoadedScript || '', failedScript: state.failedScript || '', readiness: state.readiness, timestamp: Date.now() };
        notify(name, false, new Error(state.error));
        return false;
      }
      state.status = 'loaded';
      state.readiness = readinessSnapshot(name);
      notify(name, true);
      setTimeout(function(){ refreshActiveModule(name); }, 0);
      return true;
    }).catch(function(error){
      state.status = 'failed';
      state.finishedAt = Date.now();
      state.error = String(error && error.message || error);
      state.readiness = readinessSnapshot(name);
      state.errorAttribution = error && error.petatoeAttribution ? error.petatoeAttribution : { group: name, phase: state.currentPhase || 'unknown', lastLoadedScript: state.lastLoadedScript || '', failedScript: state.failedScript || '', message: state.error, timestamp: Date.now() };
      state.promise = null;
      notify(name, false, error);
      return false;
    });
    return state.promise;
  }


  function ensureGroup(name){
    name = normalizeGroup(String(name || ''));
    if(!isMobile) return waitForDesktopGroup(name);

    var existing = states[name];
    if(groupContractReady(name)){
      if(existing){ existing.status = 'loaded'; existing.promise = null; existing.finishedAt = Date.now(); }
      return Promise.resolve(true);
    }
    if(existing && existing.promise && existing.status !== 'not-ready' && existing.status !== 'failed') return existing.promise;

    var queue = (groups[name] || []).slice();
    var dependencyQueue = (dependencies[name] || []).slice();
    if(!queue.length && !dependencyQueue.length) return Promise.resolve(false);
    var state = states[name] = existing || {};
    state.status = state.scriptsLoaded ? 'waiting-provider-contract' : 'loading';
    state.startedAt = Date.now();
    state.finishedAt = 0;
    state.error = '';
    state.attempts = (state.attempts || 0) + 1;
    var optionalDependencyQueue = (optionalDependencies[name] || []).slice();
    optionalDependencyQueue.forEach(function(dependency){
      ensureGroup(dependency).catch(function(error){
        if(window.console && console.warn) console.warn('[PETATOE Mobile Gate] optional dependency hydration failed', dependency, '->', name, error);
      });
    });

    state.promise = dependencyQueue.reduce(function(chain, dependency){
      return chain.then(function(){
        return ensureGroup(dependency).then(function(ready){
          if(ready !== true) throw new Error('Dependency not ready: ' + dependency + ' -> ' + name);
          return true;
        });
      });
    }, Promise.resolve()).then(function(){
      if(state.scriptsLoaded) return true;
      return queue.reduce(function(chain, item){
        return chain.then(function(){ return loadOne(item, name, state); });
      }, Promise.resolve()).then(function(){ state.scriptsLoaded = true; return true; });
    }).then(function(){
      state.status = 'waiting-provider-contract';
      return waitForGroupContract(name, 6000);
    }).then(function(ready){
      state.finishedAt = Date.now();
      state.promise = null;
      if(!ready){
        state.status = 'not-ready';
        state.error = 'Mobile group provider contract not ready: ' + name;
        state.readiness = readinessSnapshot(name);
        state.errorAttribution = { group: name, phase: 'provider-contract', lastLoadedScript: state.lastLoadedScript || '', failedScript: state.failedScript || '', readiness: state.readiness, timestamp: Date.now() };
        notify(name, false, new Error(state.error));
        return false;
      }
      state.status = 'loaded';
      state.readiness = readinessSnapshot(name);
      notify(name, true);
      setTimeout(function(){ refreshActiveModule(name); }, 0);
      return true;
    }).catch(function(error){
      state.status = 'failed';
      state.finishedAt = Date.now();
      state.error = String(error && error.message || error);
      state.readiness = readinessSnapshot(name);
      state.errorAttribution = error && error.petatoeAttribution ? error.petatoeAttribution : { group: name, phase: state.currentPhase || 'unknown', lastLoadedScript: state.lastLoadedScript || '', failedScript: state.failedScript || '', message: state.error, timestamp: Date.now() };
      state.promise = null;
      notify(name, false, error);
      return false;
    });
    return state.promise;
  }


  var screenGroupMap = {
    appointments:'operations', appointmentsMaster:'operations', vehicleOperations:'operations',
    vehicleOperationsReports:'operations', operationKpis:'operations',
    warehouses:'warehouses', warehouseAlerts:'warehouses', treasury:'treasury',
    payroll:'payroll', salarySlip:'payroll', commissionStatement:'commission',
    childrenExpenses:'children', commission:'commission', commissions:'commission', commissionSystem:'commission',
    settings:'settingsSetup', setup:'settingsSetup', users:'settingsSetup', permissions:'settingsSetup', backup:'settingsSetup',
    diagnostics:'diagnostics', observability:'diagnostics', performanceMonitoring:'diagnostics',
    smart:'smartReports', smartReports:'smartReports', smartSalesInvoices:'smartSalesInvoices', salesInvoices:'smartSalesInvoices', salesInvoice:'smartSalesInvoices', customer360:'customer360', customers:'customer360',
    entry:'salesEntry', import:'salesImport', records:'salesRecords', sales:'salesAnalytics', salesContracts:'salesContracts',
    executive:'smartReports', vans:'reportsUI', services:'reportsUI',
    fleet:'fleet', obligations:'obligations', movementCenter:'movement'
  };

  function explicitGroupForElement(el){
    if(!el || !el.getAttribute) return '';
    /* SG-4.6.12: A Smart Reports sub-tab always belongs to the Smart Reports
       interaction surface, even when it declares a secondary runtime group.
       Secondary groups are hydrated by the sub-tab handler after the click is
       allowed through; the startup gate must never capture-block the tab. */
    if(el.getAttribute('data-smart-tab')) return 'smartReports';
    var declared = el.getAttribute('data-pet-lazy-group');
    if(declared) return normalizeGroup(declared);
    var keys = [
      el.getAttribute('data-pet-nav-screen'),
      el.getAttribute('data-tab'),
      el.getAttribute('data-target')
    ];
    for(var i=0;i<keys.length;i++){
      var key = String(keys[i] || '').replace(/^#/,'');
      if(screenGroupMap[key]) return screenGroupMap[key];
    }
    return '';
  }

  function groupForElement(el){
    if(!el) return '';
    if(el.id === 'sideLauncher' || (el.matches && el.matches('[data-v142-toggle], .pet-v142-toggle'))) return '';
    var explicit = explicitGroupForElement(el);
    if(explicit) return explicit;
    var panel = el.closest ? el.closest('.panel,[data-panel]') : null;
    var panelGroup = groupForPanel(panel);
    if(panelGroup) return panelGroup;
    var text = [el.id, el.getAttribute && el.getAttribute('href'), el.getAttribute && el.getAttribute('aria-label'), el.getAttribute && el.getAttribute('title')].join(' ').toLowerCase();
    if(/excel|xlsx|استيراد excel|تصدير excel/.test(text)) return 'xlsx';
    if(/print|pdf|طباعة|تصدير الصفحة/.test(text)) return 'printing';
    if(/customer360/.test(text)) return 'customer360';
    if(/smartreport|smart-report/.test(text)) return 'smartReports';
    if(/salesinvoice|sales-invoice/.test(text)) return 'smartSalesInvoices';
    if(/audit|diagnostic|observability/.test(text)) return 'diagnostics';
    return '';
  }

  function groupForPanel(panel){
    if(!panel) return '';
    var explicit = panel.getAttribute && panel.getAttribute('data-pet-lazy-group');
    if(explicit) return normalizeGroup(explicit);
    var id = String(panel.id || '').replace(/^#/,'');
    if(screenGroupMap[id]) return screenGroupMap[id];
    var marker = (id + ' ' + (panel.getAttribute('data-pet-module') || '')).toLowerCase();
    if(/appointment|vehicleoperations|operationkpis|operation/.test(marker)) return 'operations';
    if(/children/.test(marker)) return 'children';
    if(/warehouse/.test(marker)) return 'warehouses';
    if(/treasury/.test(marker)) return 'treasury';
    if(/commissionstatement|commission/.test(marker)) return 'commission';
    if(/payroll|salaryslip/.test(marker)) return 'payroll';
    if(/settings|setup|permissions|users|backup/.test(marker)) return 'settingsSetup';
    if(/customer360/.test(marker)) return 'customer360';
    if(/smartreport/.test(marker)) return 'smartReports';
    if(/salesinvoice|sales-invoice/.test(marker)) return 'smartSalesInvoices';
    if(/(^|\s)entry(\s|$)/.test(marker)) return 'salesEntry';
    if(/(^|\s)import(\s|$)/.test(marker)) return 'salesImport';
    if(/(^|\s)records(\s|$)/.test(marker)) return 'salesRecords';
    if(/(^|\s)sales(\s|$)/.test(marker)) return 'salesAnalytics';
    if(/observability|diagnostic|audit/.test(marker)) return 'diagnostics';
    if(/fleet/.test(marker)) return 'fleet';
    if(/obligation/.test(marker)) return 'obligations';
    if(/movement/.test(marker)) return 'movement';
    if(/report|analytics/.test(marker)) return 'reportsUI';
    return '';
  }

  function registryLoadGroup(routeId){
    try{
      var registry = window.PETATOERouteRegistry;
      if(!registry || typeof registry.get !== 'function') return '';
      var meta = registry.get(String(routeId || '').replace(/^#/,''));
      return meta && meta.loadGroup ? normalizeGroup(meta.loadGroup) : '';
    }catch(_){ return ''; }
  }

  function groupForRoute(routeId,navigationScreen){
    var screen=String(navigationScreen||'').replace(/^#/,'');
    var route=String(routeId||'').replace(/^#/,'');
    /* Phase D2: route-registry metadata is the canonical owner of business
       module hydration. The legacy screen map remains a compatibility fallback
       for routes not yet registered. */
    var registryGroup = registryLoadGroup(screen) || registryLoadGroup(route);
    if(registryGroup) return registryGroup;
    if(screenGroupMap[screen]) return screenGroupMap[screen];
    if(screenGroupMap[route]) return screenGroupMap[route];
    var panel=document.getElementById(route);
    return groupForPanel(panel);
  }

  function ensureRoute(routeId,navigationScreen){
    var group=groupForRoute(routeId,navigationScreen);
    if(!group) return Promise.resolve(true);
    if(!startupInteractive){ rememberPendingStartupGroup(group); return Promise.resolve(true); }
    return ensureGroup(group);
  }

  var nonBlockingBusinessGroups = {
    operations:true, fleet:true, children:true, warehouses:true, treasury:true,
    payroll:true, commission:true, obligations:true, customer360:true,
    salesEntry:true, salesImport:true, salesRecords:true, salesAnalytics:true,
    smartSalesInvoices:true, salesContracts:true, smartReports:true
  };

  function isRouteNavigationElement(el){
    if(!el || !el.getAttribute) return false;
    if(el.getAttribute('data-pet-lazy-blocking') === 'true') return false;
    var route = el.getAttribute('data-pet-nav-screen') || el.getAttribute('data-tab') || '';
    if(!route) return false;
    return !!(registryLoadGroup(route) || screenGroupMap[String(route).replace(/^#/,'')]);
  }

  function shouldHydrateRouteInBackground(el, group){
    /* Phase D2.2: Records panel activation is router-owned and its base renderer
       is already available from the eager legacy application core. The optional
       sales CRUD binding hydrates in the background, then refreshActiveModule()
       redraws the active records panel. Blocking the click until the provider
       contract resolves caused the canonical navigation click to be swallowed. */
    return !!(nonBlockingBusinessGroups[group] && isRouteNavigationElement(el));
  }

  function installTriggers(){
    if(window.__PETATOE_MOBILE_STARTUP_GATE_TRIGGERS__) return;
    window.__PETATOE_MOBILE_STARTUP_GATE_TRIGGERS__ = true;

    document.addEventListener('pointerdown', function(event){
      var el = event.target && event.target.closest ? event.target.closest('button,a,[data-tab],[data-target],[onclick]') : null;
      var group = groupForElement(el);
      if(group) ensureGroup(group).catch(function(){});
    }, true);

    document.addEventListener('click', function(event){
      var el = event.target && event.target.closest ? event.target.closest('button,a,[data-tab],[data-target],[onclick]') : null;
      var group = groupForElement(el);
      if(el && el.dataset && el.dataset.petatoeLazyReplay === '1'){
        delete el.dataset.petatoeLazyReplay;
        return;
      }
      if(!group || (states[group] && states[group].status === 'loaded')) return;
      /* SG-4.6.5: Smart Reports navigation must never be blocked by provider readiness.
         Start hydration in parallel and allow the canonical Router / inline handler to
         open the screen immediately. A failed or delayed optional dependency must not
         turn the Reports buttons into dead controls. */
      /* Phase D2: navigation into a business screen must stay responsive.
         The route opens immediately while its canonical loadGroup hydrates in
         the background. Non-navigation actions remain blocking, so import,
         export, save, and report actions cannot run before dependencies exist. */
      if(shouldHydrateRouteInBackground(el, group)){
        ensureGroup(group).catch(function(error){
          if(window.console && console.warn) console.warn('[PETATOE Mobile Gate] background route hydration failed', group, error);
        });
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      ensureGroup(group).then(function(ready){
        if(ready !== true || !el || !el.isConnected) return;
        if(el.dataset) el.dataset.petatoeLazyReplay = '1';
        el.click();
      }).catch(function(error){
        if(window.console && console.warn) console.warn('[PETATOE Mobile Gate] route hydration failed', group, error);
      });
    }, true);

    document.addEventListener('change', function(event){
      var el = event.target;
      if(el && el.matches && el.matches('input[type="file"]')) ensureGroup('xlsx').catch(function(){});
    }, true);

    document.addEventListener('petatoe:tabchange', function(event){
      var detail = event && event.detail || {};
      var id = detail.tabId;
      if(!id) return;
      ensureRoute(id,detail.navigationScreen).catch(function(){});
    }, true);

    /* Phase P6: canonical pointerdown and petatoe:tabchange signals own lazy hydration.
       The previous document-wide class MutationObserver watched every active-state
       mutation and duplicated the same group resolution on each route. */

    function markStartupInteractive(){
      startupInteractive = true;
      try{
        var activePanel = document.querySelector('.panel.active, .panel.is-active, [data-panel].active');
        var activeGroup = groupForPanel(activePanel);
        if(activeGroup) rememberPendingStartupGroup(activeGroup);
      }catch(_e){}
      hydratePendingStartupGroups();
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markStartupInteractive, { once: true });
    else markStartupInteractive();

    /* R5: Keep business modules demand-loaded. Only the remote localization parity
       loader is deferred until after the first interactive frame because the local
       canonical dictionary already owns first paint. */
    window.addEventListener('load', function(){
      var run = function(){ ensureGroup('localizationRemote').catch(function(){}); };
      if(typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 4000 });
      else setTimeout(run, 1800);
    }, { once: true });
  }

  function getGroupStatus(name){
    name = normalizeGroup(String(name || ''));
    var state = states[name] || {};
    return {
      group: name,
      ready: groupContractReady(name),
      status: state.status || (groupContractReady(name) ? 'loaded' : 'idle'),
      attempts: state.attempts || 0,
      scriptsLoaded: !!state.scriptsLoaded,
      startedAt: state.startedAt || 0,
      finishedAt: state.finishedAt || 0,
      error: state.error || '',
      readiness: readinessSnapshot(name)
    };
  }

  function invalidateGroup(name, reason){
    name = normalizeGroup(String(name || ''));
    var state = states[name] || (states[name] = {});
    state.promise = null;
    state.status = groupContractReady(name) ? 'loaded' : 'idle';
    state.error = reason ? String(reason) : '';
    state.readiness = readinessSnapshot(name);
    return getGroupStatus(name);
  }

  function installProviderReadyRecovery(){
    var bindings = [
      ['petatoe:smart-services-ready','smartReports'],
      ['petatoe:smart-tabs-ready','smartReports'],
      ['petatoe:smart-reports-ready','smartReports'],
      ['petatoe:payroll-provider-ready','payroll']
    ];
    bindings.forEach(function(binding){
      window.addEventListener(binding[0], function(){
        var name = binding[1];
        var state = states[name];
        if(state && (state.status === 'not-ready' || state.status === 'failed')) invalidateGroup(name, binding[0]);
      });
      document.addEventListener(binding[0], function(){
        var name = binding[1];
        var state = states[name];
        if(state && (state.status === 'not-ready' || state.status === 'failed')) invalidateGroup(name, binding[0]);
      });
    });
  }

  function registryAudit(){
    var missingDependencies = [];
    var cycles = [];
    var visiting = Object.create(null);
    var visited = Object.create(null);
    function walk(group, trail){
      if(visiting[group]){ cycles.push(trail.concat(group)); return; }
      if(visited[group]) return;
      visiting[group] = true;
      (dependencies[group] || []).forEach(function(dependency){
        if(!groups[dependency] && !dependencies[dependency] && !groupContractReady(dependency)){
          missingDependencies.push({group:group,dependency:dependency});
        }
        walk(dependency, trail.concat(group));
      });
      visiting[group] = false;
      visited[group] = true;
    }
    Object.keys(groups).concat(Object.keys(dependencies)).forEach(function(group){ walk(group, []); });
    return {
      valid: registrationConflicts.length === 0 && missingDependencies.length === 0 && cycles.length === 0,
      registrationConflicts: registrationConflicts.slice(),
      missingDependencies: missingDependencies,
      dependencyCycles: cycles
    };
  }

  function snapshot(){
    var registered = {};
    Object.keys(groups).forEach(function(k){ registered[k] = groups[k].map(function(item){ return item.src; }); });
    return { mobile: isMobile, desktopDecomposition: !isMobile, version: '10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1', registered: registered, registryAudit: registryAudit(), diagnostics: { active: runtimeDiagnostics.active, history: runtimeDiagnostics.history.slice() }, states: JSON.parse(JSON.stringify(states, function(key,value){ return key === 'promise' ? undefined : value; })) };
  }

  window.PETATOEMobileStartupGate = {
    version: '10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1',
    isMobile: isMobile,
    registerOrWrite: registerOrWrite,
    ensureGroup: ensureGroup,
    ensureRoute: ensureRoute,
    groupForRoute: groupForRoute,
    registryLoadGroup: registryLoadGroup,
    normalizeGroup: normalizeGroup,
    getGroupStatus: getGroupStatus,
    invalidateGroup: invalidateGroup,
    snapshot: snapshot,
    registryAudit: registryAudit,
    resolveGroupForScreen: function(screen){ return screenGroupMap[String(screen || '')] || ''; },
    getReadinessProfile: function(name){ return readinessProfile(normalizeGroup(String(name || ''))); },
    getRuntimeDiagnostics: function(){ return { active: runtimeDiagnostics.active, history: runtimeDiagnostics.history.slice() }; },
    finishBoot: finishBoot,
    armBootDeadline: armBootDeadline
  };

  installProviderReadyRecovery();
  installTriggers();
  scheduleCriticalShellRelease();
})();
