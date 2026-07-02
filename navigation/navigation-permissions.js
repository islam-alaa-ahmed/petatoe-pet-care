(function(){
  'use strict';
  if(window.__PETATOE_NAVIGATION_PERMISSIONS_SUPABASE_STRICT_ERP__) return;
  window.__PETATOE_NAVIGATION_PERMISSIONS_SUPABASE_STRICT_ERP__ = true;

  // PETATOE v8.0.2 Phase 1: canonical permission screen aliases.
  // Keep navigation/panel route ids mapped to existing permission keys to avoid orphan screen keys.
  var SCREEN_ALIASES = {
    dashboard:'dashboardManagement', dashboardManagement:'dashboardManagement', dashboardOperations:'dashboardOperations', dashboardOperationsPanel:'dashboardOperations',
    entry:'sales', import:'sales', records:'reports', logs:'audit', smart:'reports', reports:'reports', customer360:'customers', executive:'reports',
    treasury:'treasury', warehouses:'vehicles', warehouse:'vehicles', obligations:'obligations', expenses:'expenses',
    commissions:'commissions', commissionStatement:'commissionStatement', fleet:'vehicles', vehicles:'vehicles',
    payroll:'payroll', salarySlip:'salarySlip', childrenExpenses:'childrenExpenses',
    appointments:'appointments', 'appointments-master':'setup', appointmentsMaster:'setup',
    vehicleOperations:'vehicleOperations', vehicleOperationsReports:'vehicleOperationsReports', operationKpis:'operationKpis',
    settings:'settings', system:'settings', setup:'setup', permissions:'permissions', users:'users', audit:'audit'
  };

  function normalizeScreen(screen){ return SCREEN_ALIASES[screen] || screen || ''; }
  function notify(msg){ try{ if(typeof window.toast==='function') window.toast(msg); else console.warn(msg); }catch(e){} }
  function normalizeRole(role){ return String(role||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'); }
  function isSuperUser(u){
    u=u||currentUser();
    var roleRaw=String((u&&(u.role||u.role_code||u.userRole||u.type||u.permissionRole))||'').trim().toLowerCase();
    var role=normalizeRole(roleRaw);
    var name=String((u&&(u.username||u.name||u.fullName||u.full_name||u.login))||'').trim().toLowerCase();
    var id=String((u&&(u.id||u.userId||u.uid))||'').trim().toLowerCase();
    return role==='superadmin'||role==='super_admin'||role==='administrator'||roleRaw.indexOf('super')>-1||roleRaw.indexOf('سوبر')>-1||name==='admin'||name==='superadmin'||id==='u_admin'||id==='admin';
  }
  function currentUser(){
    try{ if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function'){var au=window.PETATOEAuth.currentUser(); if(au&&typeof au==='object') return au;} }catch(e){}
    try{ if(window.__PETATOE_ACTIVE_USER__&&typeof window.__PETATOE_ACTIVE_USER__==='object') return window.__PETATOE_ACTIVE_USER__; }catch(e){}
    try{ if(window.currentUser&&typeof window.currentUser==='object') return window.currentUser; }catch(e){}
    return {id:'',username:'',role:'guest',status:'inactive'};
  }
  function isActive(u){ var s=String((u&&u.status)||'active').trim().toLowerCase(); return s==='active'||s==='نشط'; }
  function settingsScreen(screen){ screen=normalizeScreen(screen); return screen==='settings'||screen==='setup'||screen==='permissions'||screen==='users'||screen==='audit'; }
  function canPermission(u, screen, action){
    screen=normalizeScreen(screen); action=action||'view';
    if(!screen) return false;
    if(isSuperUser(u)) return true;
    try{ if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.can==='function') return !!window.PETATOEPermissions.can(u.id||u.username, screen, action); }catch(e){}
    return false;
  }
  function hasAnyAction(u, screen){
    screen=normalizeScreen(screen);
    if(!screen) return false;
    if(isSuperUser(u)) return true;
    return ['view','add','edit','delete','export','approve','print'].some(function(a){ return canPermission(u, screen, a); });
  }
  function canOpen(screen){
    screen=normalizeScreen(screen);
    var u=currentUser();
    if(isSuperUser(u)) return true;
    if(!u||!isActive(u)||!(u.id||u.username)) return false;
    return hasAnyAction(u, screen);
  }
  function screenFromButton(btn){
    if(!btn) return '';
    var sm=btn.getAttribute('data-settings-main');
    if(sm) return normalizeScreen(sm);
    return normalizeScreen(btn.getAttribute('data-pet-nav-screen')||btn.getAttribute('data-pet-permission-screen')||btn.getAttribute('data-tab')||'');
  }
  function hideElement(el){ if(!el) return; el.style.display='none'; el.classList.add('pet-nav-hidden-by-permission'); el.setAttribute('aria-hidden','true'); }
  function showElement(el){ if(!el) return; el.style.display=''; el.classList.remove('pet-nav-hidden-by-permission'); el.removeAttribute('aria-hidden'); }
  function apply(root){
    root=root||document.getElementById('nav'); if(!root) return;
    var u=currentUser();
    Array.prototype.forEach.call(root.querySelectorAll('button[data-tab],button[data-settings-main],button[data-pet-nav-screen],button[data-pet-permission-screen]'),function(btn){
      var screen=screenFromButton(btn);
      var allowed=screen?hasAnyAction(u, screen):true;
      if(allowed) showElement(btn); else hideElement(btn);
    });
    Array.prototype.forEach.call(root.querySelectorAll('.pet-v142-group'),function(g){
      var visible=Array.prototype.some.call(g.querySelectorAll('.pet-v142-items button'),function(b){return b.style.display!=='none';});
      if(visible) showElement(g); else hideElement(g);
    });
  }
  function guardClick(btn){
    var screen=screenFromButton(btn);
    if(!screen) return true;
    if(canOpen(screen)) return true;
    notify('غير متاح للصلاحية الحالية');
    return false;
  }
  window.PETATOENavigationPermissions={currentUser:currentUser,isSuperUser:isSuperUser,normalizeScreen:normalizeScreen,canOpen:canOpen,hasAnyAction:hasAnyAction,apply:apply,guardClick:guardClick,__v:'erp-strict-supabase'};
  document.addEventListener('petatoe:navbuilt',function(e){ apply(e.detail&&e.detail.nav); });
  document.addEventListener('petatoe:permissionschanged',function(){ apply(); });
  document.addEventListener('petatoe:userchanged',function(){ apply(); });
  window.addEventListener('petatoe:identity-ready',function(){ apply(); });
})();
