/* PETATOE v6.4.5 RX1: Navigation Controller Extraction
 * Extracted from index.html without changing behavior.
 * Owns legacy-compatible PETATOERouter.openTab/tab binding.
 */
/* PETATOE v6.4.5 RX1 NAVIGATION CONTROLLER - extracted single navigation source */
(function(){
  'use strict';
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
  function byIdSafe(id){return document.getElementById(id);}
  function currentTab(){var p=document.querySelector('.panel.active');return p?p.id:'dashboard';}
  function markNav(tabId,smartOpen){qsa('#nav button[data-tab], #nav .pet-nav-direct[data-tab]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-tab')===tabId && (!smartOpen || b.getAttribute('data-smart-open')===smartOpen));});}
  function runBuiltinRenderers(tabId,smartOpen){
    // v3.11.22: Router is navigation-only. Rendering is handled by petatoe:tabchange subscribers.
  }
  function dispatchTabChange(tabId,smartOpen){
    try{document.dispatchEvent(new CustomEvent('petatoe:tabchange',{detail:{tabId:tabId,smartOpen:smartOpen||'',previousTab:window.PETATOERouter&&window.PETATOERouter.current||''}}));}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
  }
  function reportRouteBlocked(tabId, reason){
    try{
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.capture === 'function'){
        window.PETATOEDiagnostics.capture('warn','router.rbac.blocked',{route:tabId||'',reason:reason||'permission-denied'});
      }else if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.record === 'function'){
        window.PETATOEDiagnostics.record('router.rbac.blocked',{route:tabId||'',reason:reason||'permission-denied'});
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/navigation-controller.js',e);}
  }
  function routeAllowed(tabId){
    if(!tabId || tabId==='dashboard') return true;
    try{
      var perms=window.PETATOENavigationPermissions;
      if(perms && typeof perms.canOpen==='function') return !!perms.canOpen(tabId);
    }catch(e){
      reportRouteBlocked(tabId,'permission-check-error');
      return false;
    }
    return true;
  }
  function openTab(tabId,smartOpen){
    if(!tabId) return false;
    smartOpen=smartOpen||'';
    if(!routeAllowed(tabId)){
      reportRouteBlocked(tabId,'permission-denied');
      tabId='dashboard';
      smartOpen='';
    }
    var previous=window.PETATOERouter&&window.PETATOERouter.current||currentTab();
    var previousSmart=window.PETATOERouter&&window.PETATOERouter.currentSmart||'';
    var target=byIdSafe(tabId);
    var sameActive=target&&target.classList&&target.classList.contains('active')&&previous===tabId&&previousSmart===smartOpen;
    window.PETATOERouter.current=tabId;
    window.PETATOERouter.currentSmart=smartOpen;
    if(sameActive){
      markNav(tabId,smartOpen);
      try{ if(typeof closeSidebar==='function') closeSidebar(); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
      // PETATOE v6.1.205: opening an already-active tab must still notify screen modules.
      // Otherwise settings/users/permissions can stay blank because their render subscriber never runs.
      dispatchTabChange(tabId,smartOpen);
      return true;
    }
    if(target){ qsa('.panel').forEach(function(p){p.classList.remove('active')}); target.classList.add('active'); }
    markNav(tabId,smartOpen);
    try{ if(typeof closeSidebar==='function') closeSidebar(); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
    runBuiltinRenderers(tabId,smartOpen);
    dispatchTabChange(tabId,smartOpen);
    return true;
  }
  function bind(){
    var nav=byIdSafe('nav'); if(!nav||nav.__petatoeRouterFinalBound) return; nav.__petatoeRouterFinalBound=true;
    nav.addEventListener('click',function(e){
      // PETATOE v8.0.2 Phase 6: when the canonical v142 navigation is active,
      // navigation/navigation.js owns menu click routing because it also carries
      // data-pet-nav-screen, settings navigation, sub-tab intent, and permission guardClick.
      // This legacy router listener must fail-open, otherwise it captures data-tab clicks
      // first and checks only tabId, causing wrong permission/screen identity decisions.
      if(nav.classList && nav.classList.contains('pet-v142-nav')) return;
      var b=e.target.closest&&e.target.closest('button[data-tab], .pet-nav-direct[data-tab]');
      if(!b||!nav.contains(b)) return;
      e.preventDefault(); e.stopPropagation();
      openTab(b.getAttribute('data-tab'),b.getAttribute('data-smart-open')||b.dataset.smartOpen||'');
      return false;
    },true);
  }
  window.PETATOENavigationController={openTab:openTab,currentTab:currentTab,bind:bind,markNav:markNav};
  window.PETATOERouter={openTab:openTab,currentTab:currentTab,bind:bind,current:currentTab()};
  window.tab=window.PETATOERouter.openTab; // single compatibility alias for legacy inline HTML
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  setTimeout(bind,300); setTimeout(bind,1000);
})();
