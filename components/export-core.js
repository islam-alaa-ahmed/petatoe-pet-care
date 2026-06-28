/* PETATOE v3.10.3 - Export Core Compatibility Bridge
   Keeps legacy calls working while delegating to the new Export Engine modules. */
(function(){
  'use strict';
  var ns = window.PETATOEExport = window.PETATOEExport || {};
  ns.version = ns.version || '3.10.3';
  ns.__v3103 = true;
  ns.runLegacy = ns.runLegacy || function(fn){
    try{
      if(typeof fn === 'function') return fn();
      if(typeof fn === 'string' && typeof window[fn] === 'function') return window[fn]();
    }catch(e){
      console.error('[PETATOEExport] legacy export failed', e);
      if(typeof window.toast === 'function') window.toast('تعذر تنفيذ التصدير');
    }
  };
  ns.pdf = ns.pdf || function(fn){ return ns.runLegacy(fn); };
  ns.excel = ns.excel || function(fn){ return ns.runLegacy(fn); };
  ns.print = ns.print || function(fn){ return ns.runLegacy(fn); };
})();
