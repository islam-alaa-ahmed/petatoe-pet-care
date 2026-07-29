/* PETATOE v10.0.25 SR3 — Smart Reports runtime provider registration recovery.
 * Ensures the canonical Smart Services and Smart Tabs providers are actually
 * registered before the lifecycle controller evaluates the runtime contract.
 * No report calculations, data queries, or rendering rules are changed here.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_RUNTIME_REGISTRATION_SR3__) return;
  window.__PETATOE_SMART_RUNTIME_REGISTRATION_SR3__ = true;

  var BUILD = '10.0.25-smart-reports-sr3-registration';
  var activePromise = null;
  var attempts = 0;
  var lastError = '';
  var loaded = Object.create(null);

  function servicesReady(){
    var api = window.PETATOESmartServices;
    return !!(api && api.__ready && typeof api.scopedData === 'function') &&
      typeof window.smartServicesScopedData === 'function';
  }

  function tabsReady(){
    var api = window.PETATOESmartTabs || (window.PETATOE && window.PETATOE.SmartReports);
    return !!(api && api.__ready && typeof api.setSmartTab === 'function') &&
      typeof window.setSmartTab === 'function';
  }

  function snapshot(){
    return {
      build: BUILD,
      attempts: attempts,
      active: !!activePromise,
      services: servicesReady(),
      tabs: tabsReady(),
      legacyServices: typeof window.smartServicesScopedData === 'function',
      setSmartTab: typeof window.setSmartTab === 'function',
      lastError: lastError,
      loaded: Object.keys(loaded)
    };
  }

  function scriptUrl(path){
    var separator = path.indexOf('?') >= 0 ? '&' : '?';
    return path + separator + 'v=' + encodeURIComponent(BUILD) + '&attempt=' + attempts;
  }

  function loadFresh(path, key){
    return new Promise(function(resolve, reject){
      var node = document.createElement('script');
      node.src = scriptUrl(path);
      node.async = false;
      node.dataset.petatoeSmartRuntimeRecovery = key;
      node.onload = function(){ loaded[key] = true; resolve(true); };
      node.onerror = function(){ reject(new Error('Unable to load Smart Reports provider: ' + path)); };
      (document.head || document.documentElement).appendChild(node);
    });
  }

  function waitUntilReady(timeoutMs){
    timeoutMs = Math.max(250, Number(timeoutMs || 3000));
    if(servicesReady() && tabsReady()) return Promise.resolve(true);
    return new Promise(function(resolve){
      var deadline = Date.now() + timeoutMs;
      (function check(){
        if(servicesReady() && tabsReady()) return resolve(true);
        if(Date.now() >= deadline) return resolve(false);
        window.setTimeout(check, 25);
      })();
    });
  }

  function ensure(){
    if(servicesReady() && tabsReady()) return Promise.resolve(true);
    if(activePromise) return activePromise;

    attempts += 1;
    lastError = '';
    activePromise = Promise.resolve()
      .then(function(){
        return servicesReady() ? true : loadFresh('smart/smart-services.js', 'services');
      })
      .then(function(){
        return tabsReady() ? true : loadFresh('smart/smart-tabs.js', 'tabs');
      })
      .then(function(){ return waitUntilReady(3000); })
      .then(function(ready){
        if(!ready) throw new Error('Smart Reports providers did not register: ' + JSON.stringify(snapshot()));
        try{
          window.dispatchEvent(new CustomEvent('petatoe:smart-runtime-registered', {detail:snapshot()}));
        }catch(_e){}
        return true;
      })
      .catch(function(error){
        lastError = String(error && error.message || error);
        try{ console.error('[PETATOE Smart] provider registration recovery failed', error); }catch(_e){}
        return false;
      })
      .finally(function(){ activePromise = null; });

    return activePromise;
  }

  window.PETATOESmartRuntimeRegistration = Object.freeze({
    __ready: true,
    version: BUILD,
    ensure: ensure,
    getStatus: snapshot
  });
})();
