/* PETATOE v8.0.2 — Navigation Permissions Visibility Lock
   Hides unauthorized navigation entries completely, not disabled/dimmed.
   Source of truth: PETATOEPermissions backed by Supabase app_user_permissions/role permissions. */
(function(){
  'use strict';
  if(window.__PETATOE_NAVIGATION_PERMISSIONS_VISIBILITY_LOCK__) return;
  window.__PETATOE_NAVIGATION_PERMISSIONS_VISIBILITY_LOCK__ = true;

  var SCREEN_ALIASES = {
    dashboard:'dashboard',
    entry:'sales', import:'sales', records:'reports', logs:'audit',
    smart:'reports', customer360:'reports', executive:'reports',
    treasury:'treasury', warehouses:'warehouses', obligations:'obligations',
    commissions:'commissions', commissionStatement:'commissionStatement', fleet:'vehicles',
    payroll:'payroll', salarySlip:'salarySlip', childrenExpenses:'childrenExpenses',
    appointments:'appointments', 'appointments-master':'appointments',
    vehicleOperations:'vehicleOperations', vehicleOperationsReports:'vehicleOperations', operationKpis:'vehicleOperations',
    settings:'settings', system:'settings', setup:'setup', permissions:'permissions', users:'users', audit:'audit'
  };
  var ACTION_ALIASES = { backup:'backup', restore:'restore' };

  function notify(msg){ try{ if(typeof window.toast==='function') window.toast(msg); else console.warn(msg); }catch(_e){} }
  function normalizeScreen(screen){ screen=String(screen||'').trim(); return SCREEN_ALIASES[screen] || screen || 'dashboard'; }
  function normalizeRole(role){ return String(role||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'); }
  function isSettingsScreen(screen){ screen=normalizeScreen(screen); return screen==='settings'||screen==='setup'||screen==='permissions'||screen==='users'||screen==='audit'; }
  function currentUser(){
    try{ if(window.PETATOEAuth && typeof window.PETATOEAuth.currentUser==='function'){ var a=window.PETATOEAuth.currentUser(); if(a&&typeof a==='object') return a; } }catch(_e){}
    try{ if(window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.currentUser==='function'){ var s=window.__PETATOE_SETTINGS_API__.currentUser(); if(s&&typeof s==='object') return s; } }catch(_e){}
    try{ if(window.__PETATOE_ACTIVE_USER__ && typeof window.__PETATOE_ACTIVE_USER__==='object') return window.__PETATOE_ACTIVE_USER__; }catch(_e){}
    try{ if(window.currentUser && typeof window.currentUser==='object') return window.currentUser; }catch(_e){}
    return {id:'',username:'',fullName:'Guest',role:'guest',status:'inactive'};
  }
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
  function userId(u){ return String((u&&(u.id||u.userId||u.uid||u.username))||'').trim(); }
  function canSpecial(u,key){
    if(!key) return false;
    if(isSuperUser(u)) return true;
    try{ if(window.PETATOEPermissions && typeof window.PETATOEPermissions.canSpecial==='function') return !!window.PETATOEPermissions.canSpecial(userId(u),key); }catch(e){}
    return false;
  }
  function canOpen(screen){
    screen=normalizeScreen(screen);
    if(screen==='dashboard') return true;
    var u=currentUser();
    if(isSuperUser(u)) return true;
    if(!u||!userId(u)||String(u.status||'').toLowerCase()==='inactive'||String(u.role||'').toLowerCase()==='guest') return false;
    try{
      if(window.PETATOEPermissions && typeof window.PETATOEPermissions.can==='function'){
        return !!(window.PETATOEPermissions.can(userId(u),screen,'view')||window.PETATOEPermissions.can(userId(u),screen,'add')||window.PETATOEPermissions.can(userId(u),screen,'edit')||window.PETATOEPermissions.can(userId(u),screen,'delete'));
      }
    }catch(e){ if(window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch) window.PETATOEUtils.warnSilentCatch('navigation/navigation-permissions.js', e); }
    return false;
  }
  function screenFromButton(btn){
    if(!btn) return '';
    var explicit=btn.getAttribute('data-pet-permission-screen')||btn.getAttribute('data-pet-nav-screen')||'';
    if(explicit) return normalizeScreen(explicit);
    var sm=btn.getAttribute('data-settings-main');
    if(sm) return normalizeScreen(sm);
    return normalizeScreen(btn.getAttribute('data-tab')||'');
  }
  function actionFromButton(btn){ return (btn&&(btn.getAttribute('data-settings-action')||btn.getAttribute('data-pet-permission-action')||''))||''; }
  function isNavEntry(btn){
    return !!(btn && (btn.hasAttribute('data-tab')||btn.hasAttribute('data-settings-main')||btn.hasAttribute('data-pet-nav-screen')||btn.hasAttribute('data-pet-permission-screen')) && !btn.hasAttribute('data-v142-toggle'));
  }
  function buttonAllowed(btn){
    if(!btn) return true;
    var screen=screenFromButton(btn), action=actionFromButton(btn), u=currentUser();
    if(screen==='dashboard') return true;
    if(action && ACTION_ALIASES[action]) return canSpecial(u,ACTION_ALIASES[action]);
    return canOpen(screen);
  }
  function removeUnauthorizedButtons(root){
    Array.prototype.slice.call(root.querySelectorAll('button')).forEach(function(btn){
      if(!isNavEntry(btn)) return;
      if(!buttonAllowed(btn)){
        try{ btn.remove(); }catch(_e){ if(btn.parentNode) btn.parentNode.removeChild(btn); }
      }
    });
  }
  function removeEmptyGroups(root){
    Array.prototype.slice.call(root.querySelectorAll('.pet-v142-group')).forEach(function(group){
      var entries=group.querySelectorAll('.pet-v142-items button[data-tab],.pet-v142-items button[data-settings-main],.pet-v142-items button[data-pet-nav-screen],.pet-v142-items button[data-pet-permission-screen]');
      if(!entries.length){
        try{ group.remove(); }catch(_e){ if(group.parentNode) group.parentNode.removeChild(group); }
      }
    });
  }
  function apply(root){
    root=root||document.getElementById('nav');
    if(!root) return;
    removeUnauthorizedButtons(root);
    removeEmptyGroups(root);
  }
  function guardClick(btn){
    var screen=screenFromButton(btn);
    if(!screen||screen==='dashboard') return true;
    var u=currentUser();
    if(isSuperUser(u)) return true;
    if(isSettingsScreen(screen) && (!u || !userId(u) || u.__bootstrap)) return true;
    if(buttonAllowed(btn)) return true;
    notify('غير متاح للصلاحية الحالية');
    return false;
  }

  window.PETATOENavigationPermissions={
    currentUser:currentUser,isSuperUser:isSuperUser,normalizeScreen:normalizeScreen,canOpen:canOpen,apply:apply,guardClick:guardClick,buttonAllowed:buttonAllowed,__v:'8.0.2-visibility-lock-hide'
  };
  document.addEventListener('petatoe:navbuilt',function(e){apply(e.detail&&e.detail.nav);});
  document.addEventListener('petatoe:permissionschanged',function(){setTimeout(function(){apply();},30);});
  document.addEventListener('petatoe:userchanged',function(){setTimeout(function(){apply();},30);});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){apply();},120);});
  window.addEventListener('load',function(){setTimeout(function(){apply();},250);setTimeout(function(){apply();},1000);});
})();
