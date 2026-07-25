(function(){
  'use strict';

  var MOBILE_QUERY = '(max-width: 760px)';
  var isMobile = false;
  try { isMobile = !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches); } catch (_) {}

  var groups = Object.create(null);
  var states = Object.create(null);
  var startupInteractive = document.readyState !== 'loading';
  var mobileBootStartedAt = Date.now();
  var mobileBootFinished = false;
  var mobileBootDeadlineId = 0;

  function finishMobileBoot(reason){
    if(!isMobile || mobileBootFinished) return false;
    mobileBootFinished = true;
    if(mobileBootDeadlineId){
      clearTimeout(mobileBootDeadlineId);
      mobileBootDeadlineId = 0;
    }
    try{ document.documentElement.classList.remove('pet-mobile-booting'); }catch(_e){}
    try{
      window.__PETATOE_MOBILE_BOOT_METRICS__ = {
        startedAt: mobileBootStartedAt,
        finishedAt: Date.now(),
        durationMs: Math.max(0, Date.now() - mobileBootStartedAt),
        reason: String(reason || 'critical-shell-ready')
      };
    }catch(_e){}
    try{ window.dispatchEvent(new CustomEvent('petatoe:mobile-boot-finished', { detail: window.__PETATOE_MOBILE_BOOT_METRICS__ || {} })); }catch(_e){}
    return true;
  }

  function armMobileBootDeadline(timeoutMs){
    if(!isMobile || mobileBootFinished) return;
    var delay = Math.max(700, Number(timeoutMs) || 1400);
    if(mobileBootDeadlineId) clearTimeout(mobileBootDeadlineId);
    mobileBootDeadlineId = setTimeout(function(){ finishMobileBoot('safety-deadline'); }, delay);
  }

  function scheduleCriticalShellRelease(){
    if(!isMobile || mobileBootFinished) return;
    var release = function(){
      if(typeof window.requestAnimationFrame === 'function'){
        window.requestAnimationFrame(function(){
          window.requestAnimationFrame(function(){ finishMobileBoot('critical-shell-first-paint'); });
        });
      }else{
        setTimeout(function(){ finishMobileBoot('critical-shell-first-paint'); }, 0);
      }
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', release, { once: true });
    else release();
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
    smartReports: 'smartReports', smart: 'smartReports', analytics: 'smartReports',
    reportsUI: 'reportsUI', reports: 'reportsUI', printing: 'printing', print: 'printing', pdf: 'printing',
    sales: 'sales', invoices: 'sales', commission: 'commission', commissions: 'commission'
  };

  var dependencies = {
    smartReports: ['reportsUI'],
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
    if(!isMobile){
      writeDesktopScript(src, !!defer);
      return;
    }
    if(!groups[group]) groups[group] = [];
    groups[group].push({ src: src, defer: !!defer });
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

  function ensureGroup(name){
    name = normalizeGroup(String(name || ''));
    if(!isMobile) return Promise.resolve(true);
    if(states[name] && states[name].promise) return states[name].promise;
    var queue = (groups[name] || []).slice();
    if(!queue.length) return Promise.resolve(false);
    var state = states[name] = { status: 'loading', startedAt: Date.now(), promise: null };
    var dependencyQueue = (dependencies[name] || []).slice();
    state.promise = dependencyQueue.reduce(function(chain, dependency){
      return chain.then(function(){ return ensureGroup(dependency); });
    }, Promise.resolve()).then(function(){
      return queue.reduce(function(chain, item){
        return chain.then(function(){ return loadOne(item); });
      }, Promise.resolve());
    }).then(function(){
      state.status = 'loaded';
      state.finishedAt = Date.now();
      notify(name, true);
      setTimeout(function(){ refreshActiveModule(name); }, 0);
      return true;
    }).catch(function(error){
      state.status = 'failed';
      state.error = String(error && error.message || error);
      notify(name, false, error);
      throw error;
    });
    return state.promise;
  }

  function groupForElement(el){
    if(!el) return '';
    var text = [el.id, el.getAttribute && el.getAttribute('data-tab'), el.getAttribute && el.getAttribute('data-target'), el.getAttribute && el.getAttribute('href'), el.textContent].join(' ').toLowerCase();
    if(/smartreport|smart-report|تحليل ذكي|التقارير الذكية|customer360|عميل 360/.test(text)) return 'smartReports';
    if(/commission|عمولة|عمولات/.test(text)) return 'commission';
    if(/salesinvoice|sales-invoice|invoice|فاتورة|فواتير|مبيعات/.test(text)) return 'sales';
    if(/print|pdf|طباعة|تصدير الصفحة/.test(text)) return 'printing';
    if(/report|analytics|dashboard report|تقرير|تقارير|تحليلات/.test(text)) return 'reportsUI';
    if(/appointment|operation|موعد|تشغيل/.test(text)) return 'operations';
    if(/fleet|أسطول/.test(text)) return 'fleet';
    if(/obligation|التزام|التزامات/.test(text)) return 'obligations';
    if(/movementcenter|movement center|مركز الحركات|الحركات اليدوية/.test(text)) return 'movement';
    if(/settings|setup|إعدادات|التهيئة/.test(text)) return 'settingsSetup';
    if(/payroll|salary|commissionstatement|راتب|رواتب|كشف الراتب/.test(text)) return 'payroll';
    if(/treasury|خزين/.test(text)) return 'treasury';
    if(/warehouse|مخزن|مخازن/.test(text)) return 'warehouses';
    if(/childrenexpenses|children|مصروفات الأبناء/.test(text)) return 'children';
    if(/audit|diagnostic|observability|performance monitoring|تدقيق|مراقبة الأداء|الأداء والمراقبة/.test(text)) return 'diagnostics';
    if(/excel|xlsx|استيراد|تصدير/.test(text)) return 'xlsx';
    return '';
  }

  function groupForPanel(panel){
    if(!panel) return '';
    var marker = ((panel.id || '') + ' ' + (panel.getAttribute('data-pet-module') || '')).toLowerCase();
    if(/smartreport|smart-report|customer360/.test(marker)) return 'smartReports';
    if(/commission/.test(marker)) return 'commission';
    if(/salesinvoice|sales-invoice|invoice|sales/.test(marker)) return 'sales';
    if(/report|analytics/.test(marker)) return 'reportsUI';
    if(/appointment|operation|vehicleoperations/.test(marker)) return 'operations';
    if(/fleet/.test(marker)) return 'fleet';
    if(/obligation/.test(marker)) return 'obligations';
    if(/movement/.test(marker)) return 'movement';
    if(/settings|setup/.test(marker)) return 'settingsSetup';
    if(/payroll|salaryslip|commissionstatement/.test(marker)) return 'payroll';
    if(/treasury/.test(marker)) return 'treasury';
    if(/warehouse/.test(marker)) return 'warehouses';
    if(/observability|diagnostic|audit/.test(marker)) return 'diagnostics';
    if(/children/.test(marker)) return 'children';
    return '';
  }

  function installTriggers(){
    if(!isMobile || window.__PETATOE_MOBILE_STARTUP_GATE_TRIGGERS__) return;
    window.__PETATOE_MOBILE_STARTUP_GATE_TRIGGERS__ = true;

    document.addEventListener('pointerdown', function(event){
      var el = event.target && event.target.closest ? event.target.closest('button,a,[data-tab],[data-target],[onclick]') : null;
      var group = groupForElement(el);
      if(group) ensureGroup(group).catch(function(){});
    }, true);

    document.addEventListener('click', function(event){
      var el = event.target && event.target.closest ? event.target.closest('button,a,[data-tab],[data-target],[onclick]') : null;
      var group = groupForElement(el);
      if(!group || (states[group] && states[group].status === 'loaded')) return;
      if(el && el.dataset && el.dataset.petatoeLazyReplay === '1'){
        delete el.dataset.petatoeLazyReplay;
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      ensureGroup(group).then(function(){
        if(!el || !el.isConnected) return;
        if(el.dataset) el.dataset.petatoeLazyReplay = '1';
        el.click();
      }).catch(function(){});
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

    var observer = new MutationObserver(function(mutations){
      if(!startupInteractive) return;
      for(var i=0;i<mutations.length;i++){
        var target = mutations[i].target;
        if(target && target.nodeType === 1 && target.classList && (target.classList.contains('active') || target.classList.contains('is-active'))){
          var panel = target.matches('.panel,[data-pet-module]') ? target : target.closest('.panel,[data-pet-module]');
          var group = groupForPanel(panel);
          if(group){ ensureGroup(group).catch(function(){}); return; }
        }
      }
    });
    observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'] });

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

  function snapshot(){
    var registered = {};
    Object.keys(groups).forEach(function(k){ registered[k] = groups[k].length; });
    return { mobile: isMobile, version: '10.0.22-mobile-main-menu-redesign-n3', registered: registered, states: JSON.parse(JSON.stringify(states, function(key,value){ return key === 'promise' ? undefined : value; })) };
  }

  window.PETATOEMobileStartupGate = {
    version: '10.0.22-mobile-main-menu-redesign-n3',
    isMobile: isMobile,
    registerOrWrite: registerOrWrite,
    ensureGroup: ensureGroup,
    normalizeGroup: normalizeGroup,
    snapshot: snapshot,
    finishBoot: finishMobileBoot,
    armBootDeadline: armMobileBootDeadline
  };

  armMobileBootDeadline(1400);
  scheduleCriticalShellRelease();
  installTriggers();
})();
