/* PETATOE Phase 15 — Security & Offline Runtime Contract (diagnostics only). */
(function(window, document){
  'use strict';
  if(window.PETATOESecurityOfflineContract && window.PETATOESecurityOfflineContract.__ready) return;

  var OWNER = 'security/security-offline-contract.js';
  var CONTRACT = '10.0.25-phase15-security-offline-contract-1';
  var FORBIDDEN_SESSION_FIELDS = ['password','passwordHash','password_hash','salt','credential','secret','serviceRoleKey'];

  function manifest(){ return window.PETATOEVersionManifest || {}; }
  function safeSessionShape(value){
    var user = value && value.user && typeof value.user === 'object' ? value.user : {};
    var forbidden = FORBIDDEN_SESSION_FIELDS.filter(function(key){ return Object.prototype.hasOwnProperty.call(user,key); });
    return { safe: forbidden.length === 0, forbiddenFields: forbidden };
  }
  function snapshot(){
    var nav = window.navigator || {};
    var version = manifest();
    return Object.freeze({
      owner: OWNER,
      contractVersion: CONTRACT,
      releaseVersion: version.releaseVersion || '',
      cacheVersion: version.cacheVersion || '',
      secureContext: window.isSecureContext !== false,
      serviceWorkerSupported: !!(nav.serviceWorker),
      credentialsApiSupported: !!(nav.credentials),
      webAuthnSupported: !!window.PublicKeyCredential,
      authSessionStorage: 'sessionStorage + bounded PWA continuity record',
      crossOriginResponsesCachedByPetatoeSW: false,
      offlineFontPolicy: 'Cairo when available; system-ui/Arial fallback offline'
    });
  }

  window.PETATOESecurityOfflineContract = Object.freeze({
    __ready: true,
    __owner: OWNER,
    contractVersion: CONTRACT,
    snapshot: snapshot,
    validateSessionShape: safeSessionShape
  });

  try{ document.dispatchEvent(new CustomEvent('petatoe:security-offline-contract-ready',{detail:snapshot()})); }catch(_e){}
})(window, document);
