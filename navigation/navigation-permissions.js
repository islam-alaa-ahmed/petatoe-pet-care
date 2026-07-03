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
  // PETATOE v8.0.2 Phase 15: strict user identity candidates.
  // Do not match permissions by display name/fullName, because legacy duplicated names can leak permissions.
  function userIdCandidates(u){
    u=u||currentUser();
    var out=[], seen={};
    function add(v){ v=String(v||'').trim(); var k=v.toLowerCase(); if(k&&!seen[k]){ seen[k]=1; out.push(v); } }
    add(u&&u.id); add(u&&u.userId); add(u&&u.uid); add(u&&u.supabase_id); add(u&&u.row_id);
    add(u&&u.username); add(u&&u.login); add(u&&u.email);
    try{
      var ids=window.PETATOEIdentityStore||null;
      var users=(ids&&typeof ids.usersSync==='function'&&ids.usersSync())||[];
      var keys=out.map(function(x){return String(x).trim().toLowerCase();});
      users.forEach(function(x){
        var primary=[x.id,x.userId,x.uid,x.supabase_id,x.row_id].map(function(v){return String(v||'').trim().toLowerCase();}).filter(Boolean);
        var login=[x.username,x.login,x.email].map(function(v){return String(v||'').trim().toLowerCase();}).filter(Boolean);
        var primaryHit=primary.some(function(v){return keys.indexOf(v)>-1;});
        var loginHit=login.some(function(v){return keys.indexOf(v)>-1;});
        if(primaryHit||loginHit){ add(x.id); add(x.userId); add(x.uid); add(x.supabase_id); add(x.username); add(x.login); add(x.email); }
      });
    }catch(_e){}
    return out;
  }
  function canPermission(u, screen, action){
    screen=normalizeScreen(screen); action=action||'view';
    if(!screen) return false;
    if(isSuperUser(u)) return true;
    try{
      if(window.PETATOEPermissionEngine&&typeof window.PETATOEPermissionEngine.decision==='function'){
        return !!window.PETATOEPermissionEngine.decision(u||currentUser(),screen,action).allow;
      }
      if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.can==='function'){
        return !!window.PETATOEPermissions.can(u||currentUser(), screen, action);
      }
    }catch(e){}
    return false;
  }
  function hasAnyAction(u, screen){
    screen=normalizeScreen(screen);
    if(!screen) return false;
    if(isSuperUser(u)) return true;
    try{
      if(window.PETATOEPermissionEngine&&typeof window.PETATOEPermissionEngine.canAny==='function') return !!window.PETATOEPermissionEngine.canAny(u||currentUser(),screen);
    }catch(_e){}
    return ['view','add','edit','delete'].some(function(a){ return canPermission(u, screen, a); });
  }
  function canOpen(screen){
    screen=normalizeScreen(screen);
    if(!identityReady()) return false;
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
  // PETATOE v8.0.2 Phase 16: collect permission-controlled UI targets without touching inner feature tabs.
  // Root cause: applying permissions only to #nav left header buttons and the currently active panel visible.
  function permissionButtons(root){
    root=root||document;
    var isNavRoot=(root.id==='nav')||(root.closest&&root.closest('#nav'));
    var selector=isNavRoot
      ? 'button[data-tab],button[data-settings-main],button[data-pet-nav-screen],button[data-pet-permission-screen]'
      : '#nav button[data-tab],#nav button[data-settings-main],#nav button[data-pet-nav-screen],#nav button[data-pet-permission-screen],[data-pet-permission-screen],[data-pet-nav-screen],[data-settings-main]';
    return Array.prototype.slice.call(root.querySelectorAll(selector)).filter(function(el){
      if(!el) return false;
      if(!isNavRoot && el.closest && el.closest('#nav')) return true;
      if(el.hasAttribute&&el.hasAttribute('data-pet-permission-screen')) return true;
      if(el.hasAttribute&&el.hasAttribute('data-pet-nav-screen')) return true;
      if(el.hasAttribute&&el.hasAttribute('data-settings-main')) return true;
      return false;
    });
  }
  function syncGroups(root){
    Array.prototype.forEach.call((root||document).querySelectorAll('.pet-v142-group'),function(g){
      var visible=Array.prototype.some.call(g.querySelectorAll('.pet-v142-items button'),function(b){return b.style.display!=='none';});
      if(visible) showElement(g); else hideElement(g);
    });
  }
  function applyPendingVisibility(root){
    root=root||document; if(!root) return;
    var u=currentUser();
    if(isSuperUser(u)) return;
    permissionButtons(root).forEach(function(btn){ hideElement(btn); });
    syncGroups(root);
    enforceActivePanelPermission(u);
  }

  function panelScreen(panelId){
    panelId=String(panelId||'');
    var map={
      dashboard:'dashboardManagement', dashboardManagement:'dashboardManagement', dashboardOperations:'dashboardOperations',
      appointments:'appointments', vehicleOperations:'vehicleOperations', vehicleOperationsReports:'vehicleOperationsReports', operationKpis:'operationKpis',
      smart:'reports', executive:'reports', records:'reports', logs:'audit', entry:'sales', import:'sales', sales:'sales',
      customer360:'customers', services:'services', vans:'vehicles', warehouses:'vehicles', fleet:'vehicles',
      treasury:'treasury', obligations:'obligations', payroll:'payroll', salarySlip:'salarySlip', commissionStatement:'commissionStatement',
      childrenExpenses:'childrenExpenses', settings:'settings'
    };
    return normalizeScreen(map[panelId]||panelId);
  }
  function ensureNoAccessPanel(){
    var p=document.getElementById('petatoeNoPermissionPanel');
    if(p) return p;
    p=document.createElement('div');
    p.id='petatoeNoPermissionPanel';
    p.className='panel';
    p.setAttribute('data-pet-system-panel','no-permission');
    p.innerHTML='<div class="card" style="margin:24px"><h2>غير متاح للصلاحية الحالية</h2><p>لا توجد شاشة مصرح بها لهذا المستخدم. راجع صلاحيات المستخدم من حساب Super Admin.</p></div>';
    var main=document.querySelector('main.main')||document.querySelector('.main')||document.body;
    main.appendChild(p);
    return p;
  }
  function openFirstAllowedPanel(u){
    var btns=permissionButtons(document).filter(function(b){
      return b.style.display!=='none' && !(b.classList&&b.classList.contains('pet-nav-hidden-by-permission')) && screenFromButton(b) && hasAnyAction(u,screenFromButton(b));
    });
    for(var i=0;i<btns.length;i++){
      var tab=btns[i].getAttribute('data-tab');
      if(tab && document.getElementById(tab)){ try{btns[i].click(); return true;}catch(_e){} }
    }
    return false;
  }
  function enforceActivePanelPermission(u){
    u=u||currentUser();
    if(isSuperUser(u)) return;
    var active=document.querySelector('.panel.active');
    if(!active) return;
    var screen=panelScreen(active.id);
    if(screen && hasAnyAction(u,screen)) return;
    if(openFirstAllowedPanel(u)) return;
    Array.prototype.forEach.call(document.querySelectorAll('.panel.active'),function(p){p.classList.remove('active')});
    ensureNoAccessPanel().classList.add('active');
  }

  // PETATOE v8.0.2 Phase 3: defer menu permission filtering until the Supabase identity cache is actually ready.
  // Root cause: permissionsSync() starts async load and returns an empty cache on first boot, so early apply() hides items progressively.
  var deferredApplyTimer = null;
  var deferredApplyAttempts = 0;
  function identityReady(){
    try{
      var ids = window.PETATOEIdentityStore;
      if(!ids) return true;
      var c = ids._cache || null;
      if(c && c.loaded === true) return true;
      if(c && c.loading) return false;
      if(typeof ids.load === 'function') ids.load();
      return !!(c && c.loaded === true);
    }catch(_e){ return true; }
  }
  function scheduleApply(root){
    if(deferredApplyTimer) return;
    deferredApplyTimer = setTimeout(function(){
      deferredApplyTimer = null;
      deferredApplyAttempts += 1;
      if(deferredApplyAttempts <= 20) apply(root);
    }, 250);
  }
  function apply(root){
    root=root||document; if(!root) return;
    if(!identityReady()){
      // PETATOE v8.0.2 Phase 10: fail closed while permissions are loading.
      // Root cause regression: Phase 7 builds the full menu DOM first; returning here left unauthorized screens visible until a later refresh/apply.
      applyPendingVisibility(root);
      scheduleApply(root);
      return;
    }
    deferredApplyAttempts = 0;
    var u=currentUser();
    permissionButtons(root).forEach(function(btn){
      var screen=screenFromButton(btn);
      var allowed=screen?hasAnyAction(u, screen):true;
      if(allowed) showElement(btn); else hideElement(btn);
    });
    syncGroups(root);
    enforceActivePanelPermission(u);
    // PETATOE v8.0.2 Phase 9: notify the canonical navigation after permission visibility changes
    // so active state is recalculated against visible/authorized buttons only.
    try{ document.dispatchEvent(new CustomEvent('petatoe:navigationpermissionsapplied',{detail:{root:root}})); }catch(_e){}
  }
  function guardClick(btn){
    var screen=screenFromButton(btn);
    if(!screen) return true;
    if(canOpen(screen)) return true;
    notify('غير متاح للصلاحية الحالية');
    return false;
  }
  window.PETATOENavigationPermissions={currentUser:currentUser,isSuperUser:isSuperUser,normalizeScreen:normalizeScreen,canOpen:canOpen,hasAnyAction:hasAnyAction,apply:apply,guardClick:guardClick,__v:'erp-strict-supabase-phase18-engine'};
  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest&&e.target.closest('[data-pet-permission-screen],[data-pet-nav-screen],[data-settings-main]');
    if(!el) return;
    if(el.closest&&el.closest('#nav')) return;
    if(!guardClick(el)){ e.preventDefault(); e.stopPropagation(); return false; }
  },true);
  try{ document.dispatchEvent(new CustomEvent('petatoe:navigationpermissionsready',{detail:{version:'v8.0.2-phase18'}})); }catch(_e){}
  document.addEventListener('petatoe:navbuilt',function(e){ apply(e.detail&&e.detail.nav); });
  document.addEventListener('petatoe:permissionschanged',function(){ apply(); });
  document.addEventListener('petatoe:userchanged',function(){ apply(); });
  window.addEventListener('petatoe:identity-ready',function(){ apply(); });
})();
