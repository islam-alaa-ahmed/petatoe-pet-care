/* PETATOE v8.0.2 — SuperAdmin Settings Direct Access Supabase Stage 3
   Uses active Supabase-backed session only. No legacy storage fallback. */
(function(){
  'use strict';
  if(window.__PETATOE_SUPERADMIN_SETTINGS_DIRECT_ACCESS_STAGE3__) return;
  window.__PETATOE_SUPERADMIN_SETTINGS_DIRECT_ACCESS_STAGE3__ = true;

  function normalizeRole(role){ return String(role||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'); }
  function currentUser(){
    try{ if(window.PETATOEAuth && typeof window.PETATOEAuth.currentUser==='function'){ var a=window.PETATOEAuth.currentUser(); if(a&&typeof a==='object') return a; } }catch(_e){}
    try{ if(window.PETATOENavigationPermissions && typeof window.PETATOENavigationPermissions.currentUser==='function'){ var n=window.PETATOENavigationPermissions.currentUser(); if(n&&typeof n==='object') return n; } }catch(_e){}
    try{ if(window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.currentUser==='function'){ var s=window.__PETATOE_SETTINGS_API__.currentUser(); if(s&&typeof s==='object') return s; } }catch(_e){}
    return null;
  }
  function isSuper(u){
    if(!u) return false;
    var roleRaw=String((u.role||u.role_code||u.userRole||u.type||u.permissionRole||'')).trim().toLowerCase();
    var role=normalizeRole(roleRaw);
    var id=String(u.id||u.userId||u.uid||'').trim().toLowerCase();
    var name=String(u.username||u.name||u.fullName||u.full_name||u.login||'').trim().toLowerCase();
    var jobRaw=String(u.job||u.title||u.position||'').trim().toLowerCase();
    var job=normalizeRole(jobRaw);
    return role==='superadmin'||role==='super_admin'||role==='administrator'||roleRaw.indexOf('super')>-1||roleRaw.indexOf('سوبر')>-1||
      id==='u_admin'||id==='admin'||name==='admin'||name==='superadmin'||name==='super_admin'||name==='super admin'||job.indexOf('super')>-1||jobRaw.indexOf('سوبر')>-1;
  }
  function isCurrentSuperAdmin(){ return isSuper(currentUser()); }
  function openSettings(main,sub){
    try{ if(window.PETATOERouter && typeof window.PETATOERouter.openTab==='function') window.PETATOERouter.openTab('settings'); }catch(_e){}
    try{ document.dispatchEvent(new CustomEvent('petatoe:settingsnavigate',{detail:{main:main,sub:sub||'',source:'superadmin-direct-access'}})); }catch(_e){}
    try{ if(window.__PETATOE_SETTINGS_API__ && window.__PETATOE_SETTINGS_API__.render) window.__PETATOE_SETTINGS_API__.render(main,sub||''); }catch(_e){}
  }
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest?e.target.closest('button[data-settings-main],button[data-pet-v110-main]'):null;
    if(!btn) return;
    var main=btn.getAttribute('data-settings-main')||btn.getAttribute('data-pet-v110-main')||'';
    if(main!=='permissions'&&main!=='users') return;
    if(!isCurrentSuperAdmin()) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    btn.classList.remove('pet-nav-disabled','locked'); btn.removeAttribute('aria-disabled'); btn.removeAttribute('title');
    openSettings(main,btn.getAttribute('data-settings-sub')||'');
    return false;
  },true);
  window.PETATOESuperAdminSettingsDirectAccess={isCurrentSuperAdmin:isCurrentSuperAdmin,openSettings:openSettings,__v:'8.0.2-stage3-supabase'};
})();
