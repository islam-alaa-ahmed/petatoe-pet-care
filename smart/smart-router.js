/* PETATOE v9.4.13 - Smart Reports Render & Localization Performance Fix
   Coalesces duplicate render requests, routes active tabs locally after bootstrap,
   and pauses DOM translation observers while Smart Reports builds its DOM. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_ROUTER_B1__) return;
  window.__PETATOE_SMART_REPORTS_ROUTER_B1__ = true;

  var legacyRender = window.renderSmartReports;
  if(typeof legacyRender !== 'function') return;
  window.__petatoeLegacyRenderSmartReports = legacyRender;

  var renderScheduled=false;
  var renderRunning=false;
  var queuedTab='';
  var frameHandle=0;
  var renderSequence=0;

  function perfNow(){try{return window.performance&&performance.now?performance.now():Date.now();}catch(_){return Date.now();}}
  function perfPush(name,start,meta){
    try{
      window.__PETATOE_SMART_PERF__=window.__PETATOE_SMART_PERF__||[];
      window.__PETATOE_SMART_PERF__.push(Object.assign({name:name,ms:+(perfNow()-start).toFixed(2),at:Date.now()},meta||{}));
      if(window.__PETATOE_SMART_PERF__.length>120)window.__PETATOE_SMART_PERF__.shift();
    }catch(_){ }
  }
  function smartArea(){return document.getElementById('smartReportsArea');}
  function smartAreaReady(){var area=smartArea();return !!(area&&area.children&&area.children.length&&!area.querySelector('.smart-empty,[data-smart-final7-loading]'));}
  function activeSmartTab(){
    var btn=document.querySelector('#smartTabs .smart-pill.active');
    var sec=document.querySelector('.smart-tab-section.active[data-smart-section]');
    return (btn&&(btn.dataset.smartTab||btn.getAttribute('data-smart-tab')))||(sec&&(sec.dataset.smartSection||sec.getAttribute('data-smart-section')))||'overview';
  }
  function invoiceRows(){
    try{if(typeof window.petatoeSmartReportsRows==='function')return window.petatoeSmartReportsRows();}catch(_){ }
    try{if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.getRecordsSync==='function'){var rows=window.PETATOEDataSource.getRecordsSync();return Array.isArray(rows)?rows:[];}}catch(_){ }
    return Array.isArray(window.records)?window.records:[];
  }
  function routeSmartReport(tab){
    var start=perfNow(),target=tab||activeSmartTab();
    if(target==='business')target='forecast';
    try{
      if(target==='services'&&typeof window.renderSmartServicesReport==='function')window.renderSmartServicesReport();
      else if(target==='vehicles'&&typeof window.renderSmartVans==='function')window.renderSmartVans(invoiceRows());
      else if(target==='customers'&&typeof window.renderSmartCustomers==='function')window.renderSmartCustomers(invoiceRows());
      else if(target==='sales'&&typeof window.renderSmartSales==='function')window.renderSmartSales(invoiceRows());
      else if(target==='advanced'&&typeof window.renderReportsCenter==='function')window.renderReportsCenter(invoiceRows());
      else if(target==='forecast'&&typeof window.injectBusinessIntelligence==='function')window.injectBusinessIntelligence('forecast');
      else if(target==='salesInvoices'&&typeof window.injectSalesInvoiceReport==='function')window.injectSalesInvoiceReport('salesInvoices');
      else return false;
      if(typeof window.setSmartTab==='function')window.setSmartTab(target);
      perfPush('SmartReports.route.'+target,start,{tab:target});
      return true;
    }catch(e){console.error('PETATOE Smart Reports local route failed',e);return false;}
  }
  function localizeSmartRootOnce(){
    var area=smartArea();
    if(!area)return;
    try{
      var center=window.PETATOE_LOCALIZATION_CENTER;
      if(center&&typeof center.apply==='function')center.apply(area);
    }catch(e){try{console.warn('[PETATOE Smart] localized root pass skipped',e);}catch(_){}}
  }
  function performRender(target){
    if(renderRunning){queuedTab=target||queuedTab||activeSmartTab();return;}
    renderRunning=true;renderScheduled=false;frameHandle=0;
    var start=perfNow(),seq=++renderSequence,mode='route';
    window.__PETATOE_SMART_RENDER_BATCH__=true;
    window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__=true;
    try{
      if(!(window.__petatoeSmartReportsBootstrapped&&smartAreaReady()&&routeSmartReport(target))){
        mode='full';legacyRender.call(window,target);window.__petatoeSmartReportsBootstrapped=true;
      }
    }finally{
      window.__PETATOE_SMART_RENDER_BATCH__=false;
      window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__=false;
      renderRunning=false;
    }
    requestAnimationFrame(function(){localizeSmartRootOnce();perfPush('SmartReports.coalescedRender',start,{tab:target,mode:mode,sequence:seq});});
    if(queuedTab){var next=queuedTab;queuedTab='';scheduleRender(next);}
  }
  function scheduleRender(tab){
    queuedTab=tab||queuedTab||activeSmartTab();
    if(renderRunning||renderScheduled)return;
    renderScheduled=true;
    frameHandle=requestAnimationFrame(function(){var target=queuedTab||activeSmartTab();queuedTab='';performRender(target);});
  }
  window.renderSmartReports=function(tab){scheduleRender(tab||activeSmartTab());};
  window.petatoeSmartRouteReport=routeSmartReport;
  window.PETATOESmartRenderPerformance={
    stats:function(){return{scheduled:renderScheduled,running:renderRunning,queuedTab:queuedTab||null,sequence:renderSequence,history:(window.__PETATOE_SMART_PERF__||[]).slice(-20)};},
    flush:function(){if(frameHandle)cancelAnimationFrame(frameHandle);renderScheduled=false;var target=queuedTab||activeSmartTab();queuedTab='';performRender(target);}
  };
})();
