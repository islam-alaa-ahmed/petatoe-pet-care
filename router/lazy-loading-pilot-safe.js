/* PETATOE v6.4.3 Phase R4 - Lazy Loading Pilot (Safe Probe)
 * Purpose: prove a lazy-loading mechanism with a harmless probe script only.
 * Safety rules:
 * - Does NOT defer or remove any existing eager script.
 * - Does NOT lazy-load Warehouse/Treasury/Payroll/Operations.
 * - Does NOT replace router, loader, navigation, permissions, or storage.
 * - Does NOT write application data or mutate business DOM.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.3-r4-lazy-loading-pilot-safe';
  var loaded = Object.create(null);
  var state = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    pilotEnabled: true,
    pilotScript: 'router/lazy-pilot-probe.js',
    pilotRequested: false,
    pilotLoaded: false,
    pilotFailed: false,
    lastError: ''
  };

  function warnSilent(err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('lazy-loading-pilot-safe.js', err);
      }
    }catch(_ignore){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('router/lazy-loading-pilot-safe.js',_ignore,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('router/lazy-loading-pilot-safe.js',_petatoeSilentCatch);}}
  }

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalizeScript(src){
    return String(src || '').trim();
  }

  function loadScriptOnce(src){
    src = normalizeScript(src);
    if(!src){ return Promise.reject(new Error('Missing script src')); }
    if(loaded[src]){ return loaded[src]; }

    loaded[src] = new Promise(function(resolve, reject){
      try{
        var existing = document.querySelector('script[data-pet-lazy-src="' + src.replace(/"/g, '&quot;') + '"]');
        if(existing){ resolve({ src: src, reused: true }); return; }
        var script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.setAttribute('data-pet-lazy-src', src);
        script.onload = function(){ resolve({ src: src, loaded: true }); };
        script.onerror = function(){ reject(new Error('Failed to lazy-load ' + src)); };
        document.head.appendChild(script);
      }catch(err){ reject(err); }
    });

    return loaded[src];
  }

  function runPilotProbe(){
    if(state.pilotRequested) return;
    state.pilotRequested = true;
    loadScriptOnce(state.pilotScript).then(function(){
      state.pilotLoaded = true;
    }).catch(function(err){
      state.pilotFailed = true;
      state.lastError = String(err && err.message || err || 'unknown error');
      warnSilent(err);
    });
  }

  function schedulePilot(){
    try{
      if(typeof window.requestIdleCallback === 'function'){
        window.requestIdleCallback(runPilotProbe, { timeout: 2500 });
      }else{
        window.setTimeout(runPilotProbe, 1500);
      }
    }catch(err){ warnSilent(err); }
  }

  if(document.readyState === 'complete'){
    schedulePilot();
  }else if(window && typeof window.addEventListener === 'function'){
    window.addEventListener('load', schedulePilot, { once: true });
  }

  var api = Object.freeze({
    version: VERSION,
    loadScriptOnce: loadScriptOnce,
    runPilotProbe: runPilotProbe,
    snapshot: function(){ return clone(state); }
  });

  window.PETATOELazyLoadingPilotSafe = api;
})();
