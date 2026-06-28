/* PETATOE v6.1.123 — Personal Children Expenses navigation visibility guard.
   Scope: keep the new main-menu item visible; lock only when permissions explicitly deny access. */
(function(){
  'use strict';
  if(window.__PETATOE_CHILDREN_EXPENSES_NAV_GUARD__) return;
  window.__PETATOE_CHILDREN_EXPENSES_NAV_GUARD__ = true;
  var SCREEN = 'childrenExpenses';
  function storage(){ return window.PETATOEStorage || null; }
  function warn(e, scope){
    try{
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('inline-extracted/children-expenses-nav-guard.js', e, {scope: scope || 'children-expenses-nav-guard'});
        return;
      }
      if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
        window.PETATOEUtils.warnSilentCatch('inline-extracted/children-expenses-nav-guard.js', e);
      }
    }catch(_){ return; }
  }
  function readRaw(key, fallback){
    var st = storage();
    try{ if(st && st.get) return st.get(key, fallback); }catch(e){ warn(e, 'readRaw'); }
    return fallback;
  }
  function readJSON(key, fallback){
    var st = storage();
    try{ if(st && st.readJSON) return st.readJSON(key, fallback); }catch(e){ warn(e, 'readJSON'); }
    return fallback;
  }
  function currentUserId(){
    return readRaw('petatoe_current_user_v108','') || readRaw('petatoe_current_user_v139','') || readRaw('petatoe_current_user_v2','') || readRaw('petatoe_current_user','') || '';
  }
  function currentUser(){
    var uid = currentUserId();
    var pools = [readJSON('petatoe_users_v108',[]), readJSON('petatoe_users_v139',[]), readJSON('petatoe_users_v2',[])];
    for(var i=0;i<pools.length;i++){
      var arr = Array.isArray(pools[i]) ? pools[i] : [];
      for(var j=0;j<arr.length;j++){
        var u = arr[j] || {};
        if(String(u.id||'')===String(uid) || String(u.username||'').toLowerCase()===String(uid).toLowerCase()) return u;
      }
    }
    return {id:'', username:'', role:'guest', status:'inactive'};
  }
  function isPrivilegedUser(u){
    var role = String((u&&u.role)||readJSON('petatoe_runtime_settings_v1',{}).role||'').toLowerCase();
    var name = String((u&&u.username)||'').toLowerCase();
    var id = String((u&&u.id)||'').toLowerCase();
    return role==='superadmin' || role==='super_admin' || role==='super admin' || role==='administrator' || role==='مدير' || id==='u_admin';
  }
  function canView(){
    try{
      var u = currentUser();
      if(isPrivilegedUser(u)) return true;
      if(window.PETATOEPermissions && typeof window.PETATOEPermissions.can === 'function'){
        return !!window.PETATOEPermissions.can(String(u.id||currentUserId()), SCREEN, 'view');
      }
    }catch(e){
      warn(e, 'canView');
    }
    return true;
  }
  function apply(){
    var allowed = canView();
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-pet-permission-screen="'+SCREEN+'"], button[data-tab="'+SCREEN+'"]'));
    btns.forEach(function(btn){
      btn.classList.toggle('locked', !allowed);
      btn.removeAttribute('hidden');
      btn.style.display = '';
      btn.title = allowed ? '' : 'غير متاح للصلاحية الحالية';
    });
    var panel = document.getElementById(SCREEN);
    if(panel) panel.setAttribute('data-permission-screen', SCREEN);
  }
  document.addEventListener('petatoe:tabchange', function(e){
    var tab = e && e.detail && e.detail.tabId;
    if(tab === SCREEN && !canView()){
      try{ if(window.PETATOEInlineHandlers && window.PETATOEInlineHandlers.moduleCall) window.PETATOEInlineHandlers.moduleCall('router','openTab','dashboard'); else if(window.PETATOERouter && window.PETATOERouter.openTab) window.PETATOERouter.openTab('dashboard'); }catch(err){ warn(err, 'redirectDeniedTab'); }
    }
    setTimeout(apply, 60);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.addEventListener('load', function(){ setTimeout(apply, 100); setTimeout(apply, 1000); });
})();
