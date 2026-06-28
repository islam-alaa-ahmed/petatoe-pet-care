/* PETATOE Enterprise Security Hardening v6.4.69
   Scope: safe runtime hardening only.
   - Does not change Router, Navigation, Storage, calculations, or module behavior.
   - Adds passive security guards and audit helpers.
*/
(function(w, d){
  'use strict';

  if(w.PETATOEEnterpriseSecurity && w.PETATOEEnterpriseSecurity.__v6469){ return; }

  var VERSION = '6.4.69';
  var state = {
    startedAt: new Date().toISOString(),
    linkHardeningRuns: 0,
    blockedUnsafeNavigations: 0,
    sessionMarkerCreated: false,
    lastAudit: null
  };

  function toText(value){
    return String(value == null ? '' : value);
  }

  function normalizeUrl(value){
    return toText(value).replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
  }

  function isUnsafeNavigationUrl(value){
    var v = normalizeUrl(value);
    if(!v){ return false; }
    return /^(javascript|vbscript|data):/.test(v) && !/^data:image\//.test(v);
  }

  function hardenExternalLinks(root){
    root = root || d;
    var links = root.querySelectorAll ? root.querySelectorAll('a[target="_blank"]') : [];
    Array.prototype.forEach.call(links, function(anchor){
      var rel = (anchor.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if(rel.indexOf('noopener') === -1){ rel.push('noopener'); }
      if(rel.indexOf('noreferrer') === -1){ rel.push('noreferrer'); }
      anchor.setAttribute('rel', rel.join(' '));
    });
    state.linkHardeningRuns += 1;
    return links.length;
  }

  function installNavigationGuard(){
    if(d.__petatoeEnterpriseNavigationGuard){ return; }
    d.__petatoeEnterpriseNavigationGuard = true;
    d.addEventListener('click', function(event){
      var target = event.target;
      var anchor = target && target.closest ? target.closest('a[href]') : null;
      if(!anchor){ return; }
      var href = anchor.getAttribute('href') || '';
      if(isUnsafeNavigationUrl(href)){
        event.preventDefault();
        event.stopPropagation();
        state.blockedUnsafeNavigations += 1;
        if(w.console && console.warn){
          console.warn('[PETATOE Security] Blocked unsafe navigation URL:', href);
        }
      }
    }, true);
  }

  function installMutationHardener(){
    if(w.__petatoeEnterpriseMutationHardener || !w.MutationObserver){ return; }
    w.__petatoeEnterpriseMutationHardener = true;
    var pending = false;
    var observer = new MutationObserver(function(){
      if(pending){ return; }
      pending = true;
      w.setTimeout(function(){
        pending = false;
        hardenExternalLinks(d);
      }, 250);
    });
    if(d.documentElement){
      observer.observe(d.documentElement, { childList: true, subtree: true });
    }
  }

  function ensureSessionMarker(){
    try{
      if(!w.sessionStorage){ return null; }
      var key = 'petatoeEnterpriseSessionMarker';
      var current = w.sessionStorage.getItem(key);
      if(!current){
        current = 'pet-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        w.sessionStorage.setItem(key, current);
        state.sessionMarkerCreated = true;
      }
      return current;
    }catch(e){
      return null;
    }
  }

  function auditCspReadiness(){
    var scripts = Array.prototype.slice.call(d.scripts || []);
    var inlineScripts = scripts.filter(function(script){ return !script.src && toText(script.textContent).trim(); }).length;
    var externalHosts = scripts.filter(function(script){ return !!script.src; }).map(function(script){
      try{ return new URL(script.src, d.baseURI).host; }catch(e){ return 'unknown'; }
    }).filter(function(host, index, arr){ return arr.indexOf(host) === index; });

    var inlineEventHandlers = 0;
    try{
      inlineEventHandlers = d.querySelectorAll('[onclick],[onchange],[oninput],[onsubmit],[onload],[onerror]').length;
    }catch(e){
      inlineEventHandlers = -1;
    }

    var report = {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      inlineScripts: inlineScripts,
      externalScriptHosts: externalHosts,
      inlineEventHandlers: inlineEventHandlers,
      cspMode: 'readiness-only',
      recommendation: inlineScripts > 0 ? 'Do not enforce strict CSP until inline scripts are fully externalized or nonce-based.' : 'Ready for stricter CSP pilot.'
    };
    state.lastAudit = report;
    return report;
  }

  function status(){
    return {
      version: VERSION,
      active: true,
      startedAt: state.startedAt,
      linkHardeningRuns: state.linkHardeningRuns,
      blockedUnsafeNavigations: state.blockedUnsafeNavigations,
      sessionMarkerPresent: !!ensureSessionMarker(),
      sessionMarkerCreated: state.sessionMarkerCreated,
      lastAudit: state.lastAudit
    };
  }

  function boot(){
    ensureSessionMarker();
    installNavigationGuard();
    hardenExternalLinks(d);
    installMutationHardener();
    auditCspReadiness();
  }

  w.PETATOEEnterpriseSecurity = {
    __v6469: true,
    status: status,
    auditCspReadiness: auditCspReadiness,
    hardenExternalLinks: hardenExternalLinks,
    isUnsafeNavigationUrl: isUnsafeNavigationUrl
  };

  if(d.readyState === 'loading'){
    d.addEventListener('DOMContentLoaded', boot, { once: true });
  }else{
    boot();
  }
})(window, document);
