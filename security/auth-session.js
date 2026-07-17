/* PETATOE v9.0 - Auth Session Module
   Purpose: enforce an explicit user session before opening PETATOE, while preserving the existing Enterprise/LTS users and permissions architecture. */
(function(window, document){
  'use strict';

  if(window.PETATOEAuth && window.PETATOEAuth.__ready){ return; }

  var VERSION = '9.0';
  var AUTH_KEY = 'petatoe_auth_session_v668';
  // Bootstrap credential only — first login must force password change via mustChangePassword.
  var DEFAULT_ADMIN_PASSWORD = 'admin';
  var DEFAULT_ADMIN_USERNAME = 'Admin';
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\'\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function toast(msg){ try{ if(typeof window.toast === 'function') window.toast(msg); else console.log('[PETATOE]', msg); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);} }
  function now(){ return new Date().toISOString(); }
  function releaseVersion(){
    var v = String(window.PETATOE_RELEASE_VERSION || window.APP_VERSION || VERSION || '').trim();
    if(!v) v = 'v' + VERSION;
    if(/^\d/.test(v)) v = 'v' + v;
    return v;
  }
  function authFooterHtml(){
    return '<div class="pet-auth-footer" aria-label="معلومات الإصدار والتواصل">' +
      '<span class="pet-auth-version">PETATOE ' + esc(releaseVersion()) + '</span>' +
      '<span class="pet-auth-sep">│</span>' +
      '<span>جميع الحقوق محفوظة ©</span>' +
      '<span class="pet-auth-sep">│</span>' +
      '<span>تصميم وتطوير: إسلام علاء</span>' +
      '<span class="pet-auth-sep">│</span>' +
      '<a class="pet-auth-whatsapp" href="https://wa.me/966508638573" target="_blank" rel="noopener noreferrer" title="تواصل واتساب" aria-label="واتساب 0508638573">' +
      '<svg class="pet-auth-wa-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16.03 3.2c-7.03 0-12.75 5.6-12.75 12.49 0 2.2.6 4.35 1.74 6.23L3.2 28.8l7.1-1.79a12.93 12.93 0 0 0 5.73 1.35c7.03 0 12.75-5.6 12.75-12.49S23.06 3.2 16.03 3.2Zm0 22.96c-1.8 0-3.56-.46-5.1-1.34l-.37-.2-4.22 1.06 1.1-4.01-.24-.41a10.15 10.15 0 0 1-1.56-5.39c0-5.67 4.66-10.29 10.39-10.29s10.39 4.62 10.39 10.29-4.66 10.29-10.39 10.29Zm5.7-7.7c-.31-.15-1.84-.89-2.13-.99-.29-.1-.5-.15-.7.15-.21.3-.81.99-.99 1.2-.18.2-.36.23-.67.08-.31-.15-1.31-.47-2.5-1.51-.92-.8-1.55-1.8-1.73-2.1-.18-.3-.02-.46.14-.61.14-.14.31-.36.47-.53.16-.18.21-.3.31-.5.1-.2.05-.38-.03-.53-.08-.15-.7-1.65-.96-2.26-.25-.59-.51-.51-.7-.52h-.6c-.21 0-.55.08-.83.38-.29.3-1.09 1.05-1.09 2.55s1.12 2.96 1.28 3.16c.16.2 2.2 3.3 5.33 4.62.75.32 1.33.51 1.78.65.75.23 1.43.2 1.97.12.6-.09 1.84-.74 2.1-1.45.26-.71.26-1.32.18-1.45-.08-.13-.29-.2-.6-.35Z"/></svg>' +
      '<span dir="ltr">0508638573</span></a>' +
      '</div>';
  }
  function identityStore(){ return window.PETATOEIdentityStore || null; }
  function rawSet(key, value){ try{ sessionStorage.setItem(key, String(value == null ? '' : value)); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);} }
  function rawGet(key){ try{ return sessionStorage.getItem(key) || ''; }catch(_){ return ''; } }
  function rawRemove(key){ try{ sessionStorage.removeItem(key); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);} }

  function normalizeUsername(v){ return String(v || '').trim().toLowerCase(); }
  function isActive(u){ var s = String((u && u.status) || 'active').trim().toLowerCase(); return s === 'active' || s === 'نشط'; }
  function userKey(u){ return String((u && (u.id || u.username || u.name || u.fullName)) || '').trim(); }
  function defaultAdminUser(){
    return {id:'u_admin',username:DEFAULT_ADMIN_USERNAME,fullName:'Admin',job:'Super Admin',phone:'',email:'',role:'superadmin',status:'active',createdAt:now(),lastLogin:'',mustChangePassword:true,bootstrapCredential:true,passwordPolicy:'change_on_first_login'};
  }
  function getUsers(){
    var ids = identityStore();
    try{ if(ids && typeof ids.load === 'function') ids.load(); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
    var merged = [];
    try{ if(ids && typeof ids.usersSync === 'function') merged = ids.usersSync() || []; }catch(_){ merged = []; }
    if(!Array.isArray(merged) || !merged.length) merged = [defaultAdminUser()];
    /* Supabase Identity Lock: credentials/default-user normalization must not auto-write app_users during page load. */
    merged.forEach(function(u){ ensureFallbackAdminCredential(u); });
    return merged;
  }
  function saveUsers(users){
    var ids = identityStore();
    try{ if(ids && typeof ids.saveUsers === 'function'){ ids.saveUsers(users || []); return; } }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
  }
  function ensureCredential(u, password){
    var sec = window.PETATOEPasswordSecurity;
    if(u && sec && typeof sec.setPassword === 'function' && !(sec.hasCredential && sec.hasCredential(u))){ sec.setPassword(u, password); return true; }
    if(u && !u.passwordHash && !u.password){ u.password = password; return true; }
    return false;
  }
  function markBootstrapCredential(u){
    if(!u || !isBootstrapAdmin(u)) return false;
    var changed = false;
    if(!u.mustChangePassword){ u.mustChangePassword = true; changed = true; }
    if(!u.bootstrapCredential){ u.bootstrapCredential = true; changed = true; }
    if(!u.passwordPolicy){ u.passwordPolicy = 'change_on_first_login'; changed = true; }
    return changed;
  }
  function strongEnoughPassword(password){
    var p = String(password || '');
    return p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p) && p.toLowerCase() !== DEFAULT_ADMIN_PASSWORD;
  }
  function isBootstrapAdmin(u){
    var id = String((u && u.id) || '').toLowerCase();
    var name = normalizeUsername((u && (u.username || u.name || u.fullName)) || '');
    var role = normalizeUsername((u && u.role) || '');
    return id === 'u_admin' || name === 'admin' || role.indexOf('super') >= 0;
  }
  function ensureFallbackAdminCredential(u){
    if(!u || !isBootstrapAdmin(u)) return false;
    var sec = window.PETATOEPasswordSecurity;
    if(sec && sec.hasCredential && sec.hasCredential(u)) return false;
    var changed = markBootstrapCredential(u);
    if(ensureCredential(u, DEFAULT_ADMIN_PASSWORD)) changed = true;
    return changed;
  }
  function findUser(username){
    var needle = normalizeUsername(username);
    return getUsers().find(function(u){
      return normalizeUsername(u.username || u.name || u.login) === needle || normalizeUsername(u.email) === needle || normalizeUsername(u.id) === needle;
    }) || null;
  }
  function verifyPassword(user, password){
    if(!user) return false;
    var sec = window.PETATOEPasswordSecurity;
    try{
      if(sec && typeof sec.verifyPassword === 'function' && sec.verifyPassword(password, user)) return true;
      if(user.password && String(user.password) === String(password)){
        if(sec && typeof sec.setPassword === 'function'){
          sec.setPassword(user, password);
          /* No automatic app_users write during login verification. Explicit user edits are saved from Settings > Users. */
        }
        return true;
      }
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
    return false;
  }
  function sessionUser(){
    try{ var raw = rawGet(AUTH_KEY); if(!raw) return null; var s = JSON.parse(raw); return s && s.user ? s.user : null; }catch(_){ return null; }
  }

  function sameUserRef(a,b){
    a=a||{}; b=b||{};
    var aa=[a.supabase_id,a.id,a.username,a.fullName].map(function(x){return String(x||'').trim().toLowerCase();}).filter(Boolean);
    var bb=[b.supabase_id,b.id,b.username,b.fullName].map(function(x){return String(x||'').trim().toLowerCase();}).filter(Boolean);
    return aa.some(function(x){return bb.indexOf(x)>-1;});
  }
  async function loadFreshUsers(){
    var ids=identityStore();
    try{ if(ids && ids._cache) ids._cache.loading=null; }catch(_e){}
    try{ if(ids && typeof ids.load==='function') await ids.load(); }catch(_e){}
    try{ if(ids && typeof ids.usersSync==='function') return ids.usersSync()||[]; }catch(_e){}
    return getUsers();
  }
  async function validateRemoteEnterpriseSession(user, reason){
    try{
      var payload = remoteSessionPayload(user || sessionUser() || window.currentUser || {}, false);
      if(!payload.username || !payload.email || !payload.sessionClientToken) return {ok:true,skipped:true};
      await callSecurityEmail(Object.assign({action:'session_touch', source:reason || 'session-validate'}, payload));
      return {ok:true};
    }catch(err){
      var msg = String(err && err.message || err);
      if(msg === 'SESSION_TOUCH_FAILED' || msg === 'SESSION_TOKEN_REQUIRED' || msg === 'HTTP_401'){
        rawRemove(AUTH_KEY);
        clearCurrentUser();
        setLoggedInClass(false);
        try{document.dispatchEvent(new CustomEvent('petatoe:userchanged',{detail:{user:null,source:reason||'session-revoked'}}));}catch(_e){}
        renderLogin('تم إنهاء الجلسة أمنيًا. برجاء تسجيل الدخول مرة أخرى.');
        return {ok:false,reason:'remote-revoked'};
      }
      return {ok:true,warning:msg};
    }
  }

  async function validateSessionUser(reason){
    var su=sessionUser();
    if(!su||!su.id)return {ok:false,reason:'no-session'};
    var remote = await validateRemoteEnterpriseSession(su, reason || 'session-validate');
    if(remote && remote.ok === false) return remote;
    var list=await loadFreshUsers();
    var fresh=(list||[]).find(function(u){return sameUserRef(u,su);});
    if(!fresh||!isActive(fresh)){
      rawRemove(AUTH_KEY);
      clearCurrentUser();
      setLoggedInClass(false);
      try{document.dispatchEvent(new CustomEvent('petatoe:userchanged',{detail:{user:null,source:reason||'session-invalid'}}));}catch(_e){}
      renderLogin('تم إنهاء الجلسة لأن المستخدم غير موجود أو غير نشط');
      return {ok:false,reason:'invalid'};
    }
    var merged=Object.assign({},su,fresh,{loginAt:su.loginAt||now()});
    rawSet(AUTH_KEY, JSON.stringify({user:merged, createdAt:now(), version:VERSION, source:reason||'session-validated'}));
    writeCurrentUser(merged);
    updateHeader(merged);
    try{ if(window.PETATOENavigationPermissions && window.PETATOENavigationPermissions.apply) window.PETATOENavigationPermissions.apply(); }catch(_e){}
    return {ok:true,user:merged};
  }

  function clearLegacyUserRefs(){
    ['app_current_user_ref','PETATOE_CURRENT_USER','petatoe_current_user_v108','petatoe_current_user_v139','petatoe_current_user'].forEach(function(k){ rawRemove(k); try{ localStorage.removeItem(k); }catch(_e){} });
  }
  function writeCurrentUser(user){
    if(!user) return;
    try{
      clearLegacyUserRefs();
      window.currentUser = user;
      window.__PETATOE_ACTIVE_USER__ = user;
      rawSet('currentUser', user.id || user.username || '');
      rawSet('app_current_user_ref', JSON.stringify({id:user.id||'',supabase_id:user.supabase_id||user.row_id||'',row_id:user.row_id||user.supabase_id||'',username:user.username||user.login||'',email:user.email||'',role:user.role||user.role_code||'',role_code:user.role_code||user.role||'',status:user.status||'active'}));
      try{ document.dispatchEvent(new CustomEvent('petatoe:userchanged',{detail:{user:user,source:'auth-session'}})); }catch(_e){}
      try{ document.dispatchEvent(new CustomEvent('petatoe:permissionschanged',{detail:{userId:user.id||user.username||''}})); }catch(_e){}
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
  }
  function clearCurrentUser(){
    rawRemove('currentUser');
    clearLegacyUserRefs();
    try{ window.currentUser = null; window.__PETATOE_ACTIVE_USER__ = null; }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
  }
  function setLoggedInClass(on){
    try{ document.documentElement.classList.toggle('pet-authenticated', !!on); document.body.classList.toggle('pet-authenticated', !!on); document.body.classList.toggle('pet-auth-locked', !on); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
  }
  function audit(action, detail, level){
    try{ if(window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.audit === 'function') window.__PETATOE_SETTINGS_API__.audit(action, detail || '', level || 'info'); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
  }
  function ensureStyles(){
    if(document.getElementById('pet-auth-session-style')) return;
    var style = document.createElement('style');
    style.id = 'pet-auth-session-style';
    style.textContent = [
      'body.pet-auth-locked{overflow:hidden!important}',
      '.pet-auth-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:78px 18px 92px;direction:rtl;background-image:url("img/auth-login-bg-v709.jpg");background-size:cover;background-position:center center;background-repeat:no-repeat;backdrop-filter:none;font-family:Cairo,system-ui,sans-serif;color:#fff;overflow:hidden}',
      '.pet-auth-overlay:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 55%,rgba(236,72,153,.14),transparent 24%),linear-gradient(90deg,rgba(2,6,23,.46) 0%,rgba(2,6,23,.28) 26%,rgba(2,6,23,.10) 43%,rgba(2,6,23,0) 62%);pointer-events:none}',
      '.pet-auth-brand{position:fixed;top:24px;left:28px;z-index:2147483100;display:flex;align-items:center;gap:12px;color:#020617!important;font-weight:1000;text-shadow:none!important;direction:ltr;padding:11px 15px;border-radius:23px;border:1px solid rgba(255,255,255,.92);background:rgba(255,255,255,.96);box-shadow:0 18px 46px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.92);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}',
      '.pet-auth-brand img{width:62px;height:62px;object-fit:contain;filter:drop-shadow(0 5px 12px rgba(15,23,42,.18))}',
      '.pet-auth-brand span{display:block;line-height:1.1;font-size:18px;color:#020617!important;opacity:1!important;text-shadow:none!important}.pet-auth-brand small{display:block;font-size:17px;direction:rtl;color:#020617!important;opacity:1!important;text-shadow:none!important}',
      'html[data-theme="light"] .pet-auth-brand{color:#fff!important;background:rgba(2,6,23,.72);border-color:rgba(255,255,255,.24);box-shadow:0 18px 46px rgba(15,23,42,.25),inset 0 1px 0 rgba(255,255,255,.14);text-shadow:0 8px 20px rgba(0,0,0,.35)!important} ',
      'html[data-theme="light"] .pet-auth-brand img{filter:invert(1) brightness(1.85) contrast(1.08) drop-shadow(0 6px 16px rgba(0,0,0,.35))}html[data-theme="light"] .pet-auth-brand span,html[data-theme="light"] .pet-auth-brand small{color:#fff!important;opacity:1!important;text-shadow:0 8px 20px rgba(0,0,0,.35)!important}',
      '.pet-auth-card{position:relative;z-index:2147483050;width:min(430px,100%);border:1px solid rgba(255,255,255,.22);border-radius:28px;background:linear-gradient(145deg,rgba(15,23,42,.74),rgba(30,41,59,.58));box-shadow:0 28px 95px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.18);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);padding:24px;text-align:right;transform:translate(-430px,44px);overflow:hidden}',
      '.pet-auth-card:before{content:"";position:absolute;z-index:0;top:0;left:0;right:0;height:132px;background:linear-gradient(90deg,rgba(15,23,42,.12),rgba(15,23,42,.72) 72%,rgba(15,23,42,.92)),linear-gradient(180deg,rgba(15,23,42,0) 0%,rgba(15,23,42,.28) 62%,rgba(15,23,42,.86) 100%),url("img/auth-card-cat-v710.jpg");background-size:cover;background-position:left center;opacity:.86;pointer-events:none}',
      '.pet-auth-card:after{content:"";position:absolute;z-index:0;inset:0;background:radial-gradient(circle at 24% 18%,rgba(236,72,153,.18),transparent 28%),radial-gradient(circle at 72% 10%,rgba(244,114,182,.13),transparent 22%);pointer-events:none}',
      '.pet-auth-card > *{position:relative;z-index:1}',
      '.pet-auth-logo{width:52px;height:52px;border-radius:18px;display:flex;align-items:center;justify-content:center;background:rgba(236,72,116,.18);border:1px solid rgba(244,114,182,.42);font-size:25px;margin:0 0 54px auto;box-shadow:0 12px 32px rgba(236,72,116,.20)}',
      '.pet-auth-card h2{margin:0 0 18px;font-size:25px;font-weight:1000;text-align:right}.pet-auth-card p{margin:0 0 18px;color:rgba(226,232,240,.82);line-height:1.8;font-size:14px}',
      '.pet-auth-field{margin:0 0 10px}.pet-auth-field label{display:block;margin:0 0 6px;color:rgba(226,232,240,.9);font-weight:900;font-size:13px}',
      '.pet-auth-field input{width:100%;box-sizing:border-box;border-radius:16px;border:1px solid rgba(148,163,184,.26);background:rgba(15,23,42,.52);color:#fff;padding:12px 13px;font-family:Cairo,system-ui,sans-serif;font-weight:800;outline:none}',
      '.pet-auth-field input:focus{border-color:rgba(244,114,182,.78);box-shadow:0 0 0 3px rgba(244,114,182,.16)}',
      '.pet-auth-actions{display:flex;gap:10px;align-items:center;margin-top:16px}.pet-auth-login{flex:1;border:0;border-radius:999px;padding:13px 18px;font-family:Cairo,system-ui,sans-serif;font-weight:1000;cursor:pointer;color:#fff;background:linear-gradient(135deg,#fb7185,#ec4899);box-shadow:0 16px 36px rgba(236,72,153,.28)}',
      '.pet-auth-policy{margin-top:14px;border-radius:14px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.28);color:#fde68a;padding:10px 12px;font-size:12px;line-height:1.7;font-weight:800}',
      '.pet-auth-error{display:none;margin-top:12px;border-radius:14px;background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.32);color:#fecaca;padding:10px 12px;font-size:13px;font-weight:800}.pet-auth-error.show{display:block}',
      '.pet-auth-success{display:none;margin-top:12px;border-radius:14px;background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.30);color:#bbf7d0;padding:10px 12px;font-size:13px;font-weight:900}.pet-auth-success.show{display:block}',
      '.pet-auth-link-row{display:flex;justify-content:center;margin-top:10px}.pet-auth-link{border:0;background:transparent;color:#fbcfe8;font:950 12px Cairo,system-ui,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:4px}.pet-auth-link:hover{color:#fff}',
      '.pet-auth-secondary{border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:12px 16px;font-family:Cairo,system-ui,sans-serif;font-weight:1000;cursor:pointer;color:#fff;background:rgba(255,255,255,.10)}',
      '.pet-auth-hint{margin-top:14px;color:rgba(148,163,184,.92);font-size:12px;line-height:1.7}',
      '.pet-auth-check{display:flex;align-items:center;gap:9px;margin:10px 0 0;color:rgba(226,232,240,.86);font-size:12px;font-weight:900;cursor:pointer;user-select:none}.pet-auth-check input{width:16px;height:16px;accent-color:#ec4899}',
      '.pet-auth-biometric{width:100%;border:1px solid rgba(244,114,182,.36);border-radius:999px;padding:12px 16px;margin-top:10px;font-family:Cairo,system-ui,sans-serif;font-weight:1000;cursor:pointer;color:#fff;background:linear-gradient(135deg,rgba(236,72,153,.24),rgba(15,23,42,.42));box-shadow:0 12px 28px rgba(236,72,153,.13)}',
      '.pet-auth-biometric:hover{border-color:rgba(244,114,182,.68);background:linear-gradient(135deg,rgba(236,72,153,.34),rgba(15,23,42,.50))}',
      '.pet-auth-footer{position:fixed;left:0;right:0;bottom:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;text-align:center;color:rgba(226,232,240,.9);font-size:13px;font-weight:900;letter-spacing:.1px;pointer-events:auto;padding:17px 18px;background:linear-gradient(180deg,rgba(15,23,42,.38),rgba(15,23,42,.82));border-top:1px solid rgba(255,255,255,.14);backdrop-filter:blur(18px)}',
      '.pet-auth-footer .pet-auth-version{color:#fff;font-weight:1000;letter-spacing:1.4px}',
      '.pet-auth-footer .pet-auth-sep{color:rgba(148,163,184,.55)}',
      '.pet-auth-footer .pet-auth-whatsapp{display:inline-flex;align-items:center;gap:6px;color:#e2e8f0;text-decoration:none;border:1px solid rgba(34,197,94,.35);background:rgba(34,197,94,.11);border-radius:999px;padding:5px 10px;transition:transform .18s ease,background .18s ease,border-color .18s ease}',
      '.pet-auth-footer .pet-auth-whatsapp:hover{transform:translateY(-1px);background:rgba(34,197,94,.18);border-color:rgba(34,197,94,.55)}',
      '.pet-auth-footer .pet-auth-wa-icon{width:22px;height:22px;display:inline-block;flex:0 0 22px;fill:#25d366;filter:drop-shadow(0 2px 8px rgba(37,211,102,.35))}',
      '.top-right .user.pet-auth-user-menu{position:relative;cursor:pointer;user-select:none;transition:transform .18s ease,border-color .18s ease,background .18s ease}',
      '.top-right .user.pet-auth-user-menu:hover{transform:translateY(-1px);border-color:rgba(24,231,249,.42)}',
      '.top-right .user.pet-auth-user-menu .pet-auth-user-chevron{display:inline-flex;align-items:center;justify-content:center;margin-inline-start:8px;opacity:.82;font-size:11px;transition:transform .18s ease}',
      '.top-right .user.pet-auth-user-menu.pet-auth-menu-open .pet-auth-user-chevron{transform:rotate(180deg)}',
      '.pet-auth-user-dropdown{position:absolute;top:calc(100% + 10px);left:0;min-width:220px;z-index:2147482500;padding:8px;border-radius:18px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(30,41,59,.92));box-shadow:0 18px 45px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.12);backdrop-filter:blur(18px);display:none;direction:rtl;text-align:right}',
      '.top-right .user.pet-auth-user-menu.pet-auth-menu-open .pet-auth-user-dropdown{display:block}',
      '.pet-auth-user-dropdown:before{content:"";position:absolute;top:-6px;left:28px;width:12px;height:12px;transform:rotate(45deg);background:rgba(15,23,42,.96);border-left:1px solid rgba(255,255,255,.16);border-top:1px solid rgba(255,255,255,.16)}',
      '.pet-auth-user-dropdown .pet-auth-dropdown-title{padding:9px 10px 8px;border-bottom:1px solid rgba(255,255,255,.10);margin-bottom:6px;color:rgba(226,232,240,.92);font-weight:900;font-size:13px;line-height:1.6}',
      '.pet-auth-user-dropdown .pet-auth-dropdown-title small{display:block;color:rgba(148,163,184,.88);font-size:11px;font-weight:800}',
      '.pet-auth-dropdown-item{width:100%;border:0;background:transparent;color:#fecaca;border-radius:13px;padding:10px 11px;font-family:Cairo,system-ui,sans-serif;font-weight:900;cursor:pointer;text-align:right;display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.pet-auth-dropdown-item:hover{background:rgba(239,68,68,.14)}',
      '@media(max-width:1100px){.pet-auth-card{transform:translate(-220px,38px)}.pet-auth-overlay{background-size:cover;background-position:center center}}',
      '@media(max-width:760px){.pet-auth-overlay{padding:110px 14px 104px;background-size:cover;background-position:center center}.pet-auth-card{transform:none}.pet-auth-brand{top:18px;left:18px;padding:8px 10px;border-radius:18px}.pet-auth-brand img{width:48px;height:48px}.pet-auth-brand span,.pet-auth-brand small{font-size:14px}}',
      '@media(max-width:560px){.pet-auth-card{padding:20px;border-radius:24px}.pet-auth-card:before{height:122px}.pet-auth-logo{margin-bottom:48px}.pet-auth-card h2{font-size:21px}.pet-auth-footer{gap:7px;font-size:10px}.pet-auth-footer .pet-auth-sep{display:none}}'
    ].join('\n');
    document.head.appendChild(style);
  }
  function readRemember(){ return {}; }
  function writeRemember(username, enabled){ return false; }
  function trustedDeviceClientToken(){
    var key = 'petatoe_trusted_device_token_v90';
    try{
      var existing = localStorage.getItem(key);
      if(existing && existing.length > 24) return existing;
      var token = 'pet_td_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2) + '_' + Math.random().toString(36).slice(2);
      localStorage.setItem(key, token);
      return token;
    }catch(_e){
      return 'pet_td_session_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
    }
  }
  function trustedDevicePayload(){
    var nav = window.navigator || {};
    var ua = String(nav.userAgent || '');
    var platform = String(nav.platform || '');
    var language = String(nav.language || '');
    return {
      deviceFingerprintHash: trustedDeviceClientToken(),
      deviceName: platform || 'Browser Device',
      platform: platform,
      browser: ua.slice(0, 120),
      userAgent: ua,
      language: language
    };
  }


  function sessionClientToken(reset){
    var key = 'petatoe_enterprise_session_token_v90';
    try{
      if(reset) sessionStorage.removeItem(key);
      var existing = sessionStorage.getItem(key);
      if(existing && existing.length > 24) return existing;
      var token = 'pet_sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2) + '_' + Math.random().toString(36).slice(2);
      sessionStorage.setItem(key, token);
      return token;
    }catch(_e){
      return 'pet_sess_memory_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
    }
  }

  function sessionDevicePayload(reset){
    var base = trustedDevicePayload();
    return Object.assign({}, base, { sessionClientToken: sessionClientToken(!!reset) });
  }

  function remoteSessionPayload(user, reset){
    user = user || sessionUser() || window.currentUser || {};
    return Object.assign({
      username: String(user.username || user.name || user.id || '').trim(),
      email: String(user.email || user.mail || user.userEmail || '').trim().toLowerCase(),
      purpose: 'mfa_email_otp'
    }, sessionDevicePayload(!!reset));
  }

  function startRemoteSession(user, source){
    try{
      var payload = remoteSessionPayload(user, true);
      if(!payload.username || !payload.email) return;
      callSecurityEmail(Object.assign({ action:'session_start', source:source || 'auth-login' }, payload)).catch(function(err){
        window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',err);
      });
    }catch(_e){ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_e); }
  }

  async function ensureEnterpriseSession(user, source){
    user = user || sessionUser() || window.currentUser || {};
    var payload = remoteSessionPayload(user, false);
    if(!payload.username || !payload.email || !payload.sessionClientToken){
      throw new Error('ENTERPRISE_SESSION_IDENTITY_INCOMPLETE');
    }
    var result = await callSecurityEmail(Object.assign({
      action:'session_start',
      source:source || 'localization-center-session-ensure'
    }, payload));
    if(result && result.ok === false){
      throw new Error(result.error || 'SESSION_START_FAILED');
    }
    return {ok:true, sessionClientToken:payload.sessionClientToken};
  }

  function endRemoteSession(user, reason){
    try{
      var payload = remoteSessionPayload(user, false);
      if(!payload.username || !payload.email || !payload.sessionClientToken) return;
      callSecurityEmail(Object.assign({ action:'session_end', logoutReason:reason || 'manual' }, payload)).catch(function(err){
        window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',err);
      });
    }catch(_e){ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_e); }
  }

  function authUserIdentityPayload(user){
    user = user || sessionUser() || window.currentUser || {};
    return {
      username: String(user.username || user.name || user.id || '').trim(),
      email: String(user.email || user.mail || user.userEmail || '').trim().toLowerCase(),
      purpose: 'mfa_email_otp'
    };
  }
  async function listTrustedDevices(){
    var payload = authUserIdentityPayload();
    if(!payload.username || !payload.email) throw new Error('CURRENT_USER_EMAIL_REQUIRED');
    return callSecurityEmail(Object.assign({action:'trusted_devices_list'}, payload));
  }
  async function revokeTrustedDevice(deviceId){
    var payload = authUserIdentityPayload();
    if(!payload.username || !payload.email) throw new Error('CURRENT_USER_EMAIL_REQUIRED');
    if(!deviceId) throw new Error('DEVICE_ID_REQUIRED');
    return callSecurityEmail(Object.assign({action:'trusted_device_revoke', deviceId:String(deviceId)}, payload));
  }

  async function listActiveSessions(){
    var user = sessionUser() || window.currentUser || {};
    var payload = remoteSessionPayload(user, false);
    if(!payload.username || !payload.email) throw new Error('CURRENT_USER_EMAIL_REQUIRED');
    return callSecurityEmail(Object.assign({action:'active_sessions_list'}, payload));
  }

  async function revokeActiveSession(sessionId){
    var user = sessionUser() || window.currentUser || {};
    var payload = remoteSessionPayload(user, false);
    if(!payload.username || !payload.email) throw new Error('CURRENT_USER_EMAIL_REQUIRED');
    if(!sessionId) throw new Error('SESSION_ID_REQUIRED');
    return callSecurityEmail(Object.assign({action:'session_revoke', sessionId:String(sessionId), logoutReason:'revoked_by_user'}, payload));
  }

  async function revokeAllActiveSessions(keepCurrent){
    var user = sessionUser() || window.currentUser || {};
    var payload = remoteSessionPayload(user, false);
    if(!payload.username || !payload.email) throw new Error('CURRENT_USER_EMAIL_REQUIRED');
    return callSecurityEmail(Object.assign({action:'session_revoke_all', keepCurrent: keepCurrent !== false, logoutReason:'revoked_all_by_user'}, payload));
  }

  async function listSecurityActivity(){
    var user = sessionUser() || window.currentUser || {};
    var payload = remoteSessionPayload(user, false);
    if(!payload.username || !payload.email){
      payload = authUserIdentityPayload(user);
    }
    if(!payload.username || !payload.email) throw new Error('CURRENT_USER_EMAIL_REQUIRED');
    return callSecurityEmail(Object.assign({action:'security_activity_list'}, payload));
  }

  async function forceRevokeUserSessions(targetUser, reason){
    var current = sessionUser() || window.currentUser || {};
    var payload = remoteSessionPayload(current, false);
    var target = targetUser || {};
    var targetUserId = String(target.supabase_id || target.row_id || target.id || '').trim();
    var targetUsername = String(target.username || target.name || '').trim();
    if(!payload.username || !payload.email) throw new Error('CURRENT_USER_EMAIL_REQUIRED');
    if(!targetUserId && !targetUsername) throw new Error('TARGET_USER_REQUIRED');
    return callSecurityEmail(Object.assign({action:'user_sessions_force_revoke', targetUserId:targetUserId, targetUsername:targetUsername, logoutReason:reason || 'admin_force_revoke'}, payload));
  }

  /* PETATOE v9.0 S4.5.5 — Enterprise Idle Timeout
     Root scope: frontend inactivity enforcement + remote session last_activity touch.
     Default policy: 30 minutes idle timeout with a 60-second warning. */
  var IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  var IDLE_WARNING_MS = 60 * 1000;
  var IDLE_TOUCH_THROTTLE_MS = 5 * 60 * 1000;
  var IDLE_ACTIVITY_KEY = 'petatoe_enterprise_last_activity_v90';
  var IDLE_LOGOUT_KEY = 'petatoe_enterprise_idle_logout_v90';
  var idleTimer = null;
  var idleWarningTimer = null;
  var idleTouchTimer = null;
  var idleLastLocalTouch = 0;

  function idleNow(){ return Date.now ? Date.now() : new Date().getTime(); }
  function idleReadLastActivity(){
    try{ return Number(localStorage.getItem(IDLE_ACTIVITY_KEY) || '0') || 0; }catch(_e){ return 0; }
  }
  function idleWriteLastActivity(ts){
    try{ localStorage.setItem(IDLE_ACTIVITY_KEY, String(ts || idleNow())); }catch(_e){}
  }
  function idleWarningEl(){ return document.getElementById('petEnterpriseIdleWarning'); }
  function hideIdleWarning(){
    try{ var el = idleWarningEl(); if(el) el.remove(); }catch(_e){}
  }
  function touchRemoteSession(reason){
    try{
      var user = sessionUser() || window.currentUser || {};
      var payload = remoteSessionPayload(user, false);
      if(!payload.username || !payload.email || !payload.sessionClientToken) return;
      callSecurityEmail(Object.assign({action:'session_touch', source:reason || 'idle-activity'}, payload)).catch(function(err){
        var msg = String(err && err.message || err);
        if(msg === 'SESSION_TOUCH_FAILED' || msg === 'SESSION_TOKEN_REQUIRED' || msg === 'HTTP_401'){ logout('remote_session_revoked'); return; }
        window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',err);
      });
    }catch(_e){ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_e); }
  }
  function maybeTouchRemoteSession(reason){
    var n = idleNow();
    if(n - idleLastLocalTouch < IDLE_TOUCH_THROTTLE_MS) return;
    idleLastLocalTouch = n;
    touchRemoteSession(reason || 'idle-activity');
  }
  function showIdleWarning(remainingMs){
    if(!sessionUser()) return;
    var existing = idleWarningEl();
    if(existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'petEnterpriseIdleWarning';
    el.dir = 'rtl';
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(2,8,23,.55);backdrop-filter:blur(8px);font-family:Cairo,Tahoma,Arial,sans-serif;';
    var secs = Math.max(1, Math.ceil((remainingMs || IDLE_WARNING_MS) / 1000));
    el.innerHTML = '<div style="width:min(460px,calc(100vw - 32px));border:1px solid rgba(255,255,255,.18);border-radius:24px;background:linear-gradient(145deg,rgba(23,35,56,.96),rgba(11,18,32,.96));box-shadow:0 24px 80px rgba(0,0,0,.45);padding:24px;color:#eef6ff;text-align:center">' +
      '<div style="font-size:34px;margin-bottom:8px">⏱️</div>' +
      '<h3 style="margin:0 0 10px;font-size:22px">تنبيه انتهاء الجلسة</h3>' +
      '<p style="margin:0 0 18px;color:#b9c7d8;line-height:1.8">ستنتهي جلستك خلال <b id="petIdleCountdown">' + secs + '</b> ثانية بسبب عدم النشاط.</p>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
      '<button id="petIdleContinueBtn" type="button" style="border:0;border-radius:16px;padding:12px 20px;background:#22c55e;color:white;font-weight:800;cursor:pointer">متابعة الجلسة</button>' +
      '<button id="petIdleLogoutBtn" type="button" style="border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:12px 20px;background:rgba(255,255,255,.08);color:white;font-weight:800;cursor:pointer">تسجيل الخروج الآن</button>' +
      '</div></div>';
    document.body.appendChild(el);
    var countdown = el.querySelector('#petIdleCountdown');
    var started = idleNow();
    var tick = setInterval(function(){
      if(!document.body.contains(el)){ clearInterval(tick); return; }
      var left = Math.max(0, secs - Math.floor((idleNow() - started) / 1000));
      if(countdown) countdown.textContent = String(left);
    }, 1000);
    var cont = el.querySelector('#petIdleContinueBtn');
    if(cont) cont.addEventListener('click', function(){
      clearInterval(tick);
      recordUserActivity('idle-continue');
      hideIdleWarning();
    });
    var out = el.querySelector('#petIdleLogoutBtn');
    if(out) out.addEventListener('click', function(){
      clearInterval(tick);
      triggerIdleLogout('idle_manual_logout');
    });
  }
  function clearIdleTimers(){
    if(idleTimer){ clearTimeout(idleTimer); idleTimer = null; }
    if(idleWarningTimer){ clearTimeout(idleWarningTimer); idleWarningTimer = null; }
  }
  function scheduleIdleTimers(){
    clearIdleTimers();
    if(!sessionUser()) return;
    var last = idleReadLastActivity() || idleNow();
    var elapsed = idleNow() - last;
    var warnIn = Math.max(0, IDLE_TIMEOUT_MS - IDLE_WARNING_MS - elapsed);
    var logoutIn = Math.max(0, IDLE_TIMEOUT_MS - elapsed);
    idleWarningTimer = setTimeout(function(){
      var freshElapsed = idleNow() - (idleReadLastActivity() || idleNow());
      if(freshElapsed >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS) showIdleWarning(IDLE_TIMEOUT_MS - freshElapsed);
      scheduleIdleTimers();
    }, warnIn);
    idleTimer = setTimeout(function(){
      var freshElapsed = idleNow() - (idleReadLastActivity() || idleNow());
      if(freshElapsed >= IDLE_TIMEOUT_MS) triggerIdleLogout('idle_timeout');
      else scheduleIdleTimers();
    }, logoutIn);
  }
  function recordUserActivity(reason){
    if(!sessionUser()) return;
    hideIdleWarning();
    idleWriteLastActivity(idleNow());
    maybeTouchRemoteSession(reason || 'activity');
    scheduleIdleTimers();
  }
  function triggerIdleLogout(reason){
    hideIdleWarning();
    clearIdleTimers();
    try{ localStorage.setItem(IDLE_LOGOUT_KEY, String(idleNow()) + ':' + String(reason || 'idle_timeout')); }catch(_e){}
    logout(reason || 'idle_timeout');
  }
  function startIdleTimeout(){
    if(!sessionUser()) return;
    if(!idleReadLastActivity()) idleWriteLastActivity(idleNow());
    scheduleIdleTimers();
    maybeTouchRemoteSession('idle-start');
  }
  function stopIdleTimeout(){
    clearIdleTimers();
    hideIdleWarning();
    if(idleTouchTimer){ clearTimeout(idleTouchTimer); idleTouchTimer = null; }
  }
  ['mousemove','mousedown','keydown','scroll','touchstart','click'].forEach(function(evt){
    try{ window.addEventListener(evt, function(){
      if(idleTouchTimer) return;
      idleTouchTimer = setTimeout(function(){ idleTouchTimer = null; recordUserActivity(evt); }, 750);
    }, {passive:true}); }catch(_e){}
  });
  try{
    window.addEventListener('storage', function(ev){
      if(ev && ev.key === IDLE_ACTIVITY_KEY && sessionUser()) scheduleIdleTimers();
      if(ev && ev.key === IDLE_LOGOUT_KEY && sessionUser()) logout('idle_timeout_multitab');
    });
  }catch(_e){}

  function saveBrowserPasswordCredential(form, username, enabled){
    writeRemember(username, !!enabled);
    if(!enabled || !form) return;
    try{
      if(window.PasswordCredential && navigator.credentials && navigator.credentials.store){
        var cred = new window.PasswordCredential(form);
        navigator.credentials.store(cred).catch(function(err){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',err);});
      }
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
  }
  function bytes(n){
    var a = new Uint8Array(n || 32);
    try{ window.crypto.getRandomValues(a); }catch(_){ for(var i=0;i<a.length;i++) a[i] = Math.floor(Math.random()*256); }
    return a;
  }
  function b64url(buf){
    var bin = '';
    var arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf || []);
    for(var i=0;i<arr.length;i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function unb64url(str){
    str = String(str || '').replace(/-/g,'+').replace(/_/g,'/');
    while(str.length % 4) str += '=';
    var bin = atob(str), arr = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
    return arr.buffer;
  }
  function biometricSupported(){
    return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create && navigator.credentials.get && window.crypto);
  }
  function biometricUsable(){
    return biometricSupported() && window.isSecureContext !== false;
  }
  function readBiometric(){ return null; }
  function biometricButtonHtml(){
    var r = readBiometric();
    if(!r) return '';
    return '<button class="pet-auth-biometric" type="button" id="petAuthBiometricBtn">Face ID / بصمة الوجه</button>';
  }
  function biometricEnrollHtml(){
    if(!biometricSupported()) return '';
    return '<label class="pet-auth-check"><input type="checkbox" id="petAuthEnableBiometric"> <span>تفعيل Face ID / بصمة الوجه بعد الدخول</span></label>';
  }
  function registerBiometric(user){
    toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم تعطيل التخزين المحلي للبصمة في نسخة Supabase.'):'تم تعطيل التخزين المحلي للبصمة في نسخة Supabase.');
    return Promise.resolve(false);
  }
  function loginWithBiometric(){
    var r = readBiometric();
    if(!r){ renderLogin('لم يتم تفعيل Face ID لهذا الجهاز بعد'); return; }
    if(!biometricUsable()){ renderLogin('Face ID يحتاج HTTPS أو متصفح يدعم WebAuthn'); return; }
    navigator.credentials.get({publicKey:{challenge:bytes(32), allowCredentials:[{type:'public-key', id:unb64url(r.credentialId)}], userVerification:'required', timeout:60000}}).then(function(assertion){
      if(!assertion || b64url(assertion.rawId) !== r.credentialId){ renderLogin('تعذر التحقق من Face ID'); return; }
      var user = findUser(r.username || r.userId);
      if(!user || !isActive(user)){ renderLogin('المستخدم المرتبط بالبصمة غير متاح'); return; }
      if(user.mustChangePassword || user.bootstrapCredential){ renderPasswordChange(user, 'يجب تغيير كلمة المرور قبل استخدام Face ID'); return; }
      openSession(user, 'auth-biometric', {biometric:true});
    }).catch(function(){ renderLogin('تم إلغاء أو فشل التحقق بالبصمة'); });
  }

  function securityEmailEndpoint(){
    try{
      var cfg = window.PETATOE_SUPABASE_CONFIG || {};
      var url = String(cfg.url || '').replace(/\/+$/, '');
      if(url) return url + '/functions/v1/petatoe-security-email';
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
    return 'https://ewakcovwyfkjxqwkccun.supabase.co/functions/v1/petatoe-security-email';
  }
  async function callSecurityEmail(payload){
    var cfg = window.PETATOE_SUPABASE_CONFIG || {};
    var key = String(cfg.publishableKey || '').trim();
    var headers = {'Content-Type':'application/json'};
    if(key){ headers.apikey = key; headers.Authorization = 'Bearer ' + key; }
    var res = await fetch(securityEmailEndpoint(), {method:'POST', headers:headers, body:JSON.stringify(payload || {})});
    var data = null;
    try{ data = await res.json(); }catch(_){ data = {ok:false,error:'INVALID_JSON_RESPONSE'}; }
    if(!res.ok || !data || data.ok === false){
      var err = (data && (data.error || data.message || data.details)) || ('HTTP_' + res.status);
      throw new Error(String(err));
    }
    return data;
  }
  function renderForgotPassword(message, state){
    ensureStyles();
    setLoggedInClass(false);
    state = state || {};
    var old = document.getElementById('pet-auth-overlay'); if(old) old.remove();
    var sent = !!state.sent;
    var overlay = document.createElement('div');
    overlay.id = 'pet-auth-overlay';
    overlay.className = 'pet-auth-overlay';
    overlay.innerHTML = '<div class="pet-auth-brand" aria-label="PETATOE"><img src="img/petatoe-logo-light-transparent.png" alt="PETATOE"><span>Petatoe<small>بيتاتو</small></span></div>' +
      '<form class="pet-auth-card" id="petForgotPasswordForm" autocomplete="off">' +
      '<div class="pet-auth-logo">🔐</div><h2>استعادة كلمة المرور</h2>' +
      '<p>أدخل اسم المستخدم والبريد الإلكتروني المسجل. سيتم إرسال رمز تحقق صالح لمدة 10 دقائق.</p>' +
      '<div class="pet-auth-field"><label for="petForgotUsername">اسم المستخدم</label><input id="petForgotUsername" name="username" autocomplete="username" value="'+esc(state.username || '')+'" required></div>' +
      '<div class="pet-auth-field"><label for="petForgotEmail">البريد الإلكتروني</label><input id="petForgotEmail" name="email" type="email" autocomplete="email" value="'+esc(state.email || '')+'" required></div>' +
      (sent ? '<div class="pet-auth-field"><label for="petForgotOtp">رمز التحقق OTP</label><input id="petForgotOtp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></div>' +
      '<div class="pet-auth-field"><label for="petForgotNewPassword">كلمة المرور الجديدة</label><input id="petForgotNewPassword" name="newPassword" type="password" autocomplete="new-password" required></div>' +
      '<div class="pet-auth-field"><label for="petForgotNewPassword2">تأكيد كلمة المرور</label><input id="petForgotNewPassword2" name="newPassword2" type="password" autocomplete="new-password" required></div>' : '') +
      '<div class="pet-auth-actions"><button class="pet-auth-login" type="submit">'+(sent ? 'تغيير كلمة المرور' : 'إرسال رمز التحقق')+'</button><button class="pet-auth-secondary" type="button" id="petForgotBackBtn">رجوع</button></div>' +
      '<div class="pet-auth-link-row">'+(sent ? '<button class="pet-auth-link" type="button" id="petForgotResendBtn">إعادة إرسال الرمز</button>' : '')+'</div>' +
      '<div class="pet-auth-success'+(state.success ? ' show' : '')+'" id="petAuthSuccess">'+esc(state.success || '')+'</div>' +
      '<div class="pet-auth-error'+(message ? ' show' : '')+'" id="petAuthError">'+esc(message || '')+'</div>' +
      '</form>' + authFooterHtml();
    document.body.appendChild(overlay);
    var form = document.getElementById('petForgotPasswordForm');
    var back = document.getElementById('petForgotBackBtn');
    var resend = document.getElementById('petForgotResendBtn');
    if(back){ back.addEventListener('click', function(e){ e.preventDefault(); renderLogin(''); }); }
    async function sendOtp(currentState){
      var u = document.getElementById('petForgotUsername');
      var em = document.getElementById('petForgotEmail');
      var username = u && u.value || '';
      var email = em && em.value || '';
      if(!String(username).trim() || !String(email).trim()){ renderForgotPassword('اسم المستخدم والبريد مطلوبان', {username:username,email:email}); return; }
      try{
        await callSecurityEmail({action:'send_otp', username:username, email:email, purpose:'password_reset'});
        renderForgotPassword('', {sent:true, username:username, email:email, success:'تم إرسال رمز التحقق إلى البريد إذا كانت البيانات صحيحة'});
      }catch(err){ renderForgotPassword('تعذر إرسال رمز التحقق: ' + String(err && err.message || err), {username:username,email:email}); }
    }
    if(resend){ resend.addEventListener('click', function(e){ e.preventDefault(); sendOtp(state); }); }
    if(form){ form.addEventListener('submit', async function(e){
      e.preventDefault();
      var username = (document.getElementById('petForgotUsername') || {}).value || '';
      var email = (document.getElementById('petForgotEmail') || {}).value || '';
      if(!sent){ sendOtp({username:username,email:email}); return; }
      var otp = (document.getElementById('petForgotOtp') || {}).value || '';
      var p1 = (document.getElementById('petForgotNewPassword') || {}).value || '';
      var p2 = (document.getElementById('petForgotNewPassword2') || {}).value || '';
      if(String(otp).trim().length < 6){ renderForgotPassword('أدخل رمز تحقق صحيح من 6 أرقام', {sent:true,username:username,email:email}); return; }
      if(p1 !== p2){ renderForgotPassword('كلمتا المرور غير متطابقتين', {sent:true,username:username,email:email}); return; }
      if(!strongEnoughPassword(p1)){ renderForgotPassword('كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مع حروف وأرقام.', {sent:true,username:username,email:email}); return; }
      try{
        await callSecurityEmail({action:'reset_password', username:username, email:email, otp:otp, newPassword:p1, purpose:'password_reset'});
        try{ var ids = identityStore(); if(ids && ids._cache){ ids._cache.loading = null; ids._cache.loaded = false; } if(ids && typeof ids.load === 'function') await ids.load(); }catch(_e){}
        renderLogin('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
      }catch(err){
        var msg = String(err && err.message || err);
        if(msg === 'INVALID_OR_EXPIRED_OTP') msg = 'رمز التحقق غير صحيح أو منتهي الصلاحية';
        if(msg === 'WEAK_PASSWORD') msg = 'كلمة المرور ضعيفة';
        renderForgotPassword('تعذر تغيير كلمة المرور: ' + msg, {sent:true,username:username,email:email});
      }
    }); }
    var focusEl = document.getElementById(sent ? 'petForgotOtp' : 'petForgotUsername');
    if(focusEl) setTimeout(function(){ try{ focusEl.focus(); }catch(_){ } }, 40);
  }


  function isMfaRequired(user){
    if(!user) return false;
    if(isBootstrapAdmin(user)) return true;
    var flags = [user.mfaEnabled, user.mfa_enabled, user.mfaRequired, user.mfa_required, user.enforceMfa, user.enforce_mfa];
    if(user.mfa && typeof user.mfa === 'object') flags.push(user.mfa.enabled, user.mfa.enforced, user.mfa.required);
    return flags.some(function(v){ return v === true || String(v || '').toLowerCase() === 'true' || String(v || '') === '1'; });
  }
  function userLoginEmail(user){
    return String((user && (user.email || user.mail || user.userEmail)) || '').trim().toLowerCase();
  }
  function renderMfaChallenge(user, options, message, state){
    ensureStyles();
    setLoggedInClass(false);
    options = options || {};
    state = state || {};
    var old = document.getElementById('pet-auth-overlay'); if(old) old.remove();
    var overlay = document.createElement('div');
    overlay.id = 'pet-auth-overlay';
    overlay.className = 'pet-auth-overlay';
    overlay.innerHTML = '<div class="pet-auth-brand" aria-label="PETATOE"><img src="img/petatoe-logo-light-transparent.png" alt="PETATOE"><span>Petatoe<small>بيتاتو</small></span></div>' +
      '<form class="pet-auth-card" id="petMfaForm" autocomplete="off">' +
      '<div class="pet-auth-logo">🔐</div><h2>التحقق الثنائي MFA</h2>' +
      '<p>تم إرسال رمز تحقق إلى البريد الإلكتروني المسجل. أدخل الرمز لإكمال تسجيل الدخول.</p>' +
      '<div class="pet-auth-field"><label for="petMfaOtp">رمز التحقق OTP</label><input id="petMfaOtp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></div>' +
      '<label class="pet-auth-check"><input type="checkbox" id="petMfaRememberDevice"> <span>تذكر هذا الجهاز لمدة 30 يومًا</span></label>' +
      '<div class="pet-auth-actions"><button class="pet-auth-login" type="submit">تأكيد وفتح النظام</button><button class="pet-auth-secondary" type="button" id="petMfaBackBtn">رجوع</button></div>' +
      '<div class="pet-auth-link-row"><button class="pet-auth-link" type="button" id="petMfaResendBtn">إعادة إرسال الرمز</button></div>' +
      '<div class="pet-auth-success'+(state.success ? ' show' : '')+'" id="petAuthSuccess">'+esc(state.success || '')+'</div>' +
      '<div class="pet-auth-error'+(message ? ' show' : '')+'" id="petAuthError">'+esc(message || '')+'</div>' +
      '</form>' + authFooterHtml();
    document.body.appendChild(overlay);
    var email = userLoginEmail(user);
    var username = user && (user.username || user.name || user.id) || '';
    var back = document.getElementById('petMfaBackBtn');
    var resend = document.getElementById('petMfaResendBtn');
    var form = document.getElementById('petMfaForm');
    if(back){ back.addEventListener('click', function(e){ e.preventDefault(); renderLogin('تم إلغاء التحقق الثنائي'); }); }
    async function sendMfaOtp(){
      try{
        if(!email){ renderMfaChallenge(user, options, 'لا يوجد بريد إلكتروني مسجل لهذا المستخدم لإرسال رمز MFA'); return; }
        var payload = Object.assign({action:'mfa_send_otp', username:username, email:email, purpose:'mfa_email_otp'}, trustedDevicePayload());
        await callSecurityEmail(payload);
        renderMfaChallenge(user, options, '', {success:'تم إرسال رمز MFA إلى البريد الإلكتروني المسجل'});
      }catch(err){ renderMfaChallenge(user, options, 'تعذر إرسال رمز MFA: ' + String(err && err.message || err)); }
    }
    if(resend){ resend.addEventListener('click', function(e){ e.preventDefault(); sendMfaOtp(); }); }
    if(form){ form.addEventListener('submit', async function(e){
      e.preventDefault();
      var otp = (document.getElementById('petMfaOtp') || {}).value || '';
      if(String(otp).trim().length < 6){ renderMfaChallenge(user, options, 'أدخل رمز تحقق صحيح من 6 أرقام'); return; }
      try{
        var rememberDevice = !!(document.getElementById('petMfaRememberDevice') && document.getElementById('petMfaRememberDevice').checked);
        await callSecurityEmail(Object.assign({action:'mfa_verify', username:username, email:email, otp:otp, purpose:'mfa_email_otp', rememberDevice:rememberDevice}, trustedDevicePayload()));
        try{
          var ids = identityStore();
          if(ids && ids._cache){ ids._cache.loading = null; ids._cache.loaded = false; }
          if(ids && typeof ids.load === 'function') await ids.load();
          var refreshed = findUser(username);
          if(refreshed) user = refreshed;
        }catch(_refreshErr){ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_refreshErr); }
        openSession(user, 'auth-login-mfa', Object.assign({}, options || {}, {mfaVerified:true}));
      }catch(err){
        var msg = String(err && err.message || err);
        if(msg === 'INVALID_OR_EXPIRED_OTP') msg = 'رمز MFA غير صحيح أو منتهي الصلاحية';
        renderMfaChallenge(user, options, 'تعذر إكمال التحقق الثنائي: ' + msg);
      }
    }); }
    var otpEl = document.getElementById('petMfaOtp');
    if(otpEl) setTimeout(function(){ try{ otpEl.focus(); }catch(_){ } }, 40);
  }

  function renderLogin(message){
    ensureStyles();
    setLoggedInClass(false);
    var old = document.getElementById('pet-auth-overlay'); if(old) old.remove();
    var remember = readRemember();
    var savedUsername = remember && remember.enabled ? String(remember.username || '') : '';
    var overlay = document.createElement('div');
    overlay.id = 'pet-auth-overlay';
    overlay.className = 'pet-auth-overlay';
    overlay.innerHTML = '<div class="pet-auth-brand" aria-label="PETATOE"><img src="img/petatoe-logo-light-transparent.png" alt="PETATOE"><span>Petatoe<small>بيتاتو</small></span></div>' +
      '<form class="pet-auth-card" id="petAuthForm" autocomplete="on">' +
      '<div class="pet-auth-logo">🐾</div>' +
      '<div class="pet-auth-field"><label for="petAuthUsername">اسم المستخدم</label><input id="petAuthUsername" name="username" autocomplete="username" value="'+esc(savedUsername)+'" required></div>' +
      '<div class="pet-auth-field"><label for="petAuthPassword">كلمة المرور</label><input id="petAuthPassword" name="password" type="password" autocomplete="current-password" required></div>' +
      '<label class="pet-auth-check"><input type="checkbox" id="petAuthRemember" '+(remember && remember.enabled ? 'checked' : '')+'> <span>حفظ بيانات الدخول في المتصفح</span></label>' +
      '<div class="pet-auth-link-row"><button class="pet-auth-link" type="button" id="petForgotPasswordBtn">نسيت كلمة المرور؟</button></div>' +
      biometricEnrollHtml() +
      '<div class="pet-auth-actions"><button class="pet-auth-login" type="submit">دخول</button></div>' +
      biometricButtonHtml() +
      '<div class="pet-auth-error'+(message ? ' show' : '')+'" id="petAuthError">'+esc(message || '')+'</div>' +
      '</form>' + authFooterHtml();
    document.body.appendChild(overlay);
    var form = document.getElementById('petAuthForm');
    var username = document.getElementById('petAuthUsername');
    var password = document.getElementById('petAuthPassword');
    var bioBtn = document.getElementById('petAuthBiometricBtn');
    if(username) setTimeout(function(){ try{ (savedUsername && password ? password : username).focus(); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);} }, 40);
    if(bioBtn){ bioBtn.addEventListener('click', function(e){ e.preventDefault(); loginWithBiometric(); }); }
    var forgotBtn = document.getElementById('petForgotPasswordBtn');
    if(forgotBtn){ forgotBtn.addEventListener('click', function(e){ e.preventDefault(); renderForgotPassword('', {username: username && username.value || ''}); }); }
    if(form){ form.addEventListener('submit', async function(e){
      e.preventDefault();
      await login(username && username.value, password && password.value, {
        remember: !!(document.getElementById('petAuthRemember') && document.getElementById('petAuthRemember').checked),
        enableBiometric: !!(document.getElementById('petAuthEnableBiometric') && document.getElementById('petAuthEnableBiometric').checked),
        form: form
      });
    }); }
  }
  function closeUserMenu(){
    try{
      var box = document.querySelector('.top-right .user.pet-auth-user-menu');
      if(box) box.classList.remove('pet-auth-menu-open');
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
  }
  function ensureUserMenuHandlers(){
    if(window.__PETATOE_AUTH_USER_MENU_HANDLERS__) return;
    window.__PETATOE_AUTH_USER_MENU_HANDLERS__ = true;
    document.addEventListener('click', function(e){
      try{
        var box = document.querySelector('.top-right .user.pet-auth-user-menu');
        if(box && !box.contains(e.target)) closeUserMenu();
      }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
    });
    document.addEventListener('keydown', function(e){ if(e && e.key === 'Escape') closeUserMenu(); });
  }
  function renderPasswordChange(user, message){
    ensureStyles();
    setLoggedInClass(false);
    var old = document.getElementById('pet-auth-overlay'); if(old) old.remove();
    var overlay = document.createElement('div');
    overlay.id = 'pet-auth-overlay';
    overlay.className = 'pet-auth-overlay';
    overlay.innerHTML = '<div class="pet-auth-brand" aria-label="PETATOE"><img src="img/petatoe-logo-light-transparent.png" alt="PETATOE"><span>Petatoe<small>بيتاتو</small></span></div>' +
      '<form class="pet-auth-card" id="petPasswordChangeForm" autocomplete="off">' +
      '<div class="pet-auth-logo">🔐</div><h2>تغيير كلمة المرور مطلوب</h2>' +
      '<p>هذا حساب تهيئة أولية. لحماية النسخة قبل التشغيل أو الرفع، يجب تعيين كلمة مرور جديدة قوية الآن.</p>' +
      '<div class="pet-auth-policy">الشرط: 8 أحرف على الأقل، وتحتوي على حروف وأرقام، ولا تكون admin.</div>' +
      '<div class="pet-auth-field"><label for="petNewPassword">كلمة المرور الجديدة</label><input id="petNewPassword" type="password" autocomplete="new-password" required></div>' +
      '<div class="pet-auth-field"><label for="petNewPassword2">تأكيد كلمة المرور</label><input id="petNewPassword2" type="password" autocomplete="new-password" required></div>' +
      '<div class="pet-auth-actions"><button class="pet-auth-login" type="submit">حفظ وفتح النظام</button></div>' +
      '<div class="pet-auth-error'+(message ? ' show' : '')+'" id="petAuthError">'+esc(message || '')+'</div>' +
      '</form>' + authFooterHtml();
    document.body.appendChild(overlay);
    var form = document.getElementById('petPasswordChangeForm');
    var p1 = document.getElementById('petNewPassword');
    var p2 = document.getElementById('petNewPassword2');
    if(p1) setTimeout(function(){ try{ p1.focus(); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);} }, 40);
    if(form){ form.addEventListener('submit', async function(e){
      e.preventDefault();
      var a = p1 && p1.value || '', b = p2 && p2.value || '';
      if(a !== b){ renderPasswordChange(user, 'كلمتا المرور غير متطابقتين'); return; }
      if(!strongEnoughPassword(a)){ renderPasswordChange(user, 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مع حروف وأرقام.'); return; }
      var sec = window.PETATOEPasswordSecurity;
      try{ if(sec && typeof sec.setPassword === 'function') sec.setPassword(user, a); else user.password = a; }catch(_){ user.password = a; }
      delete user.mustChangePassword;
      delete user.bootstrapCredential;
      user.bootstrapCredentialClearedAt = now();
      user.passwordPolicy = 'custom';
      user.passwordUpdatedAt = now();
      var ids = identityStore();
      if(ids && typeof ids.updateUserCredential === 'function'){
        var saved = await ids.updateUserCredential(user);
        if(!saved || saved.ok === false){ renderPasswordChange(user, 'تعذر حفظ كلمة المرور في Supabase: ' + ((saved && saved.error) || 'غير معروف')); return; }
      }else{
        renderPasswordChange(user, 'تعذر الوصول إلى مخزن مستخدمي Supabase'); return;
      }
      audit(user.passwordPolicy === 'emergency_recovery' ? 'Emergency SuperAdmin Password Reset' : 'Bootstrap Password Changed', user.username || user.id, 'warn');
      try{
        var revokePayload = remoteSessionPayload(user, true);
        if(revokePayload.username && revokePayload.email){
          await callSecurityEmail(Object.assign({action:'session_revoke_all', keepCurrent:false, logoutReason:'password_changed'}, revokePayload));
        }
      }catch(_revokeErr){ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_revokeErr); }
      login(user.username || user.name || user.id, a);
    }); }
  }
  function roleLabel(user){
    var raw = String((user && (user.job || user.role || user.type)) || '').trim();
    if(!raw) return 'مستخدم';
    var map = {
      superadmin:'Super Admin', super_admin:'Super Admin', admin:'Admin', manager:'Manager', user:'User', viewer:'Viewer', operator:'Operator', driver:'Driver'
    };
    return map[raw.toLowerCase()] || raw;
  }
  function topbarUserBox(){
    var box = document.getElementById('topbarUserBlock') || document.querySelector('.top-right .user');
    if(!box) return null;
    box.id = box.id || 'topbarUserBlock';
    var nameEl = document.getElementById('topbarUserName') || box.querySelector('b');
    if(nameEl) nameEl.id = nameEl.id || 'topbarUserName';
    var roleEl = document.getElementById('topbarUserRole') || box.querySelector('small');
    if(roleEl) roleEl.id = roleEl.id || 'topbarUserRole';
    return box;
  }
  function updateHeader(user){
    try{
      user = user || sessionUser() || {};
      var box = topbarUserBox();
      if(!box) return;
      box.classList.add('pet-auth-user-menu');
      box.setAttribute('role', 'button');
      box.setAttribute('tabindex', '0');
      box.setAttribute('aria-haspopup', 'menu');
      box.setAttribute('aria-expanded', box.classList.contains('pet-auth-menu-open') ? 'true' : 'false');
      box.setAttribute('title', 'قائمة المستخدم');

      var displayName = user.fullName || user.username || user.name || 'مستخدم';
      var displayRole = roleLabel(user);
      var nameEl = document.getElementById('topbarUserName') || box.querySelector('b');
      if(nameEl) nameEl.textContent = displayName;
      var roleEl = document.getElementById('topbarUserRole') || box.querySelector('small');
      if(roleEl) roleEl.textContent = displayRole;

      if(!box.querySelector('.pet-auth-user-chevron')){
        var firstDiv = box.querySelector('div');
        if(firstDiv){
          var chevron = document.createElement('span');
          chevron.className = 'pet-auth-user-chevron';
          chevron.textContent = '▾';
          firstDiv.appendChild(chevron);
        }
      }

      var menu = box.querySelector('#petAuthUserDropdown');
      if(!menu){
        menu = document.createElement('div');
        menu.id = 'petAuthUserDropdown';
        menu.className = 'pet-auth-user-dropdown';
        menu.setAttribute('role', 'menu');
        menu.innerHTML = '<div class="pet-auth-dropdown-title"><span id="petAuthMenuName"></span><small id="petAuthMenuRole"></small></div>' +
          '<button type="button" class="pet-auth-dropdown-item" id="petAuthDropdownLogout" role="menuitem"><span>تسجيل الخروج</span><span>↩</span></button>';
        box.appendChild(menu);
      }
      var logoutBtn = menu.querySelector('#petAuthDropdownLogout');
      if(logoutBtn && !logoutBtn.__PETATOE_LOGOUT_BOUND__){
        logoutBtn.__PETATOE_LOGOUT_BOUND__ = true;
        logoutBtn.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          closeUserMenu();
          logout('manual');
        }, true);
      }
      var menuName = box.querySelector('#petAuthMenuName');
      if(menuName) menuName.textContent = displayName;
      var menuRole = box.querySelector('#petAuthMenuRole');
      if(menuRole) menuRole.textContent = displayRole;

      if(!box.__PETATOE_AUTH_MENU_BOUND__){
        box.__PETATOE_AUTH_MENU_BOUND__ = true;
        box.addEventListener('click', function(e){
          if(e.target && e.target.closest && e.target.closest('.pet-auth-user-dropdown')) return;
          e.preventDefault();
          e.stopPropagation();
          var opened = box.classList.toggle('pet-auth-menu-open');
          box.setAttribute('aria-expanded', opened ? 'true' : 'false');
          try{ document.dispatchEvent(new CustomEvent('petatoe:topbar:user-menu-toggle', {detail:{open:opened}})); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
        }, true);
        box.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){
            e.preventDefault();
            var opened = box.classList.toggle('pet-auth-menu-open');
            box.setAttribute('aria-expanded', opened ? 'true' : 'false');
          }
        }, true);
      }
      ensureUserMenuHandlers();

      var oldBtn = document.getElementById('petAuthLogoutBtn');
      if(oldBtn) oldBtn.remove();
    }catch(err){ try{ console.warn('[PETATOE Auth] updateHeader failed', err); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);} }
  }
  function stabilizePostLoginRoute(user, source){
    /* PETATOE v9.0 S4.4.1 Regression Fix:
       Trusted Devices must not change the stable post-MFA route hydration behavior.
       After MFA/trusted-device login, ensure identity cache and navigation permissions
       are hydrated before opening a safe dashboard route, otherwise the router can show
       the temporary no-permission panel until a browser refresh. */
    if(source !== 'auth-login-mfa' && source !== 'auth-login-trusted-device') return;
    function openSafeDashboard(){
      try{
        var noPerm = document.getElementById('petatoeNoPermissionPanel');
        if(noPerm && noPerm.classList) noPerm.classList.remove('active');
      }catch(_e){}
      try{
        if(window.PETATOENavigationPermissions && typeof window.PETATOENavigationPermissions.apply === 'function') window.PETATOENavigationPermissions.apply();
      }catch(_e){}
      try{
        if(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function'){
          window.PETATOERouter.openTab('dashboard', '');
          return;
        }
      }catch(_e){}
      try{
        var dash = document.getElementById('dashboard');
        if(dash){
          Array.prototype.forEach.call(document.querySelectorAll('.panel.active'), function(p){ p.classList.remove('active'); });
          dash.classList.add('active');
        }
      }catch(_e){}
    }
    setTimeout(async function(){
      try{
        var ids = identityStore();
        if(ids && ids._cache){ ids._cache.loading = null; ids._cache.loaded = false; }
        if(ids && typeof ids.load === 'function') await ids.load();
        var fresh = findUser(user && (user.username || user.login || user.email || user.id));
        if(fresh){
          var merged = Object.assign({}, user || {}, fresh, {loginAt:(user && user.loginAt) || now(), mfaVerified:true});
          rawSet(AUTH_KEY, JSON.stringify({user:merged, createdAt:now(), version:VERSION, source:source + '-stabilized'}));
          writeCurrentUser(merged);
          updateHeader(merged);
        }
      }catch(_e){ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_e); }
      openSafeDashboard();
      setTimeout(openSafeDashboard, 450);
      setTimeout(openSafeDashboard, 1100);
    }, 80);
  }

  function openSession(user, source, options){
    options = options || {};
    user = user || {};
    user.lastLogin = now();
    /* Session open must not auto-create/update app_users. The persistent users table is modified only by explicit Settings > Users actions. */
    /* PETATOE v9.0 S4.3: keep the canonical identity fields in the session after MFA.
       Root cause: the MFA success path opened a reduced session object that dropped role_code/supabase_id/full_name.
       Navigation permissions then could not recognize SuperAdmin/role permissions and opened the no-access panel. */
    var safeUser = {
      id:user.id || user.username || '',
      supabase_id:user.supabase_id || user.row_id || '',
      row_id:user.row_id || user.supabase_id || '',
      auth_user_id:user.auth_user_id || '',
      username:user.username || user.name || user.login || '',
      login:user.login || user.username || '',
      fullName:user.fullName || user.full_name || user.username || '',
      full_name:user.full_name || user.fullName || user.username || '',
      job:user.job || user.title || '',
      email:user.email || user.mail || user.userEmail || '',
      phone:user.phone || '',
      role:user.role || user.role_code || user.userRole || 'viewer',
      role_code:user.role_code || user.role || user.userRole || 'viewer',
      status:user.status || 'active',
      loginAt:now(),
      mfaVerified: source === 'auth-login-mfa' || !!options.mfaVerified
    };
    if(options.remember) saveBrowserPasswordCredential(options.form, user.username || user.id || user.fullName, true);
    else if(options.remember === false) writeRemember('', false);
    rawSet(AUTH_KEY, JSON.stringify({user:safeUser, createdAt:now(), version:VERSION, source:source || 'auth-login'}));
    writeCurrentUser(safeUser);
    setLoggedInClass(true);
    var overlay = document.getElementById('pet-auth-overlay'); if(overlay) overlay.remove();
    updateHeader(safeUser);
    audit(source === 'auth-biometric' ? 'User Face ID Login' : 'User Login', safeUser.username || safeUser.id, 'info');
    toast(source === 'auth-biometric' ? 'تم تسجيل الدخول بالبصمة' : 'تم تسجيل الدخول: ' + (safeUser.fullName || safeUser.username || 'User'));
    try{ document.dispatchEvent(new CustomEvent('petatoe:userchanged', {detail:{user:safeUser, source:source || 'auth-login'}})); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
    try{ if(window.PETATOENavigationPermissions && window.PETATOENavigationPermissions.apply) window.PETATOENavigationPermissions.apply(); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
    stabilizePostLoginRoute(safeUser, source || 'auth-login');
    startRemoteSession(safeUser, source || 'auth-login');
    startIdleTimeout();
    if(options.enableBiometric){ setTimeout(function(){ registerBiometric(safeUser); }, 350); }
    return true;
  }

  async function login(username, password, options){
    try{
      var ids = identityStore();
      if(ids && ids._cache){ ids._cache.loading = null; ids._cache.loaded = false; }
      if(ids && typeof ids.load === 'function') await ids.load();
    }catch(_e){ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_e); }
    var user = findUser(username);
    if(!user){ renderLogin('اسم المستخدم أو كلمة المرور غير صحيحة'); return false; }
    if(!isActive(user)){ renderLogin('هذا المستخدم غير نشط أو محظور'); return false; }
    if(!verifyPassword(user, password)){ renderLogin('اسم المستخدم أو كلمة المرور غير صحيحة'); return false; }
    if((user.mustChangePassword || user.bootstrapCredential || (isBootstrapAdmin(user) && String(password) === DEFAULT_ADMIN_PASSWORD))){
      renderPasswordChange(user, 'يجب تغيير كلمة المرور الافتراضية قبل فتح النظام');
      return false;
    }
    options = options || {};
    if(isMfaRequired(user)){
      var email = userLoginEmail(user);
      if(!email){ renderLogin('هذا المستخدم يتطلب MFA ولا يوجد بريد إلكتروني مسجل له'); return false; }
      try{
        var mfaResp = await callSecurityEmail(Object.assign({action:'mfa_send_otp', username:user.username || username, email:email, purpose:'mfa_email_otp'}, trustedDevicePayload()));
        if(mfaResp && mfaResp.trusted){
          return openSession(user, 'auth-login-trusted-device', Object.assign({}, options || {}, {mfaVerified:true, trustedDevice:true}));
        }
        renderMfaChallenge(user, options, '', {success:'تم إرسال رمز MFA إلى البريد الإلكتروني المسجل'});
      }catch(err){
        renderLogin('تعذر إرسال رمز MFA: ' + String(err && err.message || err));
      }
      return false;
    }
    return openSession(user, 'auth-login', options || {});
  }
  function logout(reason){
    var user = sessionUser();
    stopIdleTimeout();
    endRemoteSession(user, reason || 'manual');
    rawRemove(AUTH_KEY);
    clearCurrentUser();
    audit('User Logout', (user && (user.username || user.id)) || reason || 'manual', 'info');
    try{ document.dispatchEvent(new CustomEvent('petatoe:userchanged', {detail:{user:null, source:'auth-logout'}})); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/auth-session.js',_);}
    renderLogin('تم تسجيل الخروج بنجاح');
  }
  async function restore(){
    ensureStyles();
    getUsers();
    var user = sessionUser();
    if(user && user.id){
      var valid=await validateSessionUser('auth-restore');
      if(valid && valid.ok){
        setLoggedInClass(true);
        var old = document.getElementById('pet-auth-overlay'); if(old) old.remove();
        try{ document.dispatchEvent(new CustomEvent('petatoe:userchanged', {detail:{user:user, source:'auth-restore'}})); }catch(_e){}
        try{ if(window.PETATOENavigationPermissions && window.PETATOENavigationPermissions.apply) window.PETATOENavigationPermissions.apply(); }catch(_e){}
        startIdleTimeout();
        return true;
      }
      return false;
    }
    clearCurrentUser();
    renderLogin('');
    return false;
  }

  window.PETATOEAuth = {__ready:true, version:VERSION, login:login, logout:logout, restore:restore, validateSession:validateSessionUser, ensureEnterpriseSession:ensureEnterpriseSession, currentUser:sessionUser, updateHeader:updateHeader, enforcePasswordChange:renderPasswordChange, registerBiometric:registerBiometric, loginWithBiometric:loginWithBiometric, listTrustedDevices:listTrustedDevices, revokeTrustedDevice:revokeTrustedDevice, listActiveSessions:listActiveSessions, revokeActiveSession:revokeActiveSession, revokeAllActiveSessions:revokeAllActiveSessions, recordActivity:recordUserActivity, listSecurityActivity:listSecurityActivity, forceRevokeUserSessions:forceRevokeUserSessions, startIdleTimeout:startIdleTimeout, stopIdleTimeout:stopIdleTimeout};
  window.petLogout = function(){ logout('manual'); };

  document.addEventListener('petatoe:users-changed', function(){ validateSessionUser('users-changed'); });
  setInterval(function(){ if(sessionUser()) validateSessionUser('session-watch'); }, 60000);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore);
  else restore();

})(window, document);
