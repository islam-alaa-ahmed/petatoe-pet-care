(function(){
  'use strict';

  var MOBILE_QUERY = '(max-width: 760px), (max-height: 600px) and (hover: none) and (pointer: coarse)';
  var isMobile = false;
  try { isMobile = window.PETATOEDeviceProfile ? window.PETATOEDeviceProfile.isMobileDevice() : !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches); } catch (_) {}

  var groups = Object.create(null);
  var states = Object.create(null);
  var desktopLazyGroups = {
    diagnostics: true, xlsx: true, settingsSetup: true, children: true,
    operations: true, warehouses: true, payroll: true, treasury: true,
    smartReports: true, customer360: true, sales: true, commission: true, printing: true
  };

  function shouldLazyLoad(group){
    group = normalizeGroup(String(group || ''));
    return isMobile || desktopLazyGroups[group] === true;
  }
  var startupInteractive = document.readyState !== 'loading';

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
    payroll: 'payroll', salarySlip: 'payroll', commissionStatement: 'payroll',
    treasury: 'treasury',
    warehouse: 'warehouses', warehouses: 'warehouses', warehouseAlerts: 'warehouses',
    children: 'children', childrenExpenses: 'children',
    fleet: 'fleet', obligations: 'obligations', movement: 'movement', movementCenter: 'movement',
    settingsSetup: 'settingsSetup', localizationRemote: 'localizationRemote',
    xlsx: 'xlsx', excel: 'xlsx', diagnostics: 'diagnostics', audit: 'diagnostics', observability: 'diagnostics',
    smartReports: 'smartReports', smart: 'smartReports', analytics: 'smartReports', customer360: 'customer360', customers: 'customer360',
    reportsUI: 'reportsUI', reports: 'reportsUI', printing: 'printing', print: 'printing', pdf: 'printing',
    sales: 'sales', invoices: 'sales', commission: 'commission', commissions: 'commission'
  };

  var dependencies = {
    smartReports: ['reportsUI'],
    customer360: [],
    sales: ['reportsUI'],
    printing: ['reportsUI']
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
    if(!groups[group]) groups[group] = [];
    var lazy = shouldLazyLoad(group);
    groups[group].push({ src: src, defer: !!defer, desktopWritten: !lazy });
    if(!lazy){
      writeDesktopScript(src, !!defer);
      return;
    }
  }

  function loadOne(item){
    return new Promise(function(resolve, reject){
      var node = document.createElement('script');
      node.src = item.src;
      node.async = false;
      node.dataset.petatoeMobileLazyLoaded = '1';
      node.onload = function(){
        if(/xlsx/i.test(item.src)){
          try{ delete window.__PETATOE_XLSX_STUB__; }catch(_){ window.__PETATOE_XLSX_STUB__ = false; }
        }
        resolve(item.src);
      };
      node.onerror = function(){ reject(new Error('Unable to load ' + item.src)); };
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
        if(window.PETATOECommissionRuntime && typeof window.PETATOECommissionRuntime.ensurePanels === 'function') window.PETATOECommissionRuntime.ensurePanels();
        if(tabId === 'commissions' && typeof window.renderCommissionSystem === 'function') window.renderCommissionSystem();
        else if(tabId === 'commissionStatement' && typeof window.renderCommissionStatementPage === 'function') window.renderCommissionStatementPage();
      }else if(group === 'smartReports'){
        var smartRuntime = window.PETATOESmartReportsRuntime;
        if(smartRuntime && smartRuntime.__ready && typeof smartRuntime.open === 'function') smartRuntime.open('', 'lazy-hydration');
        else if(smartRuntime && smartRuntime.__ready && typeof smartRuntime.render === 'function') smartRuntime.render('', 'lazy-hydration');
      }else if(group === 'customer360' && typeof window.renderCustomer360Panel === 'function'){
        window.renderCustomer360Panel();
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
        document.dispatchEvent(new CustomEvent('petatoe:tabchange', { detail: { tabId: tabId, lazyHydration: true } }));
      }
    }catch(e){
      if(window.console && console.warn) console.warn('[PETATOE Mobile Gate] refresh failed', group, e);
    }
  }


  var desktopProviderFallbacks = {
    payroll: 'payroll/payroll-core.js?v=9.1.5'
  };

  var desktopReadinessContracts = {
    xlsx: function(){
      return !!(window.XLSX && window.XLSX.utils && typeof window.XLSX.utils.book_new === 'function');
    },
    operations: function(){
      var appointments = window.PETATOEAppointments || window.__PETATOEAppointmentsLegacyEngine || window.PETATOEOperationsAppointmentsInternal;
      return !!(appointments &&
        typeof appointments.setTab === 'function' &&
        (typeof appointments.render === 'function' || typeof appointments.init === 'function') &&
        window.PETATOEOperationsVehicles &&
        window.PETATOEOperationsReports &&
        window.PETATOEOperationsStatus &&
        window.PETATOEOperationsPayments);
    },
    warehouses: function(){
      return !!(window.PETATOEWarehouses && typeof window.PETATOEWarehouses.render === 'function' &&
        window.PETATOEWarehouseUI && typeof window.PETATOEWarehouseUI.renderAll === 'function');
    },
    treasury: function(){
      return !!(window.PETATOETreasury && typeof window.PETATOETreasury.render === 'function');
    },
    children: function(){
      return !!(window.PETATOEChildrenExpenses && typeof window.PETATOEChildrenExpenses.render === 'function');
    },
    commission: function(){
      var runtime = window.PETATOECommissionRuntime;
      if(runtime && typeof runtime.ensurePanels === 'function') runtime.ensurePanels();
      return !!(runtime && runtime.__ready === true &&
        typeof runtime.ensurePanels === 'function' &&
        typeof window.renderCommissionSystem === 'function' &&
        typeof window.setCommissionTab === 'function' &&
        typeof window.renderCommissionStatementPage === 'function' &&
        document.getElementById('commissions') &&
        document.getElementById('commissionStatement'));
    },
    customer360: function(){
      return typeof window.renderCustomer360Panel === 'function' &&
        typeof window.showCustomer360 === 'function' &&
        typeof window.openCustomer360 === 'function';
    },
    settingsSetup: function(){
      return typeof window.renderSettingsPanelV110 === 'function';
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
        typeof window.PETATOEPayroll.exportCsv === 'function');
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
      return !!(window.PETATOEReports || typeof window.renderReports === 'function' || typeof window.renderDashboardAll === 'function');
    },
    sales: function(){
      return !!(window.PETATOESales || window.PETATOESalesInvoiceReport || typeof window.renderDeep === 'function');
    },
    printing: function(){
      return !!(window.PETATOEPDF || typeof window.petatoeRefreshPdfReport === 'function' || typeof window.exportPagePDF === 'function');
    }
  };

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
    var services = window.PETATOESmartServices;
    var tabs = window.PETATOESmartTabs || (window.PETATOE && window.PETATOE.SmartReports);
    if(name === 'customer360'){
      return {
        renderCustomer360Panel: typeof window.renderCustomer360Panel === 'function',
        showCustomer360: typeof window.showCustomer360 === 'function',
        openCustomer360: typeof window.openCustomer360 === 'function'
      };
    }
    if(name === 'smartReports'){
      return {
        renderSmartReports: typeof window.renderSmartReports === 'function',
        smartServices: !!(services && services.__ready && typeof services.scopedData === 'function'),
        legacySmartServices: typeof window.smartServicesScopedData === 'function',
        smartTabs: !!(tabs && tabs.__ready && typeof tabs.setSmartTab === 'function'),
        setSmartTab: typeof window.setSmartTab === 'function',
        runtimeController: !!(window.PETATOESmartReportsRuntime && window.PETATOESmartReportsRuntime.__ready === true),
        runtimeRender: !!(window.PETATOESmartReportsRuntime && typeof window.PETATOESmartReportsRuntime.render === 'function'),
        runtimeRefresh: !!(window.PETATOESmartReportsRuntime && typeof window.PETATOESmartReportsRuntime.refresh === 'function')
      };
    }
    if(name === 'operations'){
      var appointments = window.PETATOEAppointments || window.__PETATOEAppointmentsLegacyEngine || window.PETATOEOperationsAppointmentsInternal;
      return {
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
        payroll: !!window.PETATOEPayroll,
        openTab: !!(window.PETATOEPayroll && typeof window.PETATOEPayroll.openTab === 'function'),
        renderSalarySlip: !!(window.PETATOEPayroll && typeof window.PETATOEPayroll.renderSalarySlip === 'function'),
        exportCsv: !!(window.PETATOEPayroll && typeof window.PETATOEPayroll.exportCsv === 'function')
      };
    }
    return { ready: groupContractReady(name) };
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
        return chain.then(function(){ return loadOne(item); });
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
    if(!queue.length) return Promise.resolve(false);
    var state = states[name] = existing || {};
    state.status = state.scriptsLoaded ? 'waiting-provider-contract' : 'loading';
    state.startedAt = Date.now();
    state.finishedAt = 0;
    state.error = '';
    state.attempts = (state.attempts || 0) + 1;
    var dependencyQueue = (dependencies[name] || []).slice();

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
        return chain.then(function(){ return loadOne(item); });
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
    payroll:'payroll', salarySlip:'payroll', commissionStatement:'payroll',
    childrenExpenses:'children', commission:'commission', commissions:'commission', commissionSystem:'commission',
    settings:'settingsSetup', setup:'settingsSetup', users:'settingsSetup', permissions:'settingsSetup', backup:'settingsSetup',
    diagnostics:'diagnostics', observability:'diagnostics', performanceMonitoring:'diagnostics',
    smartReports:'smartReports', customer360:'customer360', customers:'customer360', salesInvoice:'sales', sales:'sales',
    fleet:'fleet', obligations:'obligations', movementCenter:'movement'
  };

  function explicitGroupForElement(el){
    if(!el || !el.getAttribute) return '';
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
    if(/salesinvoice|sales-invoice/.test(text)) return 'sales';
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
    if(/payroll|salaryslip|commissionstatement/.test(marker)) return 'payroll';
    if(/commission/.test(marker)) return 'commission';
    if(/settings|setup|permissions|users|backup/.test(marker)) return 'settingsSetup';
    if(/customer360/.test(marker)) return 'customer360';
    if(/smartreport/.test(marker)) return 'smartReports';
    if(/salesinvoice|sales-invoice|invoice/.test(marker)) return 'sales';
    if(/observability|diagnostic|audit/.test(marker)) return 'diagnostics';
    if(/fleet/.test(marker)) return 'fleet';
    if(/obligation/.test(marker)) return 'obligations';
    if(/movement/.test(marker)) return 'movement';
    if(/report|analytics/.test(marker)) return 'reportsUI';
    return '';
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
      if(!startupInteractive) return;
      var id = event && event.detail && event.detail.tabId;
      if(!id) return;
      var panel = document.getElementById(id);
      var group = groupForPanel(panel);
      if(group) ensureGroup(group).catch(function(){});
    }, true);

    /* Phase P6: canonical pointerdown and petatoe:tabchange signals own lazy hydration.
       The previous document-wide class MutationObserver watched every active-state
       mutation and duplicated the same group resolution on each route. */

    function markStartupInteractive(){ startupInteractive = true; }
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

  function snapshot(){
    var registered = {};
    Object.keys(groups).forEach(function(k){ registered[k] = groups[k].length; });
    return { mobile: isMobile, desktopDecomposition: !isMobile, version: '10.0.25-sg2-runtime-hydration-fix-2', registered: registered, states: JSON.parse(JSON.stringify(states, function(key,value){ return key === 'promise' ? undefined : value; })) };
  }

  window.PETATOEMobileStartupGate = {
    version: '10.0.25-sg2-runtime-hydration-fix-2',
    isMobile: isMobile,
    registerOrWrite: registerOrWrite,
    ensureGroup: ensureGroup,
    normalizeGroup: normalizeGroup,
    getGroupStatus: getGroupStatus,
    invalidateGroup: invalidateGroup,
    snapshot: snapshot,
    finishBoot: finishBoot,
    armBootDeadline: armBootDeadline
  };

  installProviderReadyRecovery();
  installTriggers();
  scheduleCriticalShellRelease();
})();
