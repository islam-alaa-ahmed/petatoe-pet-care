/* PETATOE v9.4.16 - Smart Reports Public API Restoration
   Keep the first full Smart Reports render as the stable baseline, then route local
   rerenders for already-modular tabs to their own renderers instead of rebuilding
   the whole Smart Reports dashboard. This preserves existing UI/data while reducing
   repeated full render calls triggered by local filters and tab actions. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_ROUTER_B1__) return;
  window.__PETATOE_SMART_REPORTS_ROUTER_B1__ = true;

  var legacyRender = window.renderSmartReports;

  function normalizeSmartTab(tab){
    var target = String(tab || 'overview').trim() || 'overview';
    return target === 'business' ? 'forecast' : target;
  }

  function openSmartReports(tab, event){
    try{ if(event && typeof event.preventDefault === 'function') event.preventDefault(); }catch(_e){}
    var target = normalizeSmartTab(tab);
    try{
      if(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function'){
        window.PETATOERouter.openTab('smart', target);
      }else if(window.PETATOEInlineHandlers && typeof window.PETATOEInlineHandlers.moduleCall === 'function'){
        window.PETATOEInlineHandlers.moduleCall('router', 'openTab', 'smart', target);
      }else if(typeof window.tab === 'function'){
        window.tab('smart');
        if(typeof window.setSmartTab === 'function') window.setSmartTab(target);
      }else{
        throw new Error('Smart Reports router is unavailable');
      }
      return false;
    }catch(error){
      console.error('[PETATOE Smart] open failed', error);
      return false;
    }
  }

  // Stable public API used by the header and legacy integrations.
  window.PETATOEOpenSmartReports = openSmartReports;

  function perfNow(){ try{ return (window.performance && performance.now) ? performance.now() : Date.now(); }catch(e){ return Date.now(); } }
  function perfPush(name, start, meta){
    try{
      window.__PETATOE_SMART_PERF__ = window.__PETATOE_SMART_PERF__ || [];
      window.__PETATOE_SMART_PERF__.push(Object.assign({name:name, ms:+(perfNow()-start).toFixed(2), at:Date.now()}, meta||{}));
      if(window.__PETATOE_SMART_PERF__.length > 120) window.__PETATOE_SMART_PERF__.shift();
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-router.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }
  if(typeof legacyRender !== 'function') return;
  window.__petatoeLegacyRenderSmartReports = legacyRender;

  function smartAreaReady(){
    var area = document.getElementById('smartReportsArea');
    return !!(area && area.children && area.children.length && !area.querySelector('.smart-empty'));
  }

  function activeSmartTab(){
    var btn = document.querySelector('#smartTabs .smart-pill.active');
    var sec = document.querySelector('.smart-tab-section.active[data-smart-section]');
    return (btn && (btn.dataset.smartTab || btn.getAttribute('data-smart-tab'))) ||
           (sec && (sec.dataset.smartSection || sec.getAttribute('data-smart-section'))) ||
           'overview';
  }

  function invoiceRows(){
    try{
      if(typeof window.petatoeSmartReportsRows === 'function') return window.petatoeSmartReportsRows();
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-router.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){
        var rows = window.PETATOEDataSource.getRecordsSync();
        return Array.isArray(rows) ? rows : [];
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-router.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return Array.isArray(window.records) ? window.records : [];
  }

  function routeSmartReport(tab){
    var __routePerfStart = perfNow();
    var target = tab || activeSmartTab();
    if(target === 'business') target = 'forecast';

    try{
      // setSmartTab owns lazy rendering. Calling a renderer here as well caused every
      // modular tab (especially Vehicles) to render twice per navigation.
      if(['services','vehicles','customers','sales','advanced','forecast','salesInvoices'].indexOf(target)!==-1 && typeof window.setSmartTab === 'function'){
        window.setSmartTab(target);
        perfPush('SmartReports.route.'+target, __routePerfStart, {tab:target, renderOwner:'setSmartTab'});
        return true;
      }
    }catch(e){
      console.error('PETATOE Smart Reports Router A4 route failed; falling back to full render', e);
      return false;
    }
    return false;
  }

  window.renderSmartReports = function(tab){
    var target = tab || activeSmartTab();
    if(window.__petatoeSmartReportsBootstrapped && smartAreaReady() && routeSmartReport(target)){
      return;
    }
    var __fullPerfStart = perfNow();
    var result = legacyRender.apply(this, arguments);
    window.__petatoeSmartReportsBootstrapped = true;
    perfPush('SmartReports.legacyFullRender', __fullPerfStart, {tab:target});
    return result;
  };

  window.petatoeSmartRouteReport = routeSmartReport;
})();
