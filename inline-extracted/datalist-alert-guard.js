(function(){
  'use strict';
  if(window.__PETATOE_DATALIST_ALERT_GUARD_BOOTED__) return;
  window.__PETATOE_DATALIST_ALERT_GUARD_BOOTED__ = true;
  /* v3.11.10: using global byId */
  function getWarehouseLowLimit(){
    var value=5;
    try{
      var facade=window.PETATOEWarehouseReadFacade;
      if(facade&&typeof facade.getLowLimit==='function') value=facade.getLowLimit();
      else{
        var store=window.PETATOEWarehouseDataStore;
        if(store&&typeof store.getSetting==='function') value=store.getSetting('lowLimit',5);
      }
    }catch(e){ value=5; }
    var n=parseFloat(String(value==null?'':value).replace(/,/g,''));
    return isFinite(n)&&n>0?String(Math.round(n)):String(5);
  }
  function cleanNative(){
    var inp=(typeof byId==='function'?byId('whItem'):document.getElementById('whItem'));
    if(inp){inp.removeAttribute('list');inp.setAttribute('autocomplete','off');}
    var dl=(typeof byId==='function'?byId('whItemsList'):document.getElementById('whItemsList'));
    if(dl&&dl.parentNode)dl.parentNode.removeChild(dl);
    var lim=(typeof byId==='function'?byId('whLowAlertLimit'):document.getElementById('whLowAlertLimit'));
    if(lim&&!lim.value){ lim.value=getWarehouseLowLimit(); }
  }
  document.addEventListener('focusin',function(e){if(e.target&&e.target.id==='whItem')cleanNative()},true);
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='whItem')setTimeout(cleanNative,0)},true);
  document.addEventListener('click',function(e){if(e.target&&e.target.id==='whItem')cleanNative()},true);
  document.addEventListener('petatoe:warehouse:supabase-loaded',function(){setTimeout(cleanNative,0)},false);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(cleanNative,100);setTimeout(cleanNative,800);setTimeout(cleanNative,1800)});
  else {setTimeout(cleanNative,100);setTimeout(cleanNative,800);setTimeout(cleanNative,1800)}
})();