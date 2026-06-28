/* PETATOE v5.1.96 - Smart Reports Namespace Protection
   Phase 4: Owns Smart Reports tab switching through PETATOE.SmartReports.
   Keeps window.setSmartTab as a protected compatibility bridge for legacy inline calls. */
(function(){
  'use strict';

  var root = window.PETATOE = window.PETATOE || {};
  var existing = root.SmartReports;
  if(existing && existing.__ready && typeof existing.setSmartTab === 'function'){
    try{
      if(typeof window.setSmartTab !== 'function'){
        Object.defineProperty(window, 'setSmartTab', {
          value: existing.setSmartTab,
          writable: false,
          configurable: false,
          enumerable: true
        });
      }
      window.PETATOESmartTabs = existing;
    }catch(e){
      window.setSmartTab = existing.setSmartTab;
      window.PETATOESmartTabs = existing;
    }
    return;
  }

  function smartReportsWarn(context, e){
    if(window.console && typeof console.warn === 'function'){
      console.warn('[PETATOE Smart Reports] '+context, e);
    }
  }

  function safe(fn){
    try{return fn&&fn();}
    catch(e){console.error('[PETATOE Smart Reports]',e);}
  }

  var perfState = {
    recordsStamp: '',
    recordsCache: [],
    renderToken: 0,
    lastTab: '',
    lastTabAt: 0,
    resizePending: false
  };

  function recordsSignature(rows){
    rows = Array.isArray(rows) ? rows : [];
    var len = rows.length;
    var first = len ? rows[0] || {} : {};
    var last = len ? rows[len - 1] || {} : {};
    var step = len > 80 ? Math.max(1, Math.floor(len / 12)) : 1;
    var sample = 0;
    for(var i = 0; i < len; i += step){
      var r = rows[i] || {};
      var raw = String(r.id || r.invoice || '') + '|' + String(r.date || '') + '|' + String(r.client || r.customer || '') + '|' + String(r.totalInc || r.totalEx || r.qty || '');
      for(var j = 0; j < raw.length; j++){ sample = ((sample * 31) + raw.charCodeAt(j)) >>> 0; }
    }
    return [
      len,
      first.id || first.invoice || first.date || '',
      last.id || last.invoice || last.date || '',
      last.totalInc || last.totalEx || last.qty || '',
      sample
    ].join('|');
  }

  function records(){
    try{
      var rows = window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'
        ? window.PETATOEDataSource.getRecordsSync()
        : [];
      var stamp = recordsSignature(rows);
      if(stamp !== perfState.recordsStamp){
        perfState.recordsStamp = stamp;
        perfState.recordsCache = Array.isArray(rows) ? rows : [];
      }
      return perfState.recordsCache;
    }catch(e){return [];}
  }


  function clearSmartReportCaches(reason){
    reason = reason || 'manual';
    try{
      perfState.recordsStamp = '';
      perfState.recordsCache = [];
      perfState.renderToken++;
    }catch(e){smartReportsWarn('perf cache clear skipped', e)}

    [window.PETATOETables, window.PETATOEHeatmap, window.PETATOECharts].forEach(function(api){
      try{ if(api && typeof api.clearCache === 'function') api.clearCache(reason); }catch(e){smartReportsWarn('component cache clear skipped', e)}
    });

    try{ if(typeof window.petatoeClearBICache === 'function') window.petatoeClearBICache(reason); }catch(e){smartReportsWarn('bi cache clear skipped', e)}

    try{
      if(window.dispatchEvent){
        window.dispatchEvent(new CustomEvent('petatoe:smart-cache-cleared', {detail:{reason: reason}}));
      }
    }catch(e){smartReportsWarn('cache clear event skipped', e)}
    return true;
  }

  function notifyDataChanged(reason){
    clearSmartReportCaches(reason || 'data-change');
  }

  function deferSmartRender(tab, fn){
    var now = Date.now ? Date.now() : +new Date();
    var token = ++perfState.renderToken;
    if(perfState.lastTab === tab && now - perfState.lastTabAt < 90){
      return;
    }
    perfState.lastTab = tab;
    perfState.lastTabAt = now;
    var run = function(){
      if(token !== perfState.renderToken) return;
      safe(fn);
    };
    if(window.requestIdleCallback){
      requestIdleCallback(run, {timeout: 180});
    }else if(window.requestAnimationFrame){
      requestAnimationFrame(run);
    }else{
      setTimeout(run, 0);
    }
  }

  function resizeCharts(){
    if(perfState.resizePending) return;
    perfState.resizePending = true;
    var run = function(){
      perfState.resizePending = false;
      try{
        Object.values(window.charts||{}).forEach(function(c){
          try{c.resize();c.update('none');}catch(e){smartReportsWarn('chart resize/update skipped', e)}
        });
      }catch(e){smartReportsWarn('resizeCharts skipped', e)}
    };
    if(window.requestIdleCallback){requestIdleCallback(run,{timeout:260});}else if(window.requestAnimationFrame){requestAnimationFrame(run);}else{setTimeout(run,80);}
  }

  function setSmartTab(tab){
    if(tab === 'business') tab = 'forecast';

    if(tab === 'sales'){
      deferSmartRender(tab, function(){if(typeof window.renderSmartSales === 'function') window.renderSmartSales(records());});
    }

    if(tab === 'advanced'){
      deferSmartRender(tab, function(){if(typeof window.renderReportsCenter === 'function') window.renderReportsCenter(records());});
    }

    if(tab === 'vehicles'){
      deferSmartRender(tab, function(){if(typeof window.renderSmartVans === 'function') window.renderSmartVans(records());});
    }

    if(tab === 'services'){
      deferSmartRender(tab, function(){if(typeof window.renderSmartServicesReport === 'function') window.renderSmartServicesReport();});
    }

    if(tab === 'customers'){
      // PETATOE v6.4.154: Customers tab follows Vehicles lazy-render pattern.
      // Do not call petatoeSmartRerender('customers') here because it falls back to
      // the legacy full Smart Reports render and rebuilds the whole dashboard.
      deferSmartRender(tab, function(){
        if(typeof window.renderSmartCustomers === 'function'){
          window.renderSmartCustomers(records());
          window.__petatoeSmartCustomersRendered=true;
        }
      });
    }

    if(tab === 'forecast'){
      deferSmartRender(tab, function(){ if(window.injectBusinessIntelligence) window.injectBusinessIntelligence('forecast'); });
    }

    if(tab === 'salesInvoices'){
      deferSmartRender(tab, function(){ if(window.injectSalesInvoiceReport) window.injectSalesInvoiceReport('salesInvoices'); });
    }

    if(tab === 'recommendations'){
      window.petatoeSmartRecReturnActive = false;
      window.petatoeSmartRecReturnLabel = '';
    }

    document.querySelectorAll('#smartTabs .smart-pill').forEach(function(b){
      b.classList.toggle('active', (b.dataset.smartTab || b.getAttribute('data-smart-tab')) === tab);
    });

    document.querySelectorAll('[data-smart-section]').forEach(function(sec){
      sec.classList.toggle('active', (sec.dataset.smartSection || sec.getAttribute('data-smart-section')) === tab);
    });

    if(tab === 'forecast'){
      deferSmartRender(tab + ':bi', function(){ if(typeof window.renderBusinessIntelligence === 'function') window.renderBusinessIntelligence(); });
    }

    if(tab === 'salesInvoices'){
      deferSmartRender(tab + ':report', function(){
        if(window.PETATOESalesInvoiceReport && typeof window.PETATOESalesInvoiceReport.render === 'function'){
          window.PETATOESalesInvoiceReport.render();
        }
      });
    }

    safe(function(){
      if(typeof window.petatoeRenderSmartRecBackButton === 'function') window.petatoeRenderSmartRecBackButton(tab);
    });

    resizeCharts();
  }

  var api = {
    __ready: true,
    __phase: 'PHASE4_NAMESPACE_PROTECTION',
    setSmartTab: setSmartTab,
    records: records,
    clearCaches: clearSmartReportCaches,
    notifyDataChanged: notifyDataChanged,
    getPerformanceState: function(){ return {recordsStamp: perfState.recordsStamp, lastTab: perfState.lastTab}; }
  };

  try{
    Object.freeze(api);
  }catch(e){smartReportsWarn('api freeze skipped', e)}

  try{
    Object.defineProperty(root, 'SmartReports', {
      value: api,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }catch(e){
    root.SmartReports = api;
  }

  try{
    Object.defineProperty(window, 'PETATOESmartTabs', {
      value: api,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }catch(e){
    window.PETATOESmartTabs = api;
  }

  try{
    Object.defineProperty(window, 'setSmartTab', {
      value: api.setSmartTab,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }catch(e){
    window.setSmartTab = api.setSmartTab;
  }
})();

/* PETATOE v6.4.145 - Smart Reports Phase 2: Vehicles tab uses lazy render like Advanced Center. */

/* PETATOE v6.4.170 - Smart Reports Router extracted to smart/smart-router.js. */

/* PETATOE v6.4.173: Smart Customers module moved to smart/smart-customers.js */
