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
  function markNav(tabId,smartOpen,routeIntent){
    routeIntent=routeIntent&&typeof routeIntent==='object'?routeIntent:{};
    var requestedAppointmentsSubTab=tabId==='appointments'?String(routeIntent.appointmentsSubTab||'add').trim()||'add':'';
    var requestedScreen=String(routeIntent.navigationScreen||'').trim();
    qsa('#nav button[data-tab], #nav .pet-nav-direct[data-tab]').forEach(function(b){
      var buttonScreen=String(b.getAttribute('data-pet-nav-screen')||b.getAttribute('data-pet-permission-screen')||b.getAttribute('data-tab')||'').trim();
      var buttonSmart=String(b.getAttribute('data-smart-open')||'');
      var match=b.getAttribute('data-tab')===tabId && (tabId==='smart' ? buttonSmart===smartOpen : (!smartOpen || buttonSmart===smartOpen));
      if(match&&requestedScreen) match=buttonScreen===requestedScreen;
      if(match&&tabId==='appointments'){
        var buttonSubTab=String(b.getAttribute('data-appointments-subtab')||'add').trim()||'add';
        match=buttonSubTab===requestedAppointmentsSubTab;
      }
      b.classList.toggle('active',match);
    });
  }
  function runBuiltinRenderers(tabId,smartOpen){
    // v3.11.22: Router is navigation-only. Rendering is handled by petatoe:tabchange subscribers.
  }
  function normalizeRouteRequest(tabId,routeIntent){
    routeIntent=routeIntent&&typeof routeIntent==='object'?routeIntent:{};
    var requestedId=String(tabId||'').trim();
    var appointmentsAlias=requestedId==='appointmentsMaster'||requestedId==='appointments-master';
    if(appointmentsAlias){
      tabId='appointments';
      if(!routeIntent.appointmentsSubTab) routeIntent.appointmentsSubTab='master';
    }
    return {tabId:String(tabId||'').trim(),routeIntent:routeIntent};
  }
  function normalizeRouteIntent(tabId,routeIntent){
    routeIntent=routeIntent&&typeof routeIntent==='object'?routeIntent:{};
    var appointmentsSubTab='';
    var navigationScreen=String(routeIntent.navigationScreen||tabId||'').trim();
    if(tabId==='appointments'){
      appointmentsSubTab=String(routeIntent.appointmentsSubTab||(navigationScreen==='appointmentsMaster'?'master':'add')).trim()||'add';
      // E5.2.3: appointments sub-route and permission-screen identity are one canonical contract.
      // A delayed loader must never be able to combine master with appointments/add identity.
      if(appointmentsSubTab==='master'||navigationScreen==='appointmentsMaster'){
        appointmentsSubTab='master';
        navigationScreen='appointmentsMaster';
      }else{
        appointmentsSubTab='add';
        navigationScreen='appointments';
      }
    }
    return {appointmentsSubTab:appointmentsSubTab,navigationScreen:navigationScreen,source:String(routeIntent.source||'').trim()};
  }
  function dispatchTabChange(tabId,smartOpen,routeIntent,previousTab,previousSmart){
    var intent=normalizeRouteIntent(tabId,routeIntent);
    try{
      if(tabId==='appointments') window.__PETATOE_APPOINTMENTS_NAV_INTENT__=intent.appointmentsSubTab;
      document.dispatchEvent(new CustomEvent('petatoe:tabchange',{detail:{tabId:tabId,smartOpen:smartOpen||'',previousTab:String(previousTab||''),previousSmart:String(previousSmart||''),appointmentsSubTab:intent.appointmentsSubTab,navigationScreen:intent.navigationScreen,source:intent.source}}));
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
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
  var pendingGuardedRoute=null;
  function permissionRuntimeReady(){
    var perms=window.PETATOENavigationPermissions;
    return !!(perms&&typeof perms.canOpen==='function');
  }
  function routeAllowed(tabId,routeIntent){
    if(!tabId || tabId==='dashboard') return true;
    var intent=normalizeRouteIntent(tabId,routeIntent);
    var permissionScreen=intent.navigationScreen||tabId;
    try{
      var perms=window.PETATOENavigationPermissions;
      if(!perms || typeof perms.canOpen!=='function'){
        reportRouteBlocked(permissionScreen,'permission-runtime-not-ready');
        return false;
      }
      return !!perms.canOpen(permissionScreen);
    }catch(e){
      reportRouteBlocked(permissionScreen,'permission-check-error');
      return false;
    }
  }
  function queueGuardedRoute(tabId,smartOpen,routeIntent){
    pendingGuardedRoute={tabId:tabId,smartOpen:smartOpen||'',routeIntent:normalizeRouteIntent(tabId,routeIntent)};
  }
  function replayGuardedRoute(){
    if(!pendingGuardedRoute||!permissionRuntimeReady()) return false;
    var request=pendingGuardedRoute;
    var perms=window.PETATOENavigationPermissions;
    var permissionScreen=request.routeIntent.navigationScreen||request.tabId;
    if(!perms.canOpen(permissionScreen)) return false;
    pendingGuardedRoute=null;
    openTab(request.tabId,request.smartOpen,request.routeIntent);
    return true;
  }
  var routeIntentSequence=0;
  function hydrateRouteRuntime(tabId,routeIntent,sequence){
    try{
      var gate = window.PETATOEMobileStartupGate;
      if(!gate) return;
      var intent=normalizeRouteIntent(tabId,routeIntent);
      var ensure = typeof gate.ensureRoute === 'function'
        ? gate.ensureRoute(tabId,intent.navigationScreen)
        : (tabId==='smart' && typeof gate.ensureGroup==='function' ? gate.ensureGroup('smartReports') : null);
      if(ensure && typeof ensure.then==='function') ensure.then(function(ready){
        if(ready===false) return;
        var router=window.PETATOERouter||{};
        if(router.current!==tabId||router.currentRouteSequence!==sequence) return;
        document.dispatchEvent(new CustomEvent('petatoe:routehydrated',{detail:{tabId:tabId,appointmentsSubTab:intent.appointmentsSubTab,navigationScreen:intent.navigationScreen,source:'router-hydration-replay',routeSequence:sequence}}));
      }).catch(function(error){
        if(window.console && console.warn) console.warn('[PETATOE Router] route hydration failed', tabId, intent.navigationScreen, error);
      });
    }catch(error){
      try{
        if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.capture === 'function'){
          window.PETATOEDiagnostics.capture('warn','router.route.hydration',{route:tabId||'',message:String(error && error.message || error)});
        }
      }catch(_e){}
    }
  }
  function openTab(tabId,smartOpen,routeIntent){
    if(!tabId) return false;
    var normalizedRequest=normalizeRouteRequest(tabId,routeIntent);
    tabId=normalizedRequest.tabId;
    routeIntent=normalizedRequest.routeIntent;
    smartOpen=smartOpen||'';
    /* SG-4.6.7: route ownership must start Smart Reports hydration itself.
       This is intentionally non-blocking: navigation remains responsive while the
       canonical Startup Gate loads providers. It also covers restored/programmatic
       routes that never emit pointerdown/click before openTab(). */
    if(!routeAllowed(tabId,routeIntent)){
      if(!permissionRuntimeReady()) queueGuardedRoute(tabId,smartOpen,routeIntent);
      else reportRouteBlocked(normalizeRouteIntent(tabId,routeIntent).navigationScreen||tabId,'permission-denied');
      tabId='dashboard';
      smartOpen='';
      routeIntent={navigationScreen:'dashboard',source:'permission-fallback'};
    }
    var canonicalIntent=normalizeRouteIntent(tabId,routeIntent);
    routeIntent=canonicalIntent;
    var routeSequence=++routeIntentSequence;
    var previous=window.PETATOERouter&&window.PETATOERouter.current||currentTab();
    var previousSmart=window.PETATOERouter&&window.PETATOERouter.currentSmart||'';
    var target=byIdSafe(tabId);
    var sameActive=target&&target.classList&&target.classList.contains('active')&&previous===tabId&&previousSmart===smartOpen;
    window.PETATOERouter.current=tabId;
    window.PETATOERouter.currentSmart=smartOpen;
    window.PETATOERouter.currentIntent=canonicalIntent;
    window.PETATOERouter.currentRouteSequence=routeSequence;
    hydrateRouteRuntime(tabId,canonicalIntent,routeSequence);
    if(sameActive){
      markNav(tabId,smartOpen,normalizeRouteIntent(tabId,routeIntent));
      try{ if(typeof closeSidebar==='function') closeSidebar(); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
      // PETATOE v6.1.205: opening an already-active tab must still notify screen modules.
      // Otherwise settings/users/permissions can stay blank because their render subscriber never runs.
      dispatchTabChange(tabId,smartOpen,routeIntent,previous,previousSmart);
      return true;
    }
    if(target){ qsa('.panel').forEach(function(p){p.classList.remove('active')}); target.classList.add('active'); }
    markNav(tabId,smartOpen,normalizeRouteIntent(tabId,routeIntent));
    try{ if(typeof closeSidebar==='function') closeSidebar(); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
    runBuiltinRenderers(tabId,smartOpen);
    dispatchTabChange(tabId,smartOpen,routeIntent,previous,previousSmart);
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
  function bindWhenReady(){ bind(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindWhenReady,{once:true}); else bindWhenReady();
  // PETATOE v8.0.2 Phase 8: remove blind retry timers.
  // Re-bind only when the canonical navigation module reports that #nav was rebuilt.
  document.addEventListener('petatoe:navbuilt',bindWhenReady);
  window.addEventListener('load',bindWhenReady,{once:true});
  document.addEventListener('petatoe:navigationpermissionsapplied',replayGuardedRoute);
  window.addEventListener('petatoe:identity-ready',replayGuardedRoute);
})();
