(function(){
  'use strict';
  if(window.PETATOERuntimeUI && window.PETATOERuntimeUI.__ready) return;
  function qa(sel, root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
  function closeDropdowns(){
    try{
      qa('.pet-filter-open,.pet-dd-open').forEach(function(el){el.classList.remove('pet-filter-open','pet-dd-open','open');});
      qa('[data-pet-filter-dropdown],[data-pet-dropdown],.pet-filter-menu,.pet-dd-menu').forEach(function(el){if(el&&el.style)el.style.display='none';});
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/runtime-ui-stabilization.js",e);}
  }
  function cleanupHiddenCharts(){
    try{
      if(!window.charts) return;
      Object.keys(window.charts).forEach(function(id){
        var chart=window.charts[id], canvas=document.getElementById(id);
        if(!canvas || !chart || typeof chart.destroy!=='function') return;
        var panel=canvas.closest && canvas.closest('.panel');
        if(panel && !panel.classList.contains('active')){chart.destroy(); delete window.charts[id];}
      });
    }catch(e){console.warn('PETATOE chart cleanup skipped',e);}
  }
  function wrapRouter(){
    if(window.__PETATOE_RUNTIME_UI_TABCHANGE_BOUND__) return;
    window.__PETATOE_RUNTIME_UI_TABCHANGE_BOUND__ = true;
    document.addEventListener('petatoe:tabchange',function(){closeDropdowns();setTimeout(function(){closeDropdowns();cleanupHiddenCharts();},80);});
  }
  function init(){
    if(window.__PETATOE_RUNTIME_UI_INIT_DONE__) return;
    window.__PETATOE_RUNTIME_UI_INIT_DONE__ = true;
    wrapRouter();
    document.addEventListener('click',function(e){
      var inside=e.target && e.target.closest && e.target.closest('[data-pet-filter-root],.pet-filter-root,.pet-custom-select,.pet-dd,.filter-select,.select-wrap');
      if(!inside) closeDropdowns();
    },true);
    window.addEventListener('keydown',function(e){if(e.key==='Escape')closeDropdowns();});
    setTimeout(cleanupHiddenCharts,1200);
  }
  window.PETATOERuntimeUI={__ready:true,closeDropdowns:closeDropdowns,cleanupHiddenCharts:cleanupHiddenCharts,wrapRouter:wrapRouter};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
