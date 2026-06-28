(function(){
  'use strict';
  if(window.__PETATOE_SUPERADMIN_SETTINGS_DIRECT_ACCESS_6482__) return;
  window.__PETATOE_SUPERADMIN_SETTINGS_DIRECT_ACCESS_6482__ = true;

  var CURRENT_KEYS = ['petatoe_current_user_v108','petatoe_current_user_v139','petatoe_current_user_v2','petatoe_current_user','currentUser','PETATOE_CURRENT_USER'];
  var USERS_KEYS = ['petatoe_users_v108','petatoe_users_v139','petatoe_users_v2','petatoe_users','users','PETATOE_USERS'];
  function raw(scope,key){try{var st=scope==='session'?window.sessionStorage:window.localStorage;return st?st.getItem(key):null;}catch(_){return null;}}
  function parse(v){if(!v)return null;if(typeof v==='object')return v;var s=String(v||'').trim();if(!s)return null;try{if((s[0]==='{'&&s[s.length-1]==='}')||(s[0]==='['&&s[s.length-1]===']'))return JSON.parse(s);}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }return {id:s,username:s};}
  function roleText(u){return String((u&&(u.role||u.userRole||u.type||u.permissionRole||u.job||u.title||u.position))||'').trim().toLowerCase();}
  function norm(s){return String(s||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_');}
  function isSuper(u){
    if(!u)return false;
    var r=roleText(u), rn=norm(r), id=String(u.id||u.userId||u.uid||'').trim().toLowerCase(), name=String(u.username||u.name||u.fullName||u.login||'').trim().toLowerCase(), job=String(u.job||u.title||u.position||'').trim().toLowerCase();
    return rn==='superadmin'||rn==='super_admin'||rn==='administrator'||r.indexOf('super')>-1||r.indexOf('سوبر')>-1||job.indexOf('super')>-1||job.indexOf('سوبر')>-1||id==='u_admin'||id==='admin'||name==='admin'||name==='superadmin'||name==='super_admin'||name==='super admin';
  }
  function readUsers(){
    var out=[],seen={};
    USERS_KEYS.forEach(function(k){['session','local'].forEach(function(scope){var v=parse(raw(scope,k)); if(Array.isArray(v)){v.forEach(function(u){if(u&&typeof u==='object'){var key=String(u.id||u.username||u.name||JSON.stringify(u));if(!seen[key]){seen[key]=true;out.push(u);}}});}});});
    try{var api=window.__PETATOE_SETTINGS_API__; if(api&&typeof api.users==='function'){(api.users()||[]).forEach(function(u){var key=String(u.id||u.username||u.name||JSON.stringify(u));if(!seen[key]){seen[key]=true;out.push(u);}});}}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return out;
  }
  function match(users,ref){
    if(!ref)return null;
    var rid=String(ref.id||ref.userId||ref.uid||'').trim().toLowerCase(), rn=String(ref.username||ref.name||ref.fullName||ref.login||'').trim().toLowerCase();
    return (users||[]).find(function(u){var uid=String(u.id||u.userId||u.uid||'').trim().toLowerCase(), un=String(u.username||u.name||u.login||'').trim().toLowerCase(), fn=String(u.fullName||'').trim().toLowerCase(); return (rid&&(uid===rid||un===rid||fn===rid))||(rn&&(uid===rn||un===rn||fn===rn));})||null;
  }
  function currentRefs(){var refs=[];CURRENT_KEYS.forEach(function(k){['session','local'].forEach(function(scope){var v=parse(raw(scope,k));if(v)refs.push(v);});});try{if(window.currentUser)refs.push(parse(window.currentUser));}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }return refs;}
  function isCurrentSuperAdmin(){
    try{var api=window.__PETATOE_SETTINGS_API__; if(api&&typeof api.currentUser==='function'&&isSuper(api.currentUser()))return true;}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{if(window.PETATOENavigationPermissions&&typeof window.PETATOENavigationPermissions.currentUser==='function'&&isSuper(window.PETATOENavigationPermissions.currentUser()))return true;}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    var users=readUsers(), refs=currentRefs();
    for(var i=0;i<refs.length;i++){if(isSuper(refs[i]))return true;var m=match(users,refs[i]);if(isSuper(m))return true;}
    return false;
  }
  function openSettings(main,sub){
    try{var S=window.PETATOEStorage;if(S&&S.set){S.set('pet_settings_v110_main',main); if(sub)S.set('pet_settings_v110_sub',sub);}}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{if(window.PETATOERouter&&typeof window.PETATOERouter.openTab==='function')window.PETATOERouter.openTab('settings');}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{document.dispatchEvent(new CustomEvent('petatoe:settingsnavigate',{detail:{main:main,sub:sub||'',source:'superadmin-direct-access'}}));}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{if(window.__PETATOE_SETTINGS_API__&&window.__PETATOE_SETTINGS_API__.render)window.__PETATOE_SETTINGS_API__.render(main,sub||'');}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/superadmin-settings-direct-access.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest?e.target.closest('button[data-settings-main],button[data-pet-v110-main]'):null;
    if(!btn)return;
    var main=btn.getAttribute('data-settings-main')||btn.getAttribute('data-pet-v110-main')||'';
    if(main!=='permissions'&&main!=='users')return;
    if(!isCurrentSuperAdmin())return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    btn.classList.remove('pet-nav-disabled','locked'); btn.removeAttribute('aria-disabled'); btn.removeAttribute('title');
    openSettings(main,btn.getAttribute('data-settings-sub')||'');
    return false;
  },true);
  window.PETATOESuperAdminSettingsDirectAccess={isCurrentSuperAdmin:isCurrentSuperAdmin,openSettings:openSettings,__v:'6.4.82'};
})();
