/* PETATOE v10.0.25 — Phase B2.1: Payroll data-ready active-screen hydration.
 * Smart Reports ownership is canonicalized in smart-reports-open-refresh-guard.js.
 * No business calculations, queries or persistence rules are changed here.
 */
(function(){
  'use strict';
  if(window.PETATOEDataReadyScreenHydration && window.PETATOEDataReadyScreenHydration.__ready) return;

  var payrollOpenPromise=null;
  var payrollRenderTimer=null;

  function panelActive(id){
    var el=document.getElementById(id);
    return !!(el && el.classList.contains('active'));
  }
  function ensureGroup(name){
    var gate=window.PETATOEMobileStartupGate;
    if(!gate || typeof gate.ensureGroup!=='function') return Promise.resolve(true);
    return Promise.resolve(gate.ensureGroup(name));
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
  function waitPayrollData(api){
    if(!api) return Promise.resolve(false);
    if(typeof api.whenSupabaseReady==='function') return Promise.resolve(api.whenSupabaseReady());
    if(typeof api.isSupabaseLoaded==='function' && api.isSupabaseLoaded()) return Promise.resolve(true);
    if(typeof api.reloadFromSupabase==='function') return Promise.resolve(api.reloadFromSupabase()).then(function(){return true;});
    return Promise.resolve(true);
  }
  function openPayroll(tabId){
    tabId=tabId==='salarySlip'?'salarySlip':'payroll';
    if(payrollOpenPromise) return payrollOpenPromise.then(function(){return renderPayrollTarget(tabId);});
    payrollOpenPromise=ensureGroup('payroll').then(function(ready){
      if(ready===false) return false;
      var api=payrollApi();
      if(!api) return false;
      return waitPayrollData(api).then(function(){return renderPayrollTarget(tabId);});
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

  window.addEventListener('petatoe:payroll-provider-ready',function(){
    if(panelActive('payroll')) openPayroll('payroll');
    else if(panelActive('salarySlip')) openPayroll('salarySlip');
  });
  document.addEventListener('petatoe:payroll-supabase-ready',schedulePayrollRender);

  window.PETATOEDataReadyScreenHydration={
    __ready:true,
    openPayroll:openPayroll,
    renderActivePayroll:schedulePayrollRender,
    getState:function(){return{payrollInFlight:!!payrollOpenPromise};}
  };
})();
