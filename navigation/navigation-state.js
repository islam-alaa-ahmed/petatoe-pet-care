/* PETATOE v8.0.2 Phase 27: Navigation State Manager
 * Purpose: restore the same screen/sub-screen after browser refresh.
 * Safety:
 * - Does not change permissions.
 * - Does not open unauthorized screens.
 * - Clears state on logout/user switch.
 */
(function(){
  'use strict';
  if(window.__PETATOE_NAV_STATE_MANAGER_V802_PHASE27__) return;
  window.__PETATOE_NAV_STATE_MANAGER_V802_PHASE27__ = true;

  var STORAGE_KEY = 'PETATOE_NAV_STATE_V802';
  var RESTORE_FLAG = false;
  var RESTORE_DONE = false;
  var SAVE_TIMER = null;
  var RESTORE_TIMER = null;

  function q(sel, root){ try{return (root||document).querySelector(sel);}catch(_){return null;} }
  function clean(v){ return String(v == null ? '' : v).trim(); }

  function currentUser(){
    try{ if(window.PETATOEAuth && typeof window.PETATOEAuth.currentUser === 'function') return window.PETATOEAuth.currentUser() || null; }catch(_e){}
    try{ if(window.PETATOEIdentityStore && typeof window.PETATOEIdentityStore.currentUser === 'function') return window.PETATOEIdentityStore.currentUser() || null; }catch(_e){}
    try{ return window.currentUser || null; }catch(_e){ return null; }
  }

  function userKey(user){
    user = user || currentUser() || {};
    return clean(user.id || user.userId || user.uid || user.supabase_id || user.username || user.login || user.email || '');
  }

  function activePanel(){
    var p = q('.panel.active');
    return clean(p && p.id) || '';
  }

  function activeAttr(selector, attr){
    var el = q(selector);
    return clean(el && el.getAttribute(attr));
  }

  function normalizeScreen(screen){
    try{
      if(window.PETATOENavigationPermissions && typeof window.PETATOENavigationPermissions.normalizeScreen === 'function'){
        return window.PETATOENavigationPermissions.normalizeScreen(screen || '');
      }
    }catch(_e){}
    return clean(screen);
  }

  function screenForPanel(panel){
    panel = clean(panel);
    var btn = q('#nav button[data-tab="'+panel.replace(/"/g,'\\"')+'"]');
    return normalizeScreen((btn && (btn.getAttribute('data-pet-nav-screen') || btn.getAttribute('data-pet-permission-screen'))) || panel);
  }

  function canOpenPanel(panel){
    if(!panel || panel === 'dashboard') return true;
    try{
      var P = window.PETATOENavigationPermissions;
      if(P && typeof P.canOpen === 'function') return !!P.canOpen(screenForPanel(panel));
    }catch(_e){ return false; }
    return true;
  }

  function collectState(reason){
    var panel = activePanel() || (window.PETATOERouter && window.PETATOERouter.current) || 'dashboard';
    var state = {
      version: 1,
      reason: clean(reason || 'auto'),
      savedAt: Date.now(),
      userKey: userKey(),
      panel: clean(panel),
      smartOpen: clean(window.PETATOERouter && window.PETATOERouter.currentSmart),
      settingsMain: clean(window.__PETATOE_SETTINGS_MAIN__ || activeAttr('#settings [data-pet-v110-main].active','data-pet-v110-main')),
      settingsSub: clean(window.__PETATOE_SETTINGS_SUB__ || activeAttr('#settings [data-pet-v110-sub].active','data-pet-v110-sub')),
      appointmentsTab: activeAttr('#appointments [data-appointment-tab].active','data-appointment-tab'),
      treasuryTab: activeAttr('#treasury [data-tr-tab].active','data-tr-tab'),
      smartTab: activeAttr('#smartTabs [data-smart-tab].active, [data-smart-tab].active','data-smart-tab'),
      customerAnalysisTab: activeAttr('[data-customer-analysis-tab].active','data-customer-analysis-tab'),
      vehicleOpsViewTab: activeAttr('#vehicleOperations [data-op-click="setVehicleOpsViewTab"].active','data-op-arg1')
    };
    return state;
  }

  function save(reason){
    if(RESTORE_FLAG) return;
    try{
      var state = collectState(reason || 'auto');
      if(!state.panel) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){ try{ console.warn('[PETATOE] nav state save skipped', e); }catch(_e){} }
  }

  function scheduleSave(reason, delay){
    if(SAVE_TIMER) clearTimeout(SAVE_TIMER);
    SAVE_TIMER = setTimeout(function(){ SAVE_TIMER = null; save(reason); }, delay == null ? 80 : delay);
  }

  function loadState(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      var s = JSON.parse(raw);
      if(!s || !s.panel) return null;
      return s;
    }catch(_e){ return null; }
  }

  function clear(){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(_e){}
  }

  function injectRestoreHoldStyle(){
    try{
      if(document.getElementById('petatoeNavRestoreHoldStyle')) return;
      var st=document.createElement('style');
      st.id='petatoeNavRestoreHoldStyle';
      st.textContent='body.pet-nav-restore-hold .panel.active{visibility:hidden!important}';
      (document.head||document.documentElement).appendChild(st);
    }catch(_e){}
  }
  function releaseRestoreHold(){
    try{ if(document.body) document.body.classList.remove('pet-nav-restore-hold'); }catch(_e){}
  }
  function applyInitialRestoreHold(){
    try{
      var s=loadState();
      if(s && s.panel && s.panel !== 'dashboard' && document.body){
        injectRestoreHoldStyle();
        document.body.classList.add('pet-nav-restore-hold');
        setTimeout(releaseRestoreHold,2600);
      }
    }catch(_e){}
  }

  function openSettingsState(s){
    try{ window.__PETATOE_SETTINGS_MAIN__ = s.settingsMain || 'system'; window.__PETATOE_SETTINGS_SUB__ = s.settingsSub || ''; }catch(_e){}
    try{ if(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function') window.PETATOERouter.openTab('settings'); }catch(_e){}
    setTimeout(function(){
      try{ document.dispatchEvent(new CustomEvent('petatoe:settingsnavigate', {detail:{main:s.settingsMain || 'system', sub:s.settingsSub || '', source:'navigation-state-restore'}})); }catch(_e){}
    }, 180);
  }

  function restoreInnerState(s){
    setTimeout(function(){
      try{
        if(s.panel === 'appointments' && s.appointmentsTab){
          if(window.PETATOEAppointments && typeof window.PETATOEAppointments.setTab === 'function') window.PETATOEAppointments.setTab(s.appointmentsTab);
          else if(window.__PETATOEAppointmentsLegacyEngine && typeof window.__PETATOEAppointmentsLegacyEngine.setTab === 'function') window.__PETATOEAppointmentsLegacyEngine.setTab(s.appointmentsTab);
          else if(window.PETATOEOperationsAppointmentsInternal && typeof window.PETATOEOperationsAppointmentsInternal.setTab === 'function') window.PETATOEOperationsAppointmentsInternal.setTab(s.appointmentsTab);
        }
      }catch(e){ try{console.warn('[PETATOE] appointment state restore skipped', e);}catch(_e){} }
      try{
        if(s.panel === 'treasury' && s.treasuryTab && window.PETATOETreasuryTabsV82 && typeof window.PETATOETreasuryTabsV82.open === 'function'){
          window.PETATOETreasuryTabsV82.open(s.treasuryTab);
        }
      }catch(e){ try{console.warn('[PETATOE] treasury state restore skipped', e);}catch(_e){} }
      try{
        if(s.panel === 'smart' && s.smartTab && typeof window.setSmartTab === 'function') window.setSmartTab(s.smartTab);
      }catch(e){ try{console.warn('[PETATOE] smart state restore skipped', e);}catch(_e){} }
      scheduleSave('restore-complete', 400);
    }, 420);
  }

  function restoreNow(){
    if(RESTORE_DONE) return false;
    var s = loadState();
    if(!s || !s.panel){ releaseRestoreHold(); return false; }
    var uk = userKey();
    if(s.userKey && uk && s.userKey !== uk){ clear(); return false; }
    if(!canOpenPanel(s.panel)){ releaseRestoreHold(); return false; }

    RESTORE_DONE = true;
    RESTORE_FLAG = true;
    try{
      if(s.panel === 'settings') openSettingsState(s);
      else if(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function') window.PETATOERouter.openTab(s.panel, s.smartOpen || '');
      else if(window.tab) window.tab(s.panel);
      restoreInnerState(s);
    }catch(e){
      RESTORE_DONE = false;
      try{ console.warn('[PETATOE] nav state restore skipped', e); }catch(_e){}
    }finally{
      setTimeout(function(){ RESTORE_FLAG = false; releaseRestoreHold(); }, 1200);
    }
    return true;
  }

  function scheduleRestore(delay){
    if(RESTORE_DONE) return;
    if(RESTORE_TIMER) clearTimeout(RESTORE_TIMER);
    RESTORE_TIMER = setTimeout(function(){
      RESTORE_TIMER = null;
      if(restoreNow()) return;
      setTimeout(restoreNow, 700);
      setTimeout(restoreNow, 1500);
    }, delay == null ? 250 : delay);
  }

  applyInitialRestoreHold();

  document.addEventListener('petatoe:tabchange', function(){ scheduleSave('tabchange', 120); });
  document.addEventListener('petatoe:settingsnavigate', function(){ scheduleSave('settingsnavigate', 160); });
  document.addEventListener('petatoe:navigationpermissionsready', function(){ scheduleRestore(300); });
  document.addEventListener('petatoe:navigationpermissionsapplied', function(){ scheduleRestore(250); scheduleSave('permissions-applied', 600); });
  window.addEventListener('petatoe:identity-ready', function(){ scheduleRestore(350); });
  document.addEventListener('petatoe:userchanged', function(){ clear(); scheduleSave('userchanged', 300); });
  window.addEventListener('beforeunload', function(){ save('beforeunload'); });

  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest && e.target.closest('[data-tab],[data-settings-main],[data-appointment-tab],[data-tr-tab],[data-tr-open-tab],[data-smart-tab],[data-customer-analysis-tab],[data-op-click="setVehicleOpsViewTab"]');
    if(el) scheduleSave('ui-click', 220);
  }, true);
  document.addEventListener('change', function(e){
    var id = e.target && e.target.id;
    if(id && /^(tr|appointment|record|import|smart|filter|vehicle)/i.test(id)) scheduleSave('ui-change', 180);
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ scheduleRestore(600); });
  else scheduleRestore(600);
  window.addEventListener('load', function(){ scheduleRestore(500); }, {once:true});

  window.PETATOENavigationState = {save:save, restore:restoreNow, clear:clear, current:collectState, storageKey:STORAGE_KEY};
})();
