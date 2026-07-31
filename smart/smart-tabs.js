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
    recordsStamp: '', recordsCache: [], renderTokens: Object.create(null),
    lastTab: '', lastTabAt: 0, resizePending: false, runtimePromises: Object.create(null)
  };

  function recordsSignature(rows){
    rows = Array.isArray(rows) ? rows : [];
    var len = rows.length, first = len ? rows[0] || {} : {}, last = len ? rows[len - 1] || {} : {};
    var step = len > 80 ? Math.max(1, Math.floor(len / 12)) : 1, sample = 0;
    for(var i = 0; i < len; i += step){
      var r = rows[i] || {};
      var raw = String(r.id || r.invoice || '') + '|' + String(r.date || '') + '|' + String(r.client || r.customer || '') + '|' + String(r.totalInc || r.totalEx || r.qty || '');
      for(var j = 0; j < raw.length; j++) sample = ((sample * 31) + raw.charCodeAt(j)) >>> 0;
    }
    return [len, first.id || first.invoice || first.date || '', last.id || last.invoice || last.date || '', last.totalInc || last.totalEx || last.qty || '', sample].join('|');
  }

  function records(){
    try{
      var rows = window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function' ? window.PETATOEDataSource.getRecordsSync() : [];
      var stamp = recordsSignature(rows);
      if(stamp !== perfState.recordsStamp){ perfState.recordsStamp = stamp; perfState.recordsCache = Array.isArray(rows) ? rows : []; }
      return perfState.recordsCache;
    }catch(e){ return []; }
  }

  function clearSmartReportCaches(reason){
    reason = reason || 'manual';
    perfState.recordsStamp = ''; perfState.recordsCache = []; perfState.renderTokens = Object.create(null);
    [window.PETATOETables, window.PETATOEHeatmap, window.PETATOECharts].forEach(function(api){ try{ if(api && typeof api.clearCache === 'function') api.clearCache(reason); }catch(e){ smartReportsWarn('component cache clear skipped', e); } });
    try{ if(typeof window.petatoeClearBICache === 'function') window.petatoeClearBICache(reason); }catch(e){ smartReportsWarn('bi cache clear skipped', e); }
    try{ window.dispatchEvent(new CustomEvent('petatoe:smart-cache-cleared', {detail:{reason:reason}})); }catch(e){}
    return true;
  }
  function notifyDataChanged(reason){ clearSmartReportCaches(reason || 'data-change'); }

  function deferSmartRender(key, fn){
    var token = (perfState.renderTokens[key] || 0) + 1;
    perfState.renderTokens[key] = token;
    var run = function(){ if(perfState.renderTokens[key] !== token) return; safe(fn); };
    if(window.requestIdleCallback) requestIdleCallback(run, {timeout:180});
    else if(window.requestAnimationFrame) requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  function t(key){
    try{ var c=window.PETATOE_LOCALIZATION_CENTER; return c&&typeof c.t==='function' ? c.t(key,{}, {allowKeyFallback:true}) : key; }catch(_){ return key; }
  }
  function salesInvoiceArea(){ return document.getElementById('salesInvoiceReportArea'); }
  function renderSalesInvoiceState(kind){
    var area=salesInvoiceArea(); if(!area) return;
    if(kind==='loading') area.innerHTML='<div class="smart-empty" data-smart-runtime-state="loading">'+t('topbar.loading')+'</div>';
    else if(kind==='failed') area.innerHTML='<div class="smart-empty" data-smart-runtime-state="failed"><button class="btn" type="button" data-smart-action="retry-sales-invoices">'+t('actions.refresh')+'</button></div>';
  }
  function ensureRuntime(group){
    if(perfState.runtimePromises[group]) return perfState.runtimePromises[group];
    var gate=window.PETATOEMobileStartupGate;
    if(!gate || typeof gate.ensureGroup!=='function') return Promise.resolve(false);
    perfState.runtimePromises[group]=Promise.resolve(gate.ensureGroup(group)).then(function(ok){ if(ok!==true) throw new Error(group+' readiness failed'); return true; }).finally(function(){ delete perfState.runtimePromises[group]; });
    return perfState.runtimePromises[group];
  }
  function activateSalesInvoices(){
    if(window.PETATOESalesInvoiceReport && typeof window.PETATOESalesInvoiceReport.render==='function'){
      if(typeof window.injectSalesInvoiceReport==='function') window.injectSalesInvoiceReport('salesInvoices');
      window.PETATOESalesInvoiceReport.render(); return Promise.resolve(true);
    }
    renderSalesInvoiceState('loading');
    return ensureRuntime('smartSalesInvoices').then(function(){
      if(typeof window.injectSalesInvoiceReport==='function') window.injectSalesInvoiceReport('salesInvoices');
      if(!window.PETATOESalesInvoiceReport || typeof window.PETATOESalesInvoiceReport.render!=='function') throw new Error('sales invoice renderer unavailable');
      window.PETATOESalesInvoiceReport.render(); return true;
    }).catch(function(error){ renderSalesInvoiceState('failed'); smartReportsWarn('sales invoice runtime failed', error); return false; });
  }
  function activateForecast(){
    if(typeof window.injectBusinessIntelligence==='function') window.injectBusinessIntelligence('forecast');
    if(typeof window.renderBusinessIntelligence==='function') window.renderBusinessIntelligence();
  }
  function resizeCharts(){
    if(perfState.resizePending) return; perfState.resizePending=true;
    var run=function(){ perfState.resizePending=false; try{ Object.values(window.charts||{}).forEach(function(c){ try{c.resize();c.update('none');}catch(e){} }); }catch(e){} };
    if(window.requestIdleCallback) requestIdleCallback(run,{timeout:260}); else if(window.requestAnimationFrame) requestAnimationFrame(run); else setTimeout(run,80);
  }

  function setSmartTab(tab){
    if(tab === 'business') tab = 'forecast';
    document.querySelectorAll('#smartTabs .smart-pill').forEach(function(b){ b.classList.toggle('active', (b.dataset.smartTab || b.getAttribute('data-smart-tab')) === tab); });
    document.querySelectorAll('[data-smart-section]').forEach(function(sec){ sec.classList.toggle('active', (sec.dataset.smartSection || sec.getAttribute('data-smart-section')) === tab); });
    perfState.lastTab=tab; perfState.lastTabAt=Date.now ? Date.now() : +new Date();

    var jobs={
      sales:function(){ if(typeof window.renderSmartSales==='function') window.renderSmartSales(records()); },
      advanced:function(){ if(typeof window.renderReportsCenter==='function') window.renderReportsCenter(records()); },
      vehicles:function(){ if(typeof window.renderSmartVans==='function') window.renderSmartVans(records()); },
      services:function(){ if(typeof window.renderSmartServicesReport==='function') window.renderSmartServicesReport(); },
      customers:function(){ if(typeof window.renderSmartCustomers==='function'){ window.renderSmartCustomers(records()); window.__petatoeSmartCustomersRendered=true; } },
      forecast:activateForecast,
      salesInvoices:activateSalesInvoices
    };
    if(jobs[tab]) deferSmartRender(tab, jobs[tab]);
    if(tab==='recommendations'){ window.petatoeSmartRecReturnActive=false; window.petatoeSmartRecReturnLabel=''; }
    try{ window.dispatchEvent(new CustomEvent('petatoe:smart-tab-rendered',{detail:{tab:tab}})); }catch(_e){}
    safe(function(){ if(typeof window.petatoeRenderSmartRecBackButton==='function') window.petatoeRenderSmartRecBackButton(tab); });
    resizeCharts();
    return true;
  }

  var api = {
    __ready: true,
    __phase: 'PHASE4_NAMESPACE_PROTECTION',
    setSmartTab: setSmartTab,
    records: records,
    clearCaches: clearSmartReportCaches,
    notifyDataChanged: notifyDataChanged,
    getPerformanceState: function(){ return {recordsStamp: perfState.recordsStamp, lastTab: perfState.lastTab}; },
    retrySalesInvoices: activateSalesInvoices
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
