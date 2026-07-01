/* PETATOE v6.4.46 - PHASE 2 Session Timeout
   Safe client-side idle guard. Does not change Router, Navigation, Storage adapter, or business data. */
(function(window, document){
  'use strict';

  if(window.PETATOESessionTimeout && window.PETATOESessionTimeout.__ready){ return; }

  var VERSION = '6.4.46';
  var IDLE_LIMIT_MS = 30 * 60 * 1000;
  var WARNING_MS = 60 * 1000;
  var CHECK_MS = 1000;
  var lastActivity = Date.now();
  var warningVisible = false;
  var loggedOut = false;
  var timer = null;

  function hasActiveUser(){
    try{
      if(window.PETATOEAuth && typeof window.PETATOEAuth.currentUser === 'function' && window.PETATOEAuth.currentUser()) return true;
      if(window.__PETATOE_ACTIVE_USER__ || window.currentUser) return true;
      return !!(window.sessionStorage && window.sessionStorage.getItem('petatoe_auth_session_v668'));
    }catch(e){ return false; }
  }

  function resetActivity(){
    if(loggedOut) return;
    lastActivity = Date.now();
    if(warningVisible) hideWarning();
  }

  function ensureStyles(){
    if(document.getElementById('pet-session-timeout-style')) return;
    var style = document.createElement('style');
    style.id = 'pet-session-timeout-style';
    style.textContent = [
      '.pet-session-timeout-overlay{position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.72);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:18px;direction:rtl}',
      '.pet-session-timeout-card{width:min(460px,100%);border-radius:24px;border:1px solid rgba(255,211,67,.38);background:linear-gradient(135deg,rgba(15,23,42,.96),rgba(30,41,59,.92));box-shadow:0 24px 90px rgba(0,0,0,.45);color:#fff;padding:24px;text-align:right;font-family:Cairo,system-ui,sans-serif}',
      '.pet-session-timeout-card h3{margin:0 0 10px;font-size:20px;font-weight:900}',
      '.pet-session-timeout-card p{margin:0 0 18px;color:rgba(226,232,240,.9);line-height:1.8;font-size:14px}',
      '.pet-session-timeout-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start}',
      '.pet-session-timeout-actions button{border:0;border-radius:999px;padding:12px 18px;font-family:Cairo,system-ui,sans-serif;font-weight:900;cursor:pointer}',
      '.pet-session-continue{background:linear-gradient(135deg,#22c55e,#14b8a6);color:#04111d}',
      '.pet-session-logout{background:rgba(148,163,184,.18);color:#fff;border:1px solid rgba(148,163,184,.28)!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function showWarning(remainingMs){
    if(warningVisible || loggedOut || !hasActiveUser()) return;
    ensureStyles();
    warningVisible = true;
    var existing = document.getElementById('pet-session-timeout-overlay');
    if(existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'pet-session-timeout-overlay';
    overlay.className = 'pet-session-timeout-overlay';
    setSessionTimeoutHTML(overlay, '<div class="pet-session-timeout-card" role="dialog" aria-modal="true" aria-labelledby="petSessionTimeoutTitle">' +
      '<h3 id="petSessionTimeoutTitle">تنبيه انتهاء الجلسة</h3>' +
      '<p>لم يتم تسجيل أي نشاط لفترة طويلة. سيتم تسجيل الخروج تلقائياً خلال أقل من دقيقة لحماية بيانات النظام.</p>' +
      '<div class="pet-session-timeout-actions">' +
      '<button type="button" class="pet-session-continue" data-pet-session="continue">متابعة الجلسة</button>' +
      '<button type="button" class="pet-session-logout" data-pet-session="logout">تسجيل الخروج الآن</button>' +
      '</div></div>', 'session timeout overlay');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){
      var action = e.target && e.target.getAttribute ? e.target.getAttribute('data-pet-session') : '';
      if(action === 'continue') resetActivity();
      if(action === 'logout') logout('manual');
    });
  }

  function hideWarning(){
    warningVisible = false;
    var overlay = document.getElementById('pet-session-timeout-overlay');
    if(overlay) overlay.remove();
  }

  function logout(reason){
    if(loggedOut) return;
    loggedOut = true;
    hideWarning();
    try{ if(window.PETATOEAuth && typeof window.PETATOEAuth.logout === 'function'){ window.PETATOEAuth.logout(reason||'idle'); return; } }catch(e){}
    try{ if(window.sessionStorage){ window.sessionStorage.removeItem('petatoe_auth_session_v668'); window.sessionStorage.removeItem('currentUser'); } }catch(e){}
    try{ window.currentUser = null; window.__PETATOE_ACTIVE_USER__ = null; }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('security/session-timeout.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{
      if(window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.audit === 'function'){
        window.__PETATOE_SETTINGS_API__.audit('Session Timeout', reason === 'manual' ? 'Manual logout from timeout warning' : 'Idle timeout auto logout', 'warn');
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('security/session-timeout.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    setTimeout(function(){ try{ window.location.reload(); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('security/session-timeout.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } } }, 80);
  }

  function check(){
    if(loggedOut) return;
    if(!hasActiveUser()){
      lastActivity = Date.now();
      if(warningVisible) hideWarning();
      return;
    }
    var idle = Date.now() - lastActivity;
    if(idle >= IDLE_LIMIT_MS){ logout('idle'); return; }
    if(idle >= (IDLE_LIMIT_MS - WARNING_MS)){ showWarning(IDLE_LIMIT_MS - idle); }
  }

  function bindActivity(){
    ['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(function(evt){
      try{ document.addEventListener(evt, resetActivity, {passive:true, capture:true}); }catch(e){ document.addEventListener(evt, resetActivity, true); }
    });
  }

  function start(){
    if(timer) return;
    bindActivity();
    timer = setInterval(check, CHECK_MS);
  }

  window.PETATOESessionTimeout = {
    __ready: true,
    version: VERSION,
    start: start,
    reset: resetActivity,
    logout: logout,
    hasActiveUser: hasActiveUser,
    config: {idleLimitMs: IDLE_LIMIT_MS, warningMs: WARNING_MS}
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);
  function setSessionTimeoutHTML(target, html, reason) {
    try {
      if (window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function') {
        return window.PETATOESafeRender.htmlTrusted(target, String(html == null ? '' : html), reason || 'session-timeout trusted static template');
      }
    } catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('security/session-timeout.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    target.textContent = '';
    target.insertAdjacentHTML('beforeend', String(html == null ? '' : html));
    return true;
  }


