/* PETATOE v3.10.1 - Real Filters Engine Core
   Backward-compatible facade for the previous PETATOEFilters API. */
(function(){
  'use strict';
  if(window.PETATOEFilters && window.PETATOEFilters.__v3101) return;
  function register(rule){
    if(window.PETATOEFiltersEvents && window.PETATOEFiltersEvents.register) return window.PETATOEFiltersEvents.register(rule);
    setTimeout(function(){ register(rule); },80);
  }
  function normalize(scope){
    if(window.PETATOEFiltersRender && window.PETATOEFiltersRender.normalize) window.PETATOEFiltersRender.normalize(scope||document);
  }
  function clearBrokenWrappers(scope){ normalize(scope); }
  function debounce(key, fn, ms){
    if(window.PETATOEFiltersEvents && window.PETATOEFiltersEvents.debounce) return window.PETATOEFiltersEvents.debounce(key,fn,ms);
    window.__petFilterDebounceTimers = window.__petFilterDebounceTimers || {};
    clearTimeout(window.__petFilterDebounceTimers[key]);
    window.__petFilterDebounceTimers[key] = setTimeout(fn, ms||180);
  }
  window.PETATOEFilters = {__v3101:true, __v310:true, register:register, normalize:normalize, debounce:debounce, clearBrokenWrappers:clearBrokenWrappers};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ normalize(document); }); else normalize(document);
})();
