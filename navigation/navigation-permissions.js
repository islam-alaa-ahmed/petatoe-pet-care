/* PETATOE v8.0.2 — Navigation Permissions Supabase Stage 3
   Delegates screen access to PETATOEPermissions, which is backed by app_users/app_user_permissions.
   No LocalStorage/PETATOEStorage fallback is used here. */
(function(){
  'use strict';
  if(window.__PETATOE_NAVIGATION_PERMISSIONS_SUPABASE_STAGE3__) return;
  window.__PETATOE_NAVIGATION_PERMISSIONS_SUPABASE_STAGE3__ = true;

  var SCREEN_ALIASES = {
    dashboard:'dashboard', entry:'sales', import:'sales', records:'reports', logs:'audit',
    smart:'reports', customer360:'reports', executive:'reports',
    treasury:'treasury', warehouses:'warehouses', obligations:'obligations',
    commissions:'commissions', commissionStatement:'commissionStatement', fleet:'vehicles',
    payroll:'payroll', salarySlip:'salarySlip', childrenExpenses:'childrenExpenses',
    appointments:'appointments', vehicleOperations:'vehicleOperations', vehicleOperationsReports:'vehicleOperations', operationKpis:'vehicleOperations',
    settings:'settings', setup:'setup', permissions:'permissions', users:'users', audit:'audit'
  };

  function notify(msg){ try{ if(typeof window.toast==='function') window.toast(msg); else console.warn(msg); }catch(_e){} }
  function normalizeScreen(screen){ return SCREEN_ALIASES[screen] || screen || 'dashboard'; }
  function isSettingsScreen(screen){ screen=normalizeScreen(screen); return screen==='settings'||screen==='setup'||screen==='permissions'||screen==='users'||screen==='audit'; }
  function normalizeRole(role){ return String(role||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'); }
  function isSuperUser(u){
    if(!u) u=currentUser();
    var roleRaw=String((u&&(u.role||u.role_code||u.userRole||u.type||u.permissionRole))||'').trim().toLowerCase();
    var role=normalizeRole(roleRaw);
    var name=String((u&&(u.username||u.name||u.fullName||u.full_name||u.login))||'').trim().toLowerCase();
    var id=String((u&&(u.id||u.userId||u.uid))||'').trim().toLowerCase();
    var jobRaw=String((u&&(u.job||u.title||u.position))||'').trim().toLowerCase();
    var job=normalizeRole(jobRaw);
    return role==='superadmin'||role==='super_admin'||role==='administrator'||role==='admin_super'||roleRaw.indexOf('super')>-1||roleRaw.indexOf('سوبر')>-1||
      id==='u_admin'||id==='admin'||name==='admin'||name==='superadmin'||name==='super_admin'||name==='super admin'||job.indexOf('super')>-1||jobRaw.indexOf('سوبر')>-1;
  }
  function guestUser(){ return {id:'',username:'',fullName:'Guest',role:'guest',status:'inactive'}; }
  function currentUser(){
    try{ if(window.PETATOEAuth && typeof window.PETATOEAuth.currentUser==='function'){ var a=window.PETATOEAuth.currentUser(); if(a&&typeof a==='object') return a; } }catch(_e){}
    try{ if(window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.currentUser==='function'){ var s=window.__PETATOE_SETTINGS_API__.currentUser(); if(s&&typeof s==='object') return s; } }catch(_e){}
    try{ if(window.__PETATOE_ACTIVE_USER__ && typeof window.__PETATOE_ACTIVE_USER__==='object') return window.__PETATOE_ACTIVE_USER__; }catch(_e){}
    try{ if(window.currentUser && typeof window.currentUser==='object') return window.currentUser; }catch(_e){}
    return guestUser();
  }
  function canOpen(screen){
    screen=normalizeScreen(screen);
    if(screen==='dashboard') return true;
    var u=currentUser();
    if(isSuperUser(u)) return true;
    if(!u||!u.id||String(u.status||'').toLowerCase()==='inactive'||String(u.role||'').toLowerCase()==='guest') return false;
    try{
      if(window.PETATOEPermissions && typeof window.PETATOEPermissions.can==='function'){
        return !!window.PETATOEPermissions.can(u.id, screen, 'view');
      }
    }catch(e){ if(window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch) window.PETATOEUtils.warnSilentCatch('navigation/navigation-permissions.js', e); }
    return false;
  }
  function screenFromButton(btn){
    if(!btn) return '';
    var sm=btn.getAttribute('data-settings-main');
    if(sm) return normalizeScreen(sm);
    return normalizeScreen(btn.getAttribute('data-pet-nav-screen')||btn.getAttribute('data-tab')||'');
  }
  function apply(root){
    root=root||document.getElementById('nav');
    if(!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('button[data-tab],button[data-settings-main]'),function(btn){
      var screen=screenFromButton(btn);
      var allowed=canOpen(screen);
      btn.classList.toggle('pet-nav-disabled',!allowed);
      btn.toggleAttribute('aria-disabled',!allowed);
      if(!allowed) btn.setAttribute('title','غير متاح للصلاحية الحالية'); else btn.removeAttribute('title');
    });
  }
  function guardClick(btn){
    var screen=screenFromButton(btn);
    if(!screen||screen==='dashboard') return true;
    var u=currentUser();
    if(isSuperUser(u)) return true;
    if(isSettingsScreen(screen) && (!u || !u.id || u.__bootstrap)) return true;
    if(canOpen(screen)) return true;
    notify('غير متاح للصلاحية الحالية');
    return false;
  }

  window.PETATOENavigationPermissions={currentUser:currentUser,isSuperUser:isSuperUser,normalizeScreen:normalizeScreen,canOpen:canOpen,apply:apply,guardClick:guardClick,__v:'8.0.2-stage3-supabase'};
  document.addEventListener('petatoe:navbuilt',function(e){apply(e.detail&&e.detail.nav);});
  document.addEventListener('petatoe:permissionschanged',function(){apply();});
  document.addEventListener('petatoe:userchanged',function(){apply();});
})();
