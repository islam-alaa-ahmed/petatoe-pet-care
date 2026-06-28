(function(){
  'use strict';
  if(window.__PETATOE_NAVIGATION_PERMISSIONS_PHASE4_HOTFIX_6483__) return;
  window.__PETATOE_NAVIGATION_PERMISSIONS_PHASE4_HOTFIX_6483__ = true;

  var SCREEN_ALIASES = {
    dashboard:'dashboard', entry:'entry', import:'entry', records:'reports', logs:'audit',
    smart:'reports', customer360:'reports', executive:'reports',
    treasury:'treasury', warehouses:'warehouses', obligations:'obligations',
    commissions:'commissions', commissionStatement:'commissionStatement', fleet:'vehicles',
    payroll:'payroll', salarySlip:'salarySlip', childrenExpenses:'childrenExpenses',
    appointments:'appointments', vehicleOperations:'vehicleOperations', vehicleOperationsReports:'vehicleOperations', operationKpis:'vehicleOperations',
    settings:'settings', setup:'setup', permissions:'permissions', users:'users', audit:'audit'
  };
  var USERS_KEYS = ['users','petatoe_users_v139','petatoe_users_v108','petatoe_users_v2','petatoe_users','PETATOE_USERS'];
  var CURRENT_KEYS = ['currentUser','petatoe_current_user','petatoe_current_user_v108','petatoe_current_user_v139','petatoe_current_user_v2','PETATOE_CURRENT_USER'];

  function S(){ return window.PETATOEStorage || null; }
  function rawGet(key){
    /* v6.4.81: active login can live in sessionStorage while localStorage keeps a stale user. Prefer session first. */
    try{ if(window.sessionStorage){ var sv=window.sessionStorage.getItem(key); if(sv!==null&&sv!==undefined) return sv; } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{ var st=S(); if(st&&st.get){ var tv=st.get(key, undefined); if(tv!==undefined&&tv!==null) return tv; } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.5.8-security-gate'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{ if(window['localStorage']){ var v=window['localStorage'].getItem(key); if(v!==null&&v!==undefined) return v; } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.5.8-security-gate'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return null;
  }
  function rawGetAll(key){
    var out=[];
    try{ if(window.sessionStorage){ var sv=window.sessionStorage.getItem(key); if(sv!==null&&sv!==undefined&&sv!=='') out.push(sv); } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{ var st=S(); if(st&&st.get){ var tv=st.get(key, undefined); if(tv!==undefined&&tv!==null&&tv!==''&&out.indexOf(tv)===-1) out.push(tv); } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.5.8-security-gate'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{ if(window['localStorage']){ var v=window['localStorage'].getItem(key); if(v!==null&&v!==undefined&&v!==''&&out.indexOf(v)===-1) out.push(v); } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.5.8-security-gate'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return out;
  }
  function readJSON(key, fallback){
    try{ var st=S(); if(st && st.readJSON){ var v=st.readJSON(key, undefined); if(v!==undefined && v!==null) return v; } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    var raw=rawGet(key);
    if(raw===null || raw===undefined || raw==='') return fallback;
    try{ return JSON.parse(raw); }catch(_){ return fallback; }
  }
  function getText(key, fallback){
    try{ var st=S(); if(st && st.get){ var v=st.get(key, undefined); if(v!==undefined && v!==null && v!=='') return v; } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    var raw=rawGet(key);
    return (raw!==null && raw!==undefined && raw!=='') ? raw : fallback;
  }
  function notify(msg){ try{ if(typeof window.toast==='function') window.toast(msg); else console.warn(msg); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('navigation/navigation-permissions.js',e);} }

  function normalizeScreen(screen){ return SCREEN_ALIASES[screen] || screen || 'dashboard'; }
  function guestUser(){ return { id:'', username:'', role:'guest', status:'inactive' }; }
  function normalizeRole(role){ return String(role||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'); }
  function isSuperUser(u){
    u = u || currentUser();
    var roleRaw = String((u&& (u.role || u.userRole || u.type || u.permissionRole)) || '').trim().toLowerCase();
    var role = normalizeRole(roleRaw);
    var name = String((u&&(u.username||u.name||u.fullName||u.login))||'').trim().toLowerCase();
    var id = String((u&&(u.id||u.userId||u.uid))||'').trim().toLowerCase();
    var jobRaw = String((u&&(u.job||u.title||u.position))||'').trim().toLowerCase();
    var job = normalizeRole(jobRaw);
    return role==='superadmin' || role==='super_admin' || role==='super_admin_user' || role==='super' || role==='administrator' || role==='admin_super' ||
      roleRaw==='super admin' || roleRaw==='superadmin' || roleRaw.indexOf('super')>-1 || roleRaw.indexOf('سوبر')>-1 ||
      id==='u_admin' || id==='admin' || name==='admin' || name==='superadmin' || name==='super_admin' || name==='super admin' ||
      job==='super_admin' || job==='superadmin' || jobRaw.indexOf('super')>-1 || jobRaw.indexOf('سوبر')>-1;
  }
  function settingsApiUser(){
    try{
      var api = window.__PETATOE_SETTINGS_API__;
      if(api && typeof api.currentUser === 'function'){
        var u = api.currentUser();
        if(u && typeof u === 'object') return u;
      }
    }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{
      if(window.PETATOESettings && typeof window.PETATOESettings.currentUser === 'function'){
        var s = window.PETATOESettings.currentUser();
        if(s && typeof s === 'object') return s;
      }
    }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return null;
  }
  function isSettingsScreen(screen){
    screen = normalizeScreen(screen);
    return screen==='settings' || screen==='setup' || screen==='permissions' || screen==='users' || screen==='audit';
  }
  function settingsSuperAdminAllowed(screen){
    if(!isSettingsScreen(screen)) return false;
    var apiUser = settingsApiUser();
    if(apiUser && isSuperUser(apiUser)) return true;
    return false;
  }

  function mergeUsers(){
    var out=[], seen={};
    USERS_KEYS.forEach(function(k){
      var v = readJSON(k, []);
      if(Array.isArray(v)){
        v.forEach(function(u){
          if(!u || typeof u!=='object') return;
          var key=String(u.id||u.username||u.name||JSON.stringify(u));
          if(!seen[key]){ seen[key]=true; out.push(u); }
        });
      }
    });
    return out;
  }
  function allUsers(){ return mergeUsers(); }
  function parseUserValue(raw){
    if(!raw) return null;
    if(typeof raw === 'object') return raw;
    var s = String(raw||'').trim();
    if(!s) return null;
    if((s.charAt(0)==='{' && s.charAt(s.length-1)==='}') || (s.charAt(0)==='[' && s.charAt(s.length-1)===']')){
      try{ var parsed = JSON.parse(s); if(parsed && typeof parsed==='object') return parsed; }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    }
    return { id:s, username:s };
  }
  function matchUser(users, ref){
    if(!ref) return null;
    var rid = String(ref.id||ref.userId||ref.uid||'').trim();
    var rname = String(ref.username||ref.name||ref.fullName||ref.login||'').trim().toLowerCase();
    if(!rid && !rname && typeof ref === 'string') rid = String(ref).trim();
    return (users||[]).find(function(u){
      var uid=String(u.id||u.userId||u.uid||'').trim();
      var uname=String(u.username||u.name||u.fullName||u.login||'').trim().toLowerCase();
      var fname=String(u.fullName||'').trim().toLowerCase();
      return (rid && uid===rid) || (rid && uname===rid.toLowerCase()) || (rid && fname===rid.toLowerCase()) || (rname && uname===rname) || (rname && uid.toLowerCase()===rname) || (rname && fname===rname);
    }) || null;
  }
  function currentRefs(){
    var refs=[], seen={};
    function add(ref){
      if(!ref) return;
      var key=''; try{ key=JSON.stringify(ref); }catch(_){ key=String(ref); }
      if(!seen[key]){ seen[key]=true; refs.push(ref); }
    }
    CURRENT_KEYS.forEach(function(k){
      rawGetAll(k).forEach(function(raw){ add(parseUserValue(raw)); });
      add(parseUserValue(getText(k, '')));
    });
    try{ if(window.currentUser){ add(parseUserValue(window.currentUser)); } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{ if(window.__PETATOE_ACTIVE_USER__){ add(parseUserValue(window.__PETATOE_ACTIVE_USER__)); } }catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('navigation/navigation-permissions.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return refs;
  }
  function currentUser(){
    var apiUser = settingsApiUser();
    if(apiUser && isSuperUser(apiUser)) return Object.assign(guestUser(), apiUser, {role: apiUser.role || 'superadmin', status: apiUser.status || 'active'});
    var users = allUsers();
    var refs = currentRefs();

    /* v6.4.83 ROOT FIX:
       PETATOE is still running without a real Login/Logout flow in many installs.
       In that boot mode there is no reliable current-user key yet, so the navigation
       gate must not classify the operator as Guest and block Settings > Permissions.
       If no session refs exist, use the bootstrapped SuperAdmin user as the active user. */
    if(!refs.length){
      var bootSuper = (users||[]).find(function(x){ return isSuperUser(x); });
      if(bootSuper) return Object.assign(guestUser(), bootSuper, {status: bootSuper.status || 'active'});
      return {id:'u_admin', username:'Admin', fullName:'Admin', role:'superadmin', status:'active', __bootstrap:true};
    }

    /* Important: do not trust the first legacy currentUser key only.
       Older keys can contain a stale non-admin session, while v108/v139 contains the real SuperAdmin.
       Resolve all session aliases and prefer any matched SuperAdmin. */
    for(var i=0;i<refs.length;i++){
      var direct = Object.assign({}, refs[i]);
      if(isSuperUser(direct)) return Object.assign(guestUser(), direct, {role: direct.role || 'superadmin', status: direct.status || 'active'});
      var matchedSuper = matchUser(users, refs[i]);
      if(matchedSuper && isSuperUser(matchedSuper)) return matchedSuper;
    }
    for(var j=0;j<refs.length;j++){
      var found = matchUser(users, refs[j]);
      if(found) return found;
    }
    var ref = refs[0];
    if(ref && (ref.role || ref.id || ref.username || ref.name)) return Object.assign(guestUser(), ref, {status: ref.status || 'active'});
    return guestUser();
  }
  function readUserCrud(){ var v=readJSON('petatoe_user_crud_permissions_v139',{}); return v && typeof v==='object' && !Array.isArray(v) ? v : {}; }
  function canFromStoredMatrix(u, screen){
    var matrix = readUserCrud();
    var byUser = matrix[u.id] || matrix[u.username] || null;
    if(!byUser) return null;
    if(byUser.screens && byUser.screens[screen] && Object.prototype.hasOwnProperty.call(byUser.screens[screen],'view')) return !!byUser.screens[screen].view;
    if(byUser[screen] && Object.prototype.hasOwnProperty.call(byUser[screen],'view')) return !!byUser[screen].view;
    if(screen==='permissions' && byUser.special && Object.prototype.hasOwnProperty.call(byUser.special,'manage_permissions')) return !!byUser.special.manage_permissions;
    if(screen==='users' && byUser.special && Object.prototype.hasOwnProperty.call(byUser.special,'manage_users')) return !!byUser.special.manage_users;
    return null;
  }
  function canOpen(screen){
    screen = normalizeScreen(screen);
    var u = currentUser();
    if(isSuperUser(u)) return true;
    if(settingsSuperAdminAllowed(screen)) return true;
    if(screen==='dashboard') return true;
    if(!u || !u.id || String(u.status||'').toLowerCase()==='inactive' || String(u.role||'').toLowerCase()==='guest') return false;
    try{
      if(window.PETATOEPermissions && typeof window.PETATOEPermissions.can==='function'){
        var r = window.PETATOEPermissions.can(u.id, screen, 'view');
        if(typeof r === 'boolean') return r;
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('navigation/navigation-permissions.js',e);}
    var stored = canFromStoredMatrix(u, screen);
    if(typeof stored === 'boolean') return stored;
    return false;
  }
  function screenFromButton(btn){
    if(!btn) return '';
    var sm = btn.getAttribute('data-settings-main');
    if(sm) return normalizeScreen(sm);
    return normalizeScreen(btn.getAttribute('data-pet-nav-screen') || btn.getAttribute('data-tab') || '');
  }
  function apply(root){
    root = root || document.getElementById('nav');
    if(!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('button[data-tab],button[data-settings-main]'),function(btn){
      var screen = screenFromButton(btn);
      var allowed = canOpen(screen);
      btn.classList.toggle('pet-nav-disabled', !allowed);
      btn.toggleAttribute('aria-disabled', !allowed);
      if(!allowed) btn.setAttribute('title','غير متاح للصلاحية الحالية'); else btn.removeAttribute('title');
    });
  }
  function guardClick(btn){
    var screen = screenFromButton(btn);
    if(!screen || screen==='dashboard') return true;
    var u = currentUser();
    if(isSuperUser(u)) return true;
    /* Bootstrap/no-login mode: Settings > Permissions and Settings > Users must remain available to the owner. */
    if(isSettingsScreen(screen) && (!currentRefs().length || (u && u.__bootstrap))) return true;
    if(canOpen(screen)) return true;
    if(settingsSuperAdminAllowed(screen)) return true;
    notify('غير متاح للصلاحية الحالية');
    return false;
  }

  window.PETATOENavigationPermissions = {
    currentUser: currentUser,
    isSuperUser: isSuperUser,
    normalizeScreen: normalizeScreen,
    canOpen: canOpen,
    apply: apply,
    guardClick: guardClick,
    __v:'6.4.83'
  };

  document.addEventListener('petatoe:navbuilt',function(e){ apply(e.detail && e.detail.nav); });
  document.addEventListener('petatoe:permissionschanged',function(){ apply(); });
  document.addEventListener('petatoe:userchanged',function(){ apply(); });
})();
