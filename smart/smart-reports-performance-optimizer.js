/* PETATOE v6.4.66 Phase P2 - Smart Reports Performance Optimizer.
   Safe runtime layer: defer Smart Reports charts that belong to inactive tabs.
   Does not change calculations, filters, router, navigation, storage, or exports. */
(function(){
  'use strict';
  if(window.PETATOESmartReportsPerformanceOptimizer && window.PETATOESmartReportsPerformanceOptimizer.ready) return;

  var pendingCharts = Object.create(null);
  var originalChart = (typeof window.chart === 'function') ? window.chart : null;
  var patchedChart = false;
  var patchedTab = false;

  function warn(msg, err){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch(msg, err || new Error(msg));
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-performance-optimizer.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }

  function isSmartReportsCanvas(canvas){
    try{
      return !!(canvas && canvas.closest && canvas.closest('#smartReportsArea,[data-smart-section],.smart-reports,.merged-bi-area'));
    }catch(e){return false;}
  }

  function getSmartSection(canvas){
    try{return canvas && canvas.closest ? canvas.closest('[data-smart-section]') : null;}catch(e){return null;}
  }

  function isSectionActive(section){
    if(!section) return true;
    try{return section.classList.contains('active') || section.offsetParent !== null;}catch(e){return true;}
  }

  function idle(run, timeout){
    if(window.requestIdleCallback){ window.requestIdleCallback(run, {timeout: timeout || 350}); return; }
    if(window.requestAnimationFrame){ window.requestAnimationFrame(function(){setTimeout(run,0);}); return; }
    setTimeout(run, 16);
  }

  function markDeferred(canvas){
    try{
      canvas.setAttribute('data-pet-chart-deferred','1');
      var holder = canvas.parentElement;
      if(holder) holder.setAttribute('data-pet-chart-deferred','1');
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-performance-optimizer.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }

  function clearDeferred(canvas){
    try{
      canvas.removeAttribute('data-pet-chart-deferred');
      var holder = canvas.parentElement;
      if(holder) holder.removeAttribute('data-pet-chart-deferred');
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-performance-optimizer.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }

  function flushChart(id){
    if(!originalChart || !pendingCharts[id]) return false;
    var item = pendingCharts[id];
    var canvas = document.getElementById(id);
    if(!canvas){ delete pendingCharts[id]; return false; }
    var section = getSmartSection(canvas);
    if(section && !isSectionActive(section)) return false;
    delete pendingCharts[id];
    clearDeferred(canvas);
    idle(function(){
      try{ originalChart(id, item.config); }
      catch(e){ warn('PETATOE Smart chart deferred flush skipped', e); }
    }, 450);
    return true;
  }

  function flushVisible(){
    Object.keys(pendingCharts).forEach(flushChart);
  }

  function patchChart(){
    if(patchedChart) return;
    if(typeof window.chart !== 'function') return;
    originalChart = window.chart;
    window.chart = function petatoeDeferredSmartChart(id, config){
      var canvas = document.getElementById(id);
      if(!canvas || !isSmartReportsCanvas(canvas)){
        return originalChart(id, config);
      }
      var section = getSmartSection(canvas);
      if(section && !isSectionActive(section)){
        pendingCharts[id] = {config: config, ts: Date.now()};
        markDeferred(canvas);
        return;
      }
      return originalChart(id, config);
    };
    window.chart.__petatoeSmartPerfWrapped = true;
    patchedChart = true;
  }

  function patchSetSmartTab(){
    if(patchedTab || typeof window.setSmartTab !== 'function' || window.setSmartTab.__petatoeSmartPerfWrapped) return;
    var originalSetSmartTab = window.setSmartTab;
    var wrapped = function petatoePerfSetSmartTab(tab){
      var result = originalSetSmartTab.apply(this, arguments);
      idle(flushVisible, 220);
      setTimeout(flushVisible, 80);
      return result;
    };
    wrapped.__petatoeSmartPerfWrapped = true;
    window.setSmartTab = wrapped;
    patchedTab = true;
  }

  patchChart();
  var patchTimer = setInterval(function(){
    patchChart();
    patchSetSmartTab();
    if(patchedChart && patchedTab) clearInterval(patchTimer);
  }, 120);
  setTimeout(function(){try{clearInterval(patchTimer);}catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-performance-optimizer.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }}, 6000);

  document.addEventListener('visibilitychange', function(){ if(!document.hidden) idle(flushVisible, 500); }, true);
  window.addEventListener('resize', function(){ idle(flushVisible, 500); }, {passive:true});

  window.PETATOESmartReportsPerformanceOptimizer = {
    ready: true,
    flush: flushVisible,
    pending: function(){return Object.keys(pendingCharts);},
    status: function(){return {ready:true, patchedChart:patchedChart, patchedTab:patchedTab, pending:Object.keys(pendingCharts).length};}
  };
})();
