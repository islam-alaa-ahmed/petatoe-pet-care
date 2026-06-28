/* PETATOE v3.11.35 — tab rendering subscribers; Router remains navigation-only. */
(function(){
  'use strict';
  if(window.__PETATOE_TAB_RENDER_SUBSCRIBERS_V31122__) return;
  window.__PETATOE_TAB_RENDER_SUBSCRIBERS_V31122__=true;
  function later(fn,ms){try{setTimeout(fn,ms||0)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}}
  var selfManaged={executive:1,fleet:1,commissions:1,obligations:1,treasury:1,warehouses:1,entry:1,settings:1};
  var lastKey='',lastAt=0;
  function renderFor(tabId,smartOpen){
    var key=String(tabId||'')+'|'+String(smartOpen||'');
    var now=Date.now?Date.now():(new Date()).getTime();
    if(key===lastKey && now-lastAt<140) return;
    lastKey=key; lastAt=now;
    if(selfManaged[tabId]) return;
    try{if(tabId==='records'&&typeof window.renderRecords==='function')window.renderRecords()}catch(e){console.error('PETATOE records render error',e)}
    try{if((tabId==='sales'||tabId==='vans'||tabId==='services')&&typeof window.renderDeep==='function')window.renderDeep()}catch(e){console.error('PETATOE deep render error',e)}
    try{if(tabId==='smart'&&typeof window.renderSmartReports==='function'){window.renderSmartReports();if(smartOpen&&typeof window.setSmartTab==='function')later(function(){window.setSmartTab(smartOpen)},0)}}catch(e){console.error('PETATOE smart render error',e)}
    try{if(tabId==='customer360'&&typeof window.renderCustomer360Panel==='function')window.renderCustomer360Panel()}catch(e){console.error('PETATOE customer360 render error',e)}
    try{if(tabId==='dashboard'&&typeof window.renderDashboardAll==='function')window.renderDashboardAll()}catch(e){console.error('PETATOE dashboard render error',e)}
    try{if(tabId==='executive'&&typeof window.renderExecutiveDashboard==='function')later(window.renderExecutiveDashboard,80)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
    try{if(tabId==='fleet'&&typeof window.PETATOEFleetRender==='function')later(window.PETATOEFleetRender,0)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
    try{if(tabId==='commissions'&&typeof window.renderCommissionSystem==='function')later(window.renderCommissionSystem,0)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
    try{if(tabId==='obligations'&&typeof window.petObligationsBoot==='function')later(window.petObligationsBoot,120)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
    try{if(tabId==='treasury'&&window.PETATOETreasury&&typeof window.PETATOETreasury.render==='function')later(function(){window.PETATOETreasury.render()},0)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
    try{if(tabId==='warehouses'&&window.PETATOEWarehouses&&typeof window.PETATOEWarehouses.render==='function')later(function(){window.PETATOEWarehouses.render()},0)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
    try{if(tabId==='entry'&&typeof window.petInvoiceManualMultiItemsBoot==='function')later(window.petInvoiceManualMultiItemsBoot,120)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
    try{if(tabId==='settings'&&typeof window.renderSettingsPanelV110==='function')later(window.renderSettingsPanelV110,160)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/tab-render-subscribers.js",e);}
  }
  document.addEventListener('petatoe:tabchange',function(e){var d=e.detail||{};renderFor(d.tabId,d.smartOpen||'')});
})();