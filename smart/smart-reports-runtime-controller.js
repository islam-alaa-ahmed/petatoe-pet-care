/* PETATOE v10.0.25 SG-4.3 — Canonical Smart Reports lifecycle controller.
 * Single owner of open, readiness, data synchronization, render, refresh and
 * records-changed hydration. Report calculations and queries remain untouched.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_RUNTIME_CONTROLLER_SR2__) return;
  window.__PETATOE_SMART_REPORTS_RUNTIME_CONTROLLER_SR2__=true;

  var activePromise=null;
  var activeRequest=null;
  var pendingRequest=null;
  var remoteRefreshPromise=null;
  var remoteRefreshCount=0;
  var coalescedRefreshCount=0;
  var lastRequestedTab='overview';
  var lastReason='startup';
  var lastResult=false;
  var lastError='';
  var renderCount=0;
  var lastCommittedDetail=null;
  var lastRenderedRevision='';

  function traceRuntime(stage, detail){
    try{
      var rows=[];
      try{ rows=runtimeRows(); }catch(_e){}
      var area=document.getElementById('smartReportsArea');
      var entry={
        at:Date.now(),
        stage:String(stage||''),
        detail:detail||null,
        runtimeRows:Array.isArray(rows)?rows.length:-1,
        legacyRows:Array.isArray(window.records)?window.records.length:-1,
        bootstrapped:window.__petatoeSmartReportsBootstrapped===true,
        areaChildren:area&&area.children?area.children.length:-1,
        areaHasEmpty:!!(area&&area.querySelector&&area.querySelector('.smart-empty'))
      };
      window.__PETATOE_SMART_RUNTIME_TRACE__=window.__PETATOE_SMART_RUNTIME_TRACE__||[];
      window.__PETATOE_SMART_RUNTIME_TRACE__.push(entry);
      if(window.__PETATOE_SMART_RUNTIME_TRACE__.length>200) window.__PETATOE_SMART_RUNTIME_TRACE__.shift();
      return entry;
    }catch(_e){ return null; }
  }

  function clean(value){ return String(value==null?'':value).trim(); }
  function normalizeTab(value){
    var tab=clean(value)||'overview';
    return tab==='business'?'forecast':tab;
  }
  function currentTab(){
    try{
      var active=document.querySelector('#smartTabs [data-smart-tab].active, #smartTabs .smart-pill.active');
      return normalizeTab(active&&(active.getAttribute('data-smart-tab')||(active.dataset&&active.dataset.smartTab))||lastRequestedTab);
    }catch(_e){ return normalizeTab(lastRequestedTab); }
  }
  function smartIsOpen(){
    try{
      var area=document.getElementById('smartReportsArea');
      return !!(area&&(area.offsetParent!==null||area.closest('.tab-content.active')));
    }catch(_e){ return false; }
  }
  function runtimeRows(){
    try{
      if(window.PETATOERecordsReadFacade&&typeof window.PETATOERecordsReadFacade.readRows==='function'){
        var canonicalRows=window.PETATOERecordsReadFacade.readRows();
        if(Array.isArray(canonicalRows)) return canonicalRows;
      }
    }catch(_e){}
    try{
      if(window.PETATOESmartReportsReadAdapter&&typeof window.PETATOESmartReportsReadAdapter.readRows==='function'){
        var adaptedRows=window.PETATOESmartReportsReadAdapter.readRows();
        if(Array.isArray(adaptedRows)) return adaptedRows;
      }
    }catch(_e){}
    try{
      if(typeof window.petatoeSmartReportsRows==='function'){
        var rows=window.petatoeSmartReportsRows();
        if(Array.isArray(rows)) return rows;
      }
    }catch(_e){}
    try{
      if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.getRecordsSync==='function'){
        var sourceRows=window.PETATOEDataSource.getRecordsSync();
        if(Array.isArray(sourceRows)) return sourceRows;
      }
    }catch(_e){}
    return [];
  }
  function commitRuntimeRows(reason){
    try{
      if(typeof window.petatoeApplySalesRecordsFromRuntime==='function'){
        return window.petatoeApplySalesRecordsFromRuntime(reason||'smart-reports-sr2');
      }
    }catch(error){
      try{console.warn('[PETATOE Smart] canonical data commit failed',error);}catch(_e){}
    }
    return false;
  }
  function renderEngine(){
    var engine=window.PETATOESmartReportsRenderEngine;
    if(engine&&engine.__ready&&typeof engine.render==='function') return engine;
    return null;
  }
  function tabsController(){
    var tabs=window.PETATOESmartTabs||(window.PETATOE&&window.PETATOE.SmartReports);
    return tabs&&tabs.__ready&&typeof tabs.setSmartTab==='function'?tabs:null;
  }
  function readinessSnapshot(){
    var services=window.PETATOESmartServices;
    var tabs=window.PETATOESmartTabs||(window.PETATOE&&window.PETATOE.SmartReports);
    return {
      renderEngine:!!renderEngine(),
      smartServices:!!(services&&services.__ready&&typeof services.scopedData==='function'),
      legacySmartServices:typeof window.smartServicesScopedData==='function',
      smartTabs:!!(tabs&&tabs.__ready&&typeof tabs.setSmartTab==='function'),
      controller:true,
      sourceRows:runtimeRows().length,
      legacyRows:Array.isArray(window.records)?window.records.length:0,
      readAdapter:!!(window.PETATOESmartReportsReadAdapter&&window.PETATOESmartReportsReadAdapter.__ready)
    };
  }
  function ensureSmartRuntime(){
    var registration=window.PETATOESmartRuntimeRegistration;
    var recover=registration&&typeof registration.ensure==='function'
      ? Promise.resolve(registration.ensure())
      : Promise.resolve(true);
    return recover.then(function(recovered){
      if(recovered!==true){
        var registrationStatus=registration&&typeof registration.getStatus==='function'?registration.getStatus():null;
        throw new Error('Smart Reports provider registration failed: '+JSON.stringify(registrationStatus||readinessSnapshot()));
      }
      var gate=window.PETATOEMobileStartupGate;
      if(gate&&typeof gate.ensureGroup==='function'){
        return Promise.resolve(gate.ensureGroup('smartReports')).then(function(ready){
          if(ready===true) return true;
          var status=typeof gate.getGroupStatus==='function'?gate.getGroupStatus('smartReports'):null;
          var detail=status&&status.readiness?status.readiness:readinessSnapshot();
          throw new Error('Smart Reports runtime is not ready: '+JSON.stringify(detail));
        });
      }
      var status=readinessSnapshot();
      var ready=status.renderEngine&&(status.smartServices||status.legacySmartServices)&&status.smartTabs;
      return ready?true:Promise.reject(new Error('Smart Reports provider contract is incomplete: '+JSON.stringify(status)));
    });
  }
  function synchronize(forceRemote,reason){
    traceRuntime('controller.synchronize.requested',{forceRemote:!!forceRemote,reason:reason||''});
    return Promise.resolve().then(async function(){
      var rowsBefore=runtimeRows();
      traceRuntime('controller.synchronize.before',{rowsBefore:rowsBefore.length});
      var needsInitialHydration=!rowsBefore.length;
      var shouldRefresh=!!forceRemote||needsInitialHydration;
      if(shouldRefresh&&typeof window.petatoeSyncSalesReportsFromSupabase==='function'){
        if(!remoteRefreshPromise){
          remoteRefreshCount+=1;
          remoteRefreshPromise=Promise.resolve(window.petatoeSyncSalesReportsFromSupabase()).finally(function(){
            remoteRefreshPromise=null;
          });
        }else{
          coalescedRefreshCount+=1;
        }
        await remoteRefreshPromise;
        traceRuntime('controller.synchronize.remote-complete',{rowsAfterRemote:runtimeRows().length});
      }
      var commitResult=commitRuntimeRows((reason||'smart-reports')+(needsInitialHydration?'-initial-hydration':'-canonical-commit'));
      traceRuntime('controller.synchronize.commit-complete',{commitResult:commitResult,needsInitialHydration:needsInitialHydration,rowsAfterCommit:runtimeRows().length});
      return true;
    });
  }
  function activateTab(tab){
    tab=normalizeTab(tab);
    lastRequestedTab=tab;
    var tabs=tabsController();
    if(tabs){
      tabs.setSmartTab(tab);
      return true;
    }
    return false;
  }
  function renderNow(tab,reason){
    tab=normalizeTab(tab||currentTab());
    lastRequestedTab=tab;
    lastReason=reason||'render';
    try{
      if(typeof window.clearSmartReportCaches==='function') window.clearSmartReportCaches();
      var engine=renderEngine();
      traceRuntime('controller.renderNow.before-engine',{tab:tab,reason:lastReason,engineReady:!!engine});
      if(!engine) throw new Error('Smart Reports render engine is unavailable');
      var engineResult=engine.render(tab);
      traceRuntime('controller.renderNow.after-engine',{tab:tab,engineResultType:typeof engineResult});
      activateTab(tab);
      try{
        var commitState=window.__PETATOE_SALES_REPORTS_COMMIT_STATE__||null;
        var revision=clean(commitState&&commitState.revision||(lastCommittedDetail&&lastCommittedDetail.revision));
        if(revision) lastRenderedRevision=revision;
      }catch(_e){}
      renderCount+=1;
      lastResult=true;
      lastError='';
      try{
        window.dispatchEvent(new CustomEvent('petatoe:smart-reports-ready',{detail:{
          tab:tab,
          reason:lastReason,
          renderCount:renderCount,
          rows:runtimeRows().length,
          revision:lastRenderedRevision
        }}));
      }catch(_e){}
      return true;
    }catch(error){
      lastResult=false;
      lastError=String(error&&error.message||error);
      try{console.error('[PETATOE Smart] controlled render failed',error);}catch(_e){}
      return false;
    }
  }
  function runRequest(request){
    return ensureSmartRuntime().then(function(){
      if(request.skipSync===true) return true;
      return synchronize(request.forceRemote,request.reason);
    }).then(function(){
      return renderNow(request.tab,request.reason);
    });
  }
  function drainQueue(){
    if(activePromise||!pendingRequest) return activePromise||Promise.resolve(lastResult);
    var request=pendingRequest;
    pendingRequest=null;
    activeRequest=request;
    activePromise=runRequest(request).catch(function(error){
      lastResult=false;
      lastError=String(error&&error.message||error);
      try{console.error('[PETATOE Smart] runtime readiness failed',error);}catch(_e){}
      return false;
    }).finally(function(){
      activePromise=null;
      activeRequest=null;
    }).then(function(result){
      if(pendingRequest) return drainQueue();
      return result;
    });
    return activePromise;
  }
  function requestRender(tab,reason,forceRemote,skipSync){
    if(forceRemote&&activePromise&&activeRequest&&activeRequest.forceRemote){
      coalescedRefreshCount+=1;
      return activePromise;
    }
    if(forceRemote&&pendingRequest&&pendingRequest.forceRemote){
      coalescedRefreshCount+=1;
      return activePromise||drainQueue();
    }
    pendingRequest={
      tab:normalizeTab(tab||currentTab()),
      reason:clean(reason)||'smart-render',
      forceRemote:!!forceRemote,
      skipSync:skipSync===true
    };
    lastRequestedTab=pendingRequest.tab;
    return drainQueue();
  }
  function navigate(tab){
    tab=normalizeTab(tab);
    try{
      if(window.PETATOERouter&&typeof window.PETATOERouter.openTab==='function'){
        window.PETATOERouter.openTab('smart',tab);
        return true;
      }
      if(typeof window.tab==='function'){
        window.tab('smart');
        return true;
      }
    }catch(error){
      lastError=String(error&&error.message||error);
      try{console.error('[PETATOE Smart] navigation failed',error);}catch(_e){}
    }
    return false;
  }
  function open(tab,event){
    try{if(event&&typeof event.preventDefault==='function')event.preventDefault();}catch(_e){}
    tab=normalizeTab(tab);
    traceRuntime('controller.open.start',{tab:tab});
    navigate(tab);

    // Preserve the proven synchronous render contract so the dashboard body is
    // built immediately from the currently committed rows. Runtime ownership is
    // retained for readiness, synchronization, deduplication and remote refresh.
    try{
      traceRuntime('controller.open.before-bridge',{tab:tab,bridgeType:typeof window.renderSmartReports});
      if(typeof window.renderSmartReports==='function') window.renderSmartReports(tab);
      traceRuntime('controller.open.after-bridge',{tab:tab});
    }catch(error){
      lastError=String(error&&error.message||error);
      try{console.error('[PETATOE Smart] immediate render bridge failed',error);}catch(_e){}
    }

    traceRuntime('controller.open.before-requestRender',{tab:tab});
    requestRender(tab,'public-smart-open',false);
    return false;
  }
  function getStatus(){
    var gate=window.PETATOEMobileStartupGate;
    var group=gate&&typeof gate.getGroupStatus==='function'?gate.getGroupStatus('smartReports'):null;
    return {
      __ready:true,
      active:!!activePromise,
      activeRemoteRefresh:!!(activeRequest&&activeRequest.forceRemote),
      remoteRefreshInFlight:!!remoteRefreshPromise,
      remoteRefreshCount:remoteRefreshCount,
      coalescedRefreshCount:coalescedRefreshCount,
      queued:!!pendingRequest,
      open:smartIsOpen(),
      tab:lastRequestedTab,
      reason:lastReason,
      lastResult:lastResult,
      lastError:lastError,
      renderCount:renderCount,
      lastCommittedDetail:lastCommittedDetail,
      lastRenderedRevision:lastRenderedRevision,
      readiness:readinessSnapshot(),
      gate:group
    };
  }

  var api=Object.freeze({
    __ready:true,
    __owner:'smart/smart-reports-runtime-controller.js',
    open:open,
    render:function(tab,reason){return requestRender(tab,reason||'public-render',false);},
    refresh:function(tab){return requestRender(tab||currentTab(),'public-refresh',true);},
    activateTab:activateTab,
    getRows:function(){return runtimeRows().slice();},
    getStatus:getStatus
  });

  window.PETATOESmartReportsRuntime=api;
  window.PETATOESmartReportsRuntimeStatus=getStatus;
  window.PETATOESmartReportsReadyRender=function(tab,reason,forceRemote){
    return requestRender(tab,reason||'compat-ready-render',!!forceRemote);
  };
  window.PETATOESmartReportsRefresh=function(tab){ return api.refresh(tab); };
  window.PETATOEOpenSmartReports=function(tab,event){ return api.open(tab,event); };
  // The stable renderSmartReports compatibility bridge is owned by smart-router.js.
  // Runtime remains the sole owner of open, refresh, readiness and synchronization.

  document.addEventListener('petatoe:tabchange',function(event){
    var detail=event&&event.detail||{};
    if(detail.tabId!=='smart') return;
    requestRender(detail.smartOpen||currentTab(),'smart-tabchange',false);
  });

  window.addEventListener('petatoe:sales-records-committed',function(event){
    lastCommittedDetail=event&&event.detail||null;
    var revision=clean(lastCommittedDetail&&lastCommittedDetail.revision);
    if(revision&&revision===lastRenderedRevision) return;
    if(activePromise||!smartIsOpen()) return;
    requestRender(currentTab(),'sales-records-committed',false,true);
  });
})();
