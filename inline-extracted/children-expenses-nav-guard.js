/* PETATOE v8.0.2 — Children Expenses navigation visibility guard.
   Supabase-era guard for active-user permissions. */
(function(){
  'use strict';
  if(window.__PETATOE_CHILDREN_EXPENSES_NAV_GUARD__) return;
  window.__PETATOE_CHILDREN_EXPENSES_NAV_GUARD__ = true;
  var SCREEN = 'childrenExpenses';

  function warn(e, scope){
    try{
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('inline-extracted/children-expenses-nav-guard.js', e, {scope: scope || 'children-expenses-nav-guard'});
        return;
      }
      if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
        window.PETATOEUtils.warnSilentCatch('inline-extracted/children-expenses-nav-guard.js', e);
      }
    }catch(_e){}
  }

  function activeUser(){
    try{
      if(window.PETATOEAuth && typeof window.PETATOEAuth.currentUser === 'function'){
        var au = window.PETATOEAuth.currentUser();
        if(au) return au;
      }
    }catch(e){ warn(e, 'authCurrentUser'); }
    try{ if(window.__PETATOE_ACTIVE_USER__) return window.__PETATOE_ACTIVE_USER__; }catch(_e){}
    try{ if(window.currentUser) return window.currentUser; }catch(_e){}
    return {id:'', username:'', role:'guest', status:'inactive'};
  }

  function currentUserId(){
    var u = activeUser();
    if(typeof u === 'string') return u;
    return String((u && (u.id || u.username || u.email)) || '').trim();
  }

  function isPrivilegedUser(u){
    var role = String((u&&u.role)||'').toLowerCase();
    var id = String((u&&u.id)||'').toLowerCase();
    return role==='superadmin' || role==='super_admin' || role==='super admin' || role==='administrator' || role==='مدير' || id==='u_admin';
  }

  function canView(){
    try{
      var u = activeUser();
      if(isPrivilegedUser(u)) return true;
      if(window.PETATOEPermissions && typeof window.PETATOEPermissions.can === 'function'){
        return !!window.PETATOEPermissions.can(currentUserId(), SCREEN, 'view');
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
      try{
        if(window.PETATOEInlineHandlers && window.PETATOEInlineHandlers.moduleCall) window.PETATOEInlineHandlers.moduleCall('router','openTab','dashboard');
        else if(window.PETATOERouter && window.PETATOERouter.openTab) window.PETATOERouter.openTab('dashboard');
      }catch(err){ warn(err, 'redirectDeniedTab'); }
    }
    setTimeout(apply, 60);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.addEventListener('load', function(){ setTimeout(apply, 100); setTimeout(apply, 1000); });
})();
