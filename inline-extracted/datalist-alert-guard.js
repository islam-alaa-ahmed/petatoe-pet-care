(function(){
  'use strict';
  if(window.__PETATOE_DATALIST_ALERT_GUARD_BOOTED__) return;
  window.__PETATOE_DATALIST_ALERT_GUARD_BOOTED__ = true;
  /* v3.11.10: using global byId */
  function cleanNative(){
    var inp=(typeof byId==='function'?byId('whItem'):document.getElementById('whItem'));
    if(inp){inp.removeAttribute('list');inp.setAttribute('autocomplete','off');}
    var dl=(typeof byId==='function'?byId('whItemsList'):document.getElementById('whItemsList'));
    if(dl&&dl.parentNode)dl.parentNode.removeChild(dl);
    var lim=(typeof byId==='function'?byId('whLowAlertLimit'):document.getElementById('whLowAlertLimit'));
    if(lim&&!lim.value){
      try{lim.value=(window.PETATOEStorage&&window.PETATOEStorage.get?window.PETATOEStorage.get('PETATOE_WAREHOUSE_LOW_STOCK_LIMIT_V1',5):5)}catch(e){lim.value=5}
    }
  }
  document.addEventListener('focusin',function(e){if(e.target&&e.target.id==='whItem')cleanNative()},true);
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='whItem')setTimeout(cleanNative,0)},true);
  document.addEventListener('click',function(e){if(e.target&&e.target.id==='whItem')cleanNative()},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(cleanNative,100);setTimeout(cleanNative,800);setTimeout(cleanNative,1800)});
  else {setTimeout(cleanNative,100);setTimeout(cleanNative,800);setTimeout(cleanNative,1800)}
})();