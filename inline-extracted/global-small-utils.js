// PETATOE v6.1.29: shared tiny utilities with legacy global compatibility.
// Keep window.byId/window.clamp for older modules, but avoid redeclaring global functions
// or overriding any existing implementation loaded before this file.
(function(w){
  'use strict';

  var utils = w.PETATOEUtils = w.PETATOEUtils || {};

  var safeClamp = (typeof utils.clamp === 'function') ? utils.clamp : function(v, min, max){
    return Math.max(min, Math.min(max, v));
  };

  var safeById = (typeof utils.byId === 'function') ? utils.byId : function(id){
    return document.getElementById(id);
  };

  utils.clamp = safeClamp;
  utils.byId = safeById;


  var warnedSilentCatch = Object.create(null);
  utils.warnSilentCatch = (typeof utils.warnSilentCatch === 'function') ? utils.warnSilentCatch : function(label, error){
    try {
      var key = String(label || 'PETATOE silent catch');
      if (warnedSilentCatch[key]) return;
      warnedSilentCatch[key] = true;
      if (w.console && typeof w.console.warn === 'function') {
        w.console.warn('[PETATOE Silent Catch]', key, error);
      }
    } catch(_ignored){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/global-small-utils.js",_ignored);}
  };

  // Legacy Global Compatibility:
  // Some existing modules still call byId()/clamp() directly. Expose aliases only when
  // they are not already defined to prevent accidental global override collisions.
  if (typeof w.clamp !== 'function') {
    w.clamp = safeClamp;
  }
  if (typeof w.byId !== 'function') {
    w.byId = safeById;
  }
})(window);
