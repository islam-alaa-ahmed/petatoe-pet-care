(function operationsNavigationRuntimeTracer(){
  'use strict';
  if (window.PETATOEOperationsNavTrace && window.PETATOEOperationsNavTrace.version) return;

  var VERSION = '1.0.0';
  var records = [];
  var seq = 0;
  var started = false;
  var observers = [];
  var restoreFns = [];
  var wrapped = typeof WeakSet === 'function' ? new WeakSet() : null;
  var operationTabs = {
    appointments: true,
    vehicleOperations: true,
    vehicleOperationsReports: true,
    operationKpis: true
  };

  function now(){
    try { return performance.now().toFixed(3); } catch (_) { return String(Date.now()); }
  }
  function stack(){
    try {
      return String(new Error().stack || '').split('\n').slice(2, 11).join('\n');
    } catch (_) { return ''; }
  }
  function safe(value, depth){
    depth = depth || 0;
    if (depth > 3) return '[depth-limit]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (value instanceof Element) return describeElement(value);
    if (value instanceof Event) return {type:value.type, detail:safe(value.detail, depth+1)};
    if (Array.isArray(value)) return value.slice(0, 20).map(function(v){ return safe(v, depth+1); });
    if (typeof value === 'object') {
      var out = {};
      Object.keys(value).slice(0, 30).forEach(function(k){
        try { out[k] = safe(value[k], depth+1); } catch (_) { out[k] = '[unreadable]'; }
      });
      return out;
    }
    return String(value);
  }
  function describeElement(el){
    if (!el || el.nodeType !== 1) return null;
    var attrs = {};
    ['id','class','data-tab','data-screen','data-pet-nav-screen','data-appointments-subtab','data-smart-open','aria-hidden','hidden'].forEach(function(name){
      var v = el.getAttribute && el.getAttribute(name);
      if (v !== null) attrs[name] = v;
    });
    return {
      tag: el.tagName,
      text: String(el.textContent || '').replace(/\s+/g,' ').trim().slice(0,120),
      attrs: attrs,
      html: String(el.outerHTML || '').slice(0,700)
    };
  }
  function activeState(){
    var activePanels = Array.prototype.slice.call(document.querySelectorAll('.panel.active,[role="tabpanel"].active')).map(describeElement);
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-appointment-section].active')).map(describeElement);
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-appointment-tab].active,#petatoe-enterprise-navigation button.active')).map(describeElement);
    return {activePanels:activePanels, activeAppointmentSections:sections, activeButtons:tabs};
  }
  function log(type, data, includeStack){
    if (!started && type !== 'tracer:start' && type !== 'tracer:stop') return;
    var rec = {
      seq: ++seq,
      t: now(),
      iso: new Date().toISOString(),
      type: type,
      data: safe(data),
      state: activeState()
    };
    if (includeStack) rec.stack = stack();
    records.push(rec);
    try { console.log('[PETATOE OPS TRACE #' + rec.seq + '] ' + type, rec); } catch (_) {}
    return rec;
  }

  function relevantButton(el){
    if (!el || !el.closest) return null;
    var b = el.closest('button,[role="button"],a');
    if (!b) return null;
    var tab = b.getAttribute('data-tab');
    var screen = b.getAttribute('data-pet-nav-screen') || b.getAttribute('data-screen');
    if (operationTabs[tab] || /appointments|vehicleOperations|operationKpis/i.test(String(screen || ''))) return b;
    return null;
  }

  function clickCapture(e){
    var b = relevantButton(e.target);
    if (!b) return;
    log('click:capture', {
      target: describeElement(e.target),
      currentTarget: describeElement(e.currentTarget),
      button: describeElement(b),
      defaultPrevented: e.defaultPrevented,
      eventPhase: e.eventPhase,
      path: typeof e.composedPath === 'function' ? e.composedPath().slice(0,12).map(function(n){return n instanceof Element ? describeElement(n) : String(n);}) : []
    }, true);
    setTimeout(function(){ log('click:post-task', {button:describeElement(b), defaultPrevented:e.defaultPrevented}, false); }, 0);
    setTimeout(function(){ log('click:post-100ms', {button:describeElement(b)}, false); }, 100);
    setTimeout(function(){ log('click:post-500ms', {button:describeElement(b)}, false); }, 500);
  }

  function eventObserver(e){
    if (e.type === 'petatoe:tabchange' || e.type === 'petatoe:appointments-ready' || e.type === 'petatoe:appointments-intent-applied') {
      log('event:' + e.type, {detail:e.detail}, true);
    }
  }

  function wrapMethod(owner, name, label){
    if (!owner || typeof owner[name] !== 'function') return false;
    var original = owner[name];
    if (original.__petatoeOpsTraceWrapped) return true;
    if (wrapped && wrapped.has(original)) return true;
    function traced(){
      var args = Array.prototype.slice.call(arguments);
      log('call:' + label, {args:args}, true);
      var result;
      try {
        result = original.apply(this, args);
        log('return:' + label, {result:result}, false);
        return result;
      } catch (err) {
        log('throw:' + label, {name:err && err.name, message:err && err.message, stack:err && err.stack}, true);
        throw err;
      }
    }
    try {
      Object.defineProperty(traced, '__petatoeOpsTraceWrapped', {value:true});
      Object.defineProperty(traced, '__petatoeOpsTraceOriginal', {value:original});
    } catch (_) { traced.__petatoeOpsTraceWrapped = true; traced.__petatoeOpsTraceOriginal = original; }
    try {
      owner[name] = traced;
      if (wrapped) wrapped.add(original);
      restoreFns.push(function(){ if (owner[name] === traced) owner[name] = original; });
      log('hook:installed', {label:label}, false);
      return true;
    } catch (err) {
      log('hook:failed', {label:label, message:err && err.message}, false);
      return false;
    }
  }

  function installHooks(){
    wrapMethod(window.PETATOERouter, 'openTab', 'PETATOERouter.openTab');
    wrapMethod(window, 'petatoeSidebarOpenTab', 'window.petatoeSidebarOpenTab');
    wrapMethod(window.PETATOEAppointments, 'setTab', 'PETATOEAppointments.setTab');
    wrapMethod(window.__PETATOEAppointmentsLegacyEngine, 'setTab', '__PETATOEAppointmentsLegacyEngine.setTab');
    wrapMethod(window.PETATOEOperationsAppointmentsInternal, 'setTab', 'PETATOEOperationsAppointmentsInternal.setTab');
    wrapMethod(window.PETATOEOperations, 'setTab', 'PETATOEOperations.setTab');
    wrapMethod(history, 'pushState', 'history.pushState');
    wrapMethod(history, 'replaceState', 'history.replaceState');
  }

  function observeDom(){
    var targets = [document.documentElement];
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        if (m.type !== 'attributes') return;
        var el = m.target;
        if (!(el instanceof Element)) return;
        if (!el.matches('.panel,[data-appointment-section],[data-appointment-tab],#petatoe-enterprise-navigation button')) return;
        log('dom:attribute-change', {
          attribute:m.attributeName,
          oldValue:m.oldValue,
          element:describeElement(el),
          newValue:el.getAttribute(m.attributeName)
        }, true);
      });
    });
    targets.forEach(function(t){ observer.observe(t,{subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','hidden','aria-hidden','style']}); });
    observers.push(observer);
  }

  function scriptInventory(){
    var scripts = Array.prototype.slice.call(document.scripts).map(function(s){
      return {src:s.src || '[inline]', async:!!s.async, defer:!!s.defer, type:s.type || ''};
    });
    var perf = [];
    try {
      perf = performance.getEntriesByType('resource').filter(function(e){return /\.js(?:\?|$)/i.test(e.name);}).map(function(e){
        return {name:e.name, transferSize:e.transferSize, encodedBodySize:e.encodedBodySize, duration:Number(e.duration.toFixed(2)), initiatorType:e.initiatorType};
      });
    } catch (_) {}
    return {
      scripts:scripts,
      resources:perf,
      serviceWorkerController:navigator.serviceWorker && navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : null,
      location:location.href
    };
  }

  function start(){
    if (started) return api;
    started = true;
    document.addEventListener('click', clickCapture, true);
    ['petatoe:tabchange','petatoe:appointments-ready','petatoe:appointments-intent-applied'].forEach(function(n){document.addEventListener(n,eventObserver,true);});
    observeDom();
    installHooks();
    var hookTimer = setInterval(installHooks, 250);
    restoreFns.push(function(){clearInterval(hookTimer);});
    log('tracer:start', {version:VERSION, inventory:scriptInventory()}, true);
    return api;
  }
  function stop(){
    if (!started) return api;
    log('tracer:stop', {}, false);
    started = false;
    document.removeEventListener('click', clickCapture, true);
    ['petatoe:tabchange','petatoe:appointments-ready','petatoe:appointments-intent-applied'].forEach(function(n){document.removeEventListener(n,eventObserver,true);});
    observers.forEach(function(o){try{o.disconnect();}catch(_){}}); observers=[];
    restoreFns.splice(0).reverse().forEach(function(fn){try{fn();}catch(_){}});
    return api;
  }
  function clear(){ records.length=0; seq=0; return api; }
  function report(){
    return JSON.stringify({
      tracerVersion:VERSION,
      generatedAt:new Date().toISOString(),
      page:location.href,
      userAgent:navigator.userAgent,
      inventory:scriptInventory(),
      records:records
    }, null, 2);
  }
  function copy(){
    var text = report();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function(){console.log('[PETATOE OPS TRACE] Report copied'); return text;});
    }
    console.log(text);
    return Promise.resolve(text);
  }
  function download(){
    var blob = new Blob([report()],{type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'petatoe-operations-navigation-trace-' + Date.now() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
  }
  function snapshot(label){ log('manual:snapshot',{label:label||''},true); return api; }

  var api = {
    version:VERSION,
    start:start,
    stop:stop,
    clear:clear,
    report:report,
    copy:copy,
    download:download,
    snapshot:snapshot,
    records:records
  };
  window.PETATOEOperationsNavTrace = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
