/* PETATOE v10.0.25 — Smart Reports event-driven runtime controller.
 * Owns open/refresh/data-ready rendering without polling or changing report logic.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_RUNTIME_CONTROLLER_B2_2__) return;
  window.__PETATOE_SMART_REPORTS_RUNTIME_CONTROLLER_B2_2__=true;

  var activePromise=null;
  var lastRequestedTab='overview';

  function clean(value){ return String(value==null?'':value).trim(); }
  function currentTab(){
    try{
      var active=document.querySelector('#smartTabs [data-smart-tab].active, #smartTabs .smart-pill.active');
      return clean(active&&(active.getAttribute('data-smart-tab')||(active.dataset&&active.dataset.smartTab)))||lastRequestedTab||'overview';
    }catch(_e){ return lastRequestedTab||'overview'; }
  }
  function smartIsOpen(){
    try{
      var area=document.getElementById('smartReportsArea');
      return !!(area&&(area.offsetParent!==null||area.closest('.tab-content.active')));
    }catch(_e){ return false; }
  }
  function commitRuntimeRows(reason){
    try{
      if(typeof window.petatoeApplySalesRecordsFromRuntime==='function'){
        return window.petatoeApplySalesRecordsFromRuntime(reason||'smart-reports-runtime-controller');
      }
    }catch(e){ try{console.warn('[PETATOE Smart] runtime commit failed',e);}catch(_e){} }
    return false;
  }
  function renderNow(tab,reason){
    tab=clean(tab)||currentTab()||'overview';
    lastRequestedTab=tab;
    try{
      if(typeof window.clearSmartReportCaches==='function') window.clearSmartReportCaches();
      if(typeof window.renderSmartReports==='function') window.renderSmartReports(tab);
      if(typeof window.setSmartTab==='function') window.setSmartTab(tab);
      return true;
    }catch(e){
      try{console.error('[PETATOE Smart] controlled render failed',e);}catch(_e){}
      return false;
    }
  }
  function synchronize(forceRemote,reason){
    return Promise.resolve().then(async function(){
      if(forceRemote&&typeof window.petatoeSyncSalesReportsFromSupabase==='function'){
        await window.petatoeSyncSalesReportsFromSupabase();
      }else{
        commitRuntimeRows(reason||'smart-reports-open');
      }
      // The remote sync normally commits itself, but this final canonical commit
      // guarantees the lexical legacy `records` array matches PETATOEDataSource.
      commitRuntimeRows((reason||'smart-reports')+'-final-commit');
      return true;
    });
  }
  function ensureSmartRuntime(){
    var gate=window.PETATOEMobileStartupGate;
    if(gate&&typeof gate.ensureGroup==='function'){
      return Promise.resolve(gate.ensureGroup('smartReports')).then(function(ready){
        if(!ready) throw new Error('Smart Reports runtime is not ready');
        return true;
      });
    }
    var services=window.PETATOESmartServices;
    var ready=typeof window.renderSmartReports==='function' &&
      ((services&&services.__ready&&typeof services.scopedData==='function') || typeof window.smartServicesScopedData==='function') &&
      typeof window.setSmartTab==='function';
    return ready?Promise.resolve(true):Promise.reject(new Error('Smart Reports provider contract is incomplete'));
  }
  function requestRender(tab,reason,forceRemote){
    tab=clean(tab)||currentTab()||'overview';
    lastRequestedTab=tab;
    if(activePromise) return activePromise.then(function(){return renderNow(lastRequestedTab,reason||'queued-smart-render');});
    activePromise=ensureSmartRuntime().then(function(){
      return synchronize(!!forceRemote,reason);
    }).then(function(){
      return renderNow(tab,reason||'smart-render');
    }).catch(function(error){
      try{console.error('[PETATOE Smart] runtime readiness failed',error);}catch(_e){}
      return false;
    }).finally(function(){ activePromise=null; });
    return activePromise;
  }

  window.PETATOESmartReportsReadyRender=function(tab,reason,forceRemote){
    return requestRender(tab,reason||'public-ready-render',!!forceRemote);
  };
  window.PETATOESmartReportsRefresh=function(tab){
    return requestRender(tab||currentTab(),'public-smart-refresh',true);
  };
  window.PETATOEOpenSmartReports=function(tab,event){
    try{if(event&&event.preventDefault)event.preventDefault();}catch(_e){}
    tab=clean(tab)||'overview';
    lastRequestedTab=tab;
    try{
      if(window.PETATOERouter&&typeof window.PETATOERouter.openTab==='function') window.PETATOERouter.openTab('smart',tab);
      else if(typeof window.tab==='function') window.tab('smart');
    }catch(_e){}
    requestRender(tab,'public-smart-open',false);
    return false;
  };

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
