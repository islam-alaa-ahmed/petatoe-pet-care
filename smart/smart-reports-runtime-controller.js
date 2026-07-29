/* PETATOE v10.0.25 SR2 — Canonical Smart Reports lifecycle controller.
 * Single owner of open, readiness, data synchronization, render, refresh and
 * records-changed hydration. Report calculations and queries remain untouched.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_RUNTIME_CONTROLLER_SR2__) return;
  window.__PETATOE_SMART_REPORTS_RUNTIME_CONTROLLER_SR2__=true;

  var activePromise=null;
  var pendingRequest=null;
  var lastRequestedTab='overview';
  var lastReason='startup';
  var lastResult=false;
  var lastError='';
  var renderCount=0;

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
      var provider=window.PETATOESmartReportsData;
      if(provider&&typeof provider.getRows==='function'){
        var rows=provider.getRows();
        if(Array.isArray(rows)) return rows;
      }
    }catch(_e){}
    return Array.isArray(window.records)?window.records:[];
  }
  function commitRuntimeRows(reason){
    try{
      var provider=window.PETATOESmartReportsData;
      if(provider&&typeof provider.syncLegacy==='function'){
        return provider.syncLegacy(reason||'smart-reports-sr4');
      }
      if(typeof window.petatoeApplySalesRecordsFromRuntime==='function'){
        return window.petatoeApplySalesRecordsFromRuntime(reason||'smart-reports-sr4-fallback');
      }
    }catch(error){
      try{console.warn('[PETATOE Smart] canonical data commit failed',error);}catch(_e){}
    }
    return false;
  }
  function readinessSnapshot(){
    var services=window.PETATOESmartServices;
    var tabs=window.PETATOESmartTabs||(window.PETATOE&&window.PETATOE.SmartReports);
    return {
      renderSmartReports:typeof window.renderSmartReports==='function',
      smartServices:!!(services&&services.__ready&&typeof services.scopedData==='function'),
      legacySmartServices:typeof window.smartServicesScopedData==='function',
      smartTabs:!!(tabs&&tabs.__ready&&typeof tabs.setSmartTab==='function'),
      setSmartTab:typeof window.setSmartTab==='function',
      controller:true,
      sourceRows:runtimeRows().length,
      legacyRows:Array.isArray(window.records)?window.records.length:0
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
      var ready=status.renderSmartReports&&(status.smartServices||status.legacySmartServices)&&status.smartTabs&&status.setSmartTab;
      return ready?true:Promise.reject(new Error('Smart Reports provider contract is incomplete: '+JSON.stringify(status)));
    });
  }
  function synchronize(forceRemote,reason){
    return Promise.resolve().then(async function(){
      var provider=window.PETATOESmartReportsData;
      if(forceRemote&&provider&&typeof provider.refresh==='function'){
        await provider.refresh((reason||'smart-reports')+'-remote-refresh');
        return true;
      }
      if(forceRemote&&typeof window.petatoeSyncSalesReportsFromSupabase==='function'){
        await window.petatoeSyncSalesReportsFromSupabase();
      }
      commitRuntimeRows((reason||'smart-reports')+'-canonical-commit');
      return true;
    });
  }
  function activateTab(tab){
    tab=normalizeTab(tab);
    lastRequestedTab=tab;
    if(typeof window.setSmartTab==='function'){
      window.setSmartTab(tab);
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
      if(typeof window.renderSmartReports!=='function') throw new Error('renderSmartReports is unavailable');
      window.renderSmartReports(tab);
      activateTab(tab);
      renderCount+=1;
      lastResult=true;
      lastError='';
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
      return synchronize(request.forceRemote,request.reason);
    }).then(function(){
      return renderNow(request.tab,request.reason);
    });
  }
  function drainQueue(){
    if(activePromise||!pendingRequest) return activePromise||Promise.resolve(lastResult);
    var request=pendingRequest;
    pendingRequest=null;
    activePromise=runRequest(request).catch(function(error){
      lastResult=false;
      lastError=String(error&&error.message||error);
      try{console.error('[PETATOE Smart] runtime readiness failed',error);}catch(_e){}
      return false;
    }).finally(function(){
      activePromise=null;
    }).then(function(result){
      if(pendingRequest) return drainQueue();
      return result;
    });
    return activePromise;
  }
  function requestRender(tab,reason,forceRemote){
    pendingRequest={
      tab:normalizeTab(tab||currentTab()),
      reason:clean(reason)||'smart-render',
      forceRemote:!!forceRemote
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
    try{if(event&&event.preventDefault)event.preventDefault();}catch(_e){}
    tab=normalizeTab(tab);
    navigate(tab);
    requestRender(tab,'public-smart-open',false);
    return false;
  }
  function getStatus(){
    var gate=window.PETATOEMobileStartupGate;
    var group=gate&&typeof gate.getGroupStatus==='function'?gate.getGroupStatus('smartReports'):null;
    return {
      __ready:true,
      active:!!activePromise,
      queued:!!pendingRequest,
      open:smartIsOpen(),
      tab:lastRequestedTab,
      reason:lastReason,
      lastResult:lastResult,
      lastError:lastError,
      renderCount:renderCount,
      readiness:readinessSnapshot(),
      gate:group
    };
  }

  var api=Object.freeze({
    __ready:true,
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
  window.PETATOEOpenSmartReports=open;

  document.addEventListener('petatoe:tabchange',function(event){
    var detail=event&&event.detail||{};
    if(detail.tabId!=='smart') return;
    requestRender(detail.smartOpen||currentTab(),'smart-tabchange',false);
  });

  window.addEventListener('petatoe:records-changed',function(){
    commitRuntimeRows('smart-reports-records-changed');
    if(smartIsOpen()) requestRender(currentTab(),'records-changed',false);
  });
})();
