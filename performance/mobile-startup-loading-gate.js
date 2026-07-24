(function(){
  'use strict';

  var MOBILE_QUERY = '(max-width: 760px)';
  var isMobile = false;
  try { isMobile = !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches); } catch (_) {}

  var groups = Object.create(null);
  var states = Object.create(null);
  var aliases = {
    operation: 'operations', operations: 'operations', appointments: 'operations',
    payroll: 'payroll', salarySlip: 'payroll', commissionStatement: 'payroll',
    treasury: 'treasury',
    warehouse: 'warehouses', warehouses: 'warehouses', warehouseAlerts: 'warehouses',
    children: 'children', childrenExpenses: 'children',
    xlsx: 'xlsx', excel: 'xlsx', diagnostics: 'diagnostics', audit: 'diagnostics', observability: 'diagnostics'
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
    state.promise = queue.reduce(function(chain, item){
      return chain.then(function(){ return loadOne(item); });
    }, Promise.resolve()).then(function(){
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
    if(/appointment|operation|موعد|تشغيل/.test(text)) return 'operations';
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
    if(/appointment|operation|vehicleoperations/.test(marker)) return 'operations';
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

    document.addEventListener('change', function(event){
      var el = event.target;
      if(el && el.matches && el.matches('input[type="file"]')) ensureGroup('xlsx').catch(function(){});
    }, true);

    document.addEventListener('petatoe:tabchange', function(event){
      var id = event && event.detail && event.detail.tabId;
      if(!id) return;
      var panel = document.getElementById(id);
      var group = groupForPanel(panel);
      if(group) ensureGroup(group).catch(function(){});
    }, true);

    var observer = new MutationObserver(function(mutations){
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

    window.addEventListener('load', function(){
      var schedule = window.requestIdleCallback || function(cb){ return setTimeout(cb, 1); };
      setTimeout(function(){
        var order = ['operations','payroll','treasury','warehouses','children'];
        var i = 0;
        function next(){
          if(i >= order.length) return;
          var group = order[i++];
          schedule(function(){ ensureGroup(group).catch(function(){}).finally(function(){ setTimeout(next, 1200); }); }, { timeout: 5000 });
        }
        next();
      }, 12000);
    }, { once: true });
  }

  function snapshot(){
    var registered = {};
    Object.keys(groups).forEach(function(k){ registered[k] = groups[k].length; });
    return { mobile: isMobile, version: '10.0.12-runtime-ownership-p2-5', registered: registered, states: JSON.parse(JSON.stringify(states, function(key,value){ return key === 'promise' ? undefined : value; })) };
  }

  window.PETATOEMobileStartupGate = {
    version: '10.0.12-runtime-ownership-p2-5',
    isMobile: isMobile,
    registerOrWrite: registerOrWrite,
    ensureGroup: ensureGroup,
    normalizeGroup: normalizeGroup,
    snapshot: snapshot
  };

  installTriggers();
})();
