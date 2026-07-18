/* PETATOE v9.4.14 - Smart Reports readiness-safe render router
   Coalesces duplicate requests, never bootstraps from a loading/empty timeout,
   and lets the canonical tab controller render charts after the tab is visible. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_ROUTER_V9414__)return;
  window.__PETATOE_SMART_REPORTS_ROUTER_V9414__=true;

  var legacyRender=window.renderSmartReports;
  if(typeof legacyRender!=='function')return;
  window.__petatoeLegacyRenderSmartReports=legacyRender;

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
  function smartAreaReady(){var area=smartArea();return !!(area&&area.querySelector('#smartTabs')&&area.querySelector('.smart-tab-section')&&!area.querySelector('.smart-empty,[data-smart-final7-loading],[data-smart-v9414-loading]'));}
  function activeSmartTab(){
    var btn=document.querySelector('#smartTabs .smart-pill.active');
    var sec=document.querySelector('.smart-tab-section.active[data-smart-section]');
    return (btn&&(btn.dataset.smartTab||btn.getAttribute('data-smart-tab')))||(sec&&(sec.dataset.smartSection||sec.getAttribute('data-smart-section')))||'overview';
  }
  function invoiceRows(){
    try{if(typeof window.petatoeSmartReportsRows==='function'){var a=window.petatoeSmartReportsRows();if(Array.isArray(a))return a;}}catch(_){}
    try{if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.getRecordsSync==='function'){var rows=window.PETATOEDataSource.getRecordsSync();return Array.isArray(rows)?rows:[];}}catch(_){}
    return Array.isArray(window.records)?window.records:[];
  }
  function readinessAllowsEmpty(){
    try{return !!(window.PETATOESmartReportsDataReadiness&&window.PETATOESmartReportsDataReadiness.isConfirmed&&window.PETATOESmartReportsDataReadiness.isConfirmed());}catch(_){return false;}
  }
  function canFullRender(){return invoiceRows().length>0||readinessAllowsEmpty();}
  function routeSmartReport(tab){
    var start=perfNow(),target=tab||activeSmartTab();
    if(target==='business')target='forecast';
    try{
      // setSmartTab owns lazy rendering and schedules it after the active section is
      // visible. Calling the individual renderer here caused duplicate hidden-canvas
      // Chart.js work and blank vehicle/sales charts.
      if(typeof window.setSmartTab!=='function')return false;
      window.setSmartTab(target);
      perfPush('SmartReports.route.'+target,start,{tab:target});
      return true;
    }catch(e){console.error('PETATOE Smart Reports local route failed',e);return false;}
  }
  function localizeSmartRootOnce(){
    var area=smartArea();if(!area)return;
    try{var center=window.PETATOE_LOCALIZATION_CENTER;if(center&&typeof center.apply==='function')center.apply(area);}catch(e){try{console.warn('[PETATOE Smart] localized root pass skipped',e);}catch(_){}}
  }
  function markBootstrapFromDOM(){
    var ready=smartAreaReady()&&invoiceRows().length>0;
    window.__petatoeSmartReportsBootstrapped=!!ready;
    return ready;
  }
  function requestReadinessRender(target){
    try{
      if(window.PETATOESmartReportsReadyRender&&typeof window.PETATOESmartReportsReadyRender==='function'){
        window.PETATOESmartReportsReadyRender(target,'router-data-not-ready',true);
        return true;
      }
    }catch(_){ }
    return false;
  }
  function performRender(target){
    if(renderRunning){queuedTab=target||queuedTab||activeSmartTab();return;}
    renderRunning=true;renderScheduled=false;frameHandle=0;
    var start=perfNow(),seq=++renderSequence,mode='route';
    window.__PETATOE_SMART_RENDER_BATCH__=true;
    window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__=true;
    try{
      if(window.__petatoeSmartReportsBootstrapped&&smartAreaReady()){
        if(!routeSmartReport(target)){window.__petatoeSmartReportsBootstrapped=false;}
      }else if(canFullRender()){
        mode='full';
        legacyRender.call(window,target);
        if(!markBootstrapFromDOM())mode='full-not-ready';
      }else{
        mode='deferred-data';
        window.__petatoeSmartReportsBootstrapped=false;
        requestReadinessRender(target);
      }
    }finally{
      window.__PETATOE_SMART_RENDER_BATCH__=false;
      window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__=false;
      renderRunning=false;
    }
    requestAnimationFrame(function(){
      localizeSmartRootOnce();
      // Resize only charts belonging to the visible Smart Reports section.
      try{
        var active=smartArea()&&smartArea().querySelector('.smart-tab-section.active');
        if(active){active.querySelectorAll('canvas').forEach(function(canvas){var c=window.charts&&window.charts[canvas.id];if(c){try{c.resize();c.update('none');}catch(_e){}}});}
      }catch(_e){}
      perfPush('SmartReports.coalescedRender',start,{tab:target,mode:mode,sequence:seq,bootstrapped:!!window.__petatoeSmartReportsBootstrapped});
    });
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
    stats:function(){return{scheduled:renderScheduled,running:renderRunning,queuedTab:queuedTab||null,sequence:renderSequence,bootstrapped:!!window.__petatoeSmartReportsBootstrapped,ready:smartAreaReady(),rows:invoiceRows().length,history:(window.__PETATOE_SMART_PERF__||[]).slice(-20)};},
    flush:function(){if(frameHandle)cancelAnimationFrame(frameHandle);renderScheduled=false;var target=queuedTab||activeSmartTab();queuedTab='';performRender(target);}
  };
})();
