/** PETATOE v3.11.19 Router external guard: the single router is defined in index.html. */
(function(){
  'use strict';
  if(window.__PETATOE_ROUTER_EXTERNAL_GUARD_READY__) return;
  window.__PETATOE_ROUTER_EXTERNAL_GUARD_READY__ = true;

  function bindRouterOnce(){
    if(window.__PETATOE_ROUTER_EXTERNAL_BIND_DONE__) return;
    if(!(window.PETATOERouter && typeof window.PETATOERouter.bind === 'function')) return;
    window.__PETATOE_ROUTER_EXTERNAL_BIND_DONE__ = true;
    try{ window.PETATOERouter.bind(); }
    catch(e){ console.error('PETATOE router bind error', e); }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindRouterOnce, { once:true });
  }else{
    bindRouterOnce();
  }
})();
