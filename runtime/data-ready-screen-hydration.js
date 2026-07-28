/* PETATOE v10.0.25 — Phase B2: Data-ready active-screen hydration bridge.
 * Coordinates provider readiness, Supabase hydration and active-screen rendering.
 * No business calculations, queries or persistence rules are changed here.
 */
(function(){
  'use strict';
  if(window.PETATOEDataReadyScreenHydration && window.PETATOEDataReadyScreenHydration.__ready) return;

  var smartOpenPromise=null;
  var smartRenderTimer=null;
  var payrollOpenPromise=null;
  var payrollRenderTimer=null;
  var lastSmartTab='overview';

  function panelActive(id){
    var el=document.getElementById(id);
    return !!(el && el.classList.contains('active'));
  }
  function ensureGroup(name){
    var gate=window.PETATOEMobileStartupGate;
    if(!gate || typeof gate.ensureGroup!=='function') return Promise.resolve(true);
    return Promise.resolve(gate.ensureGroup(name));
  }
  function runtimeRows(){
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync==='function'){
        var rows=window.PETATOEDataSource.getRecordsSync();
        if(Array.isArray(rows)) return rows;
      }
    }catch(_e){}
    return Array.isArray(window.records)?window.records:[];
  }
  function currentSmartTab(fallback){
    var active=document.querySelector('[data-smart-tab].active, #smartTabs .smart-pill.active');
    var value=active && (active.getAttribute('data-smart-tab') || (active.dataset&&active.dataset.smartTab));
    return String(value || fallback || lastSmartTab || 'overview');
  }
  function renderSmart(tab){
    tab=currentSmartTab(tab);
    lastSmartTab=tab;
    if(typeof window.renderSmartReports==='function') window.renderSmartReports(tab);
    if(typeof window.setSmartTab==='function'){
      requestAnimationFrame(function(){
        try{window.setSmartTab(tab);}catch(e){console.error('[PETATOE Hydration] smart tab render failed',e);}
      });
    }
  }
  function syncSmartRemote(){
    if(typeof window.petatoeSyncSalesReportsFromSupabase==='function'){
      return Promise.resolve(window.petatoeSyncSalesReportsFromSupabase());
    }
    var ds=window.PETATOEDataSource;
    if(ds && typeof ds.refreshSalesRecordsFromSupabase==='function'){
      return Promise.resolve(ds.refreshSalesRecordsFromSupabase('smart-screen-hydration',{force:true}));
    }
    return Promise.resolve(null);
  }
  function openSmart(tab,options){
    options=options||{};
    lastSmartTab=String(tab||currentSmartTab()||'overview');
    if(smartOpenPromise) return smartOpenPromise;
    smartOpenPromise=ensureGroup('smartReports').then(function(ready){
      if(ready===false) return false;
      var rows=runtimeRows();
      if(rows.length && !options.forceRemote){
        renderSmart(lastSmartTab);
        return true;
      }
      return syncSmartRemote().then(function(){
        renderSmart(lastSmartTab);
        return true;
      });
    }).catch(function(e){
      console.error('[PETATOE Hydration] Smart Reports hydration failed',e);
      return false;
    }).finally(function(){smartOpenPromise=null;});
    return smartOpenPromise;
  }
  function scheduleSmartRender(reason){
    clearTimeout(smartRenderTimer);
    smartRenderTimer=setTimeout(function(){
      smartRenderTimer=null;
      if(!panelActive('smart')) return;
      ensureGroup('smartReports').then(function(ready){
        if(ready!==false) renderSmart(currentSmartTab());
      }).catch(function(e){console.error('[PETATOE Hydration] Smart Reports event render failed',reason,e);});
    },80);
  }
  function payrollApi(){return window.PETATOEPayroll||null;}
  function renderPayrollTarget(tabId){
    var api=payrollApi();
    if(!api) return false;
    if(tabId==='salarySlip'){
      if(typeof api.renderSalarySlip==='function') api.renderSalarySlip();
      return true;
    }
    if(typeof api.render==='function') api.render();
    return true;
  }
  function openPayroll(tabId){
    tabId=tabId==='salarySlip'?'salarySlip':'payroll';
    if(payrollOpenPromise) return payrollOpenPromise;
    payrollOpenPromise=ensureGroup('payroll').then(function(ready){
      if(ready===false) return false;
      var api=payrollApi();
      if(!api) return false;
      if(typeof api.isSupabaseLoaded==='function' && api.isSupabaseLoaded()){
        return renderPayrollTarget(tabId);
      }
      if(typeof api.reloadFromSupabase==='function'){
        return Promise.resolve(api.reloadFromSupabase()).then(function(){return renderPayrollTarget(tabId);});
      }
      return renderPayrollTarget(tabId);
    }).catch(function(e){
      console.error('[PETATOE Hydration] Payroll hydration failed',e);
      return false;
    }).finally(function(){payrollOpenPromise=null;});
    return payrollOpenPromise;
  }
  function schedulePayrollRender(){
    clearTimeout(payrollRenderTimer);
    payrollRenderTimer=setTimeout(function(){
      payrollRenderTimer=null;
      if(panelActive('salarySlip')) renderPayrollTarget('salarySlip');
      else if(panelActive('payroll')) renderPayrollTarget('payroll');
    },50);
  }

  window.addEventListener('petatoe:records-changed',function(){
    if(runtimeRows().length && panelActive('smart')) scheduleSmartRender('records-changed');
  });
  window.addEventListener('petatoe:payroll-provider-ready',function(){
    if(panelActive('payroll')) openPayroll('payroll');
    else if(panelActive('salarySlip')) openPayroll('salarySlip');
  });
  document.addEventListener('petatoe:payroll-supabase-ready',schedulePayrollRender);

  window.PETATOEDataReadyScreenHydration={
    __ready:true,
    openSmart:openSmart,
    refreshSmart:function(tab){return openSmart(tab||currentSmartTab(),{forceRemote:true});},
    openPayroll:openPayroll,
    renderActivePayroll:schedulePayrollRender,
    getState:function(){return{smartInFlight:!!smartOpenPromise,payrollInFlight:!!payrollOpenPromise,smartRows:runtimeRows().length,lastSmartTab:lastSmartTab};}
  };
})();
