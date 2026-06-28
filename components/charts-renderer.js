(function(window, document){
  'use strict';

  if(window.__PETATOE_CHARTS_RENDERER_READY__ && window.PETATOECharts){
    return;
  }
  window.__PETATOE_CHARTS_RENDERER_READY__ = true;

  var Charts = window.PETATOECharts || {};
  var charts = {};

  function captureSilentCatch(scope, error){
    try{
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('components/charts-renderer.js', error, {scope: scope || 'charts-renderer'});
        return;
      }
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('components/charts-renderer.js', error);
      }
    }catch(_diagErr){ return; }
  }

  function destroy(id){
    if(charts[id] && typeof charts[id].destroy === 'function'){
      try{ charts[id].destroy(); }catch(e){ captureSilentCatch('destroy', e); }
    }
    delete charts[id];
  }

  var idleTokens = {};

  function isSmartChartTarget(canvas, key){
    try{
      if(canvas && canvas.closest && canvas.closest('#smartReportsArea,[data-smart-section],.smart-reports,.bi-panel,.bi-chart')) return true;
      return /^(smart|report|salesIntel|newCustomers|inactive|bi|vans|vanPie|vanLine|vanBar|smartVans|smartForecast|smartService)/i.test(String(key || ''));
    }catch(e){ captureSilentCatch('isSmartChartTarget', e); return false; }
  }

  function scheduleChart(key, fn){
    key = String(key || 'chart');
    var token = (idleTokens[key] || 0) + 1;
    idleTokens[key] = token;
    var run = function(){
      if(idleTokens[key] !== token) return;
      fn();
    };
    if(window.requestIdleCallback){ window.requestIdleCallback(run, {timeout: 260}); }
    else if(window.requestAnimationFrame){ window.requestAnimationFrame(function(){ setTimeout(run, 0); }); }
    else{ setTimeout(run, 16); }
  }

  function cloneConfig(config){
    try{ if(window.structuredClone) return structuredClone(config || {}); }catch(e){ captureSilentCatch('cloneConfig.structuredClone', e); }
    try{ return JSON.parse(JSON.stringify(config || {})); }catch(e){ captureSilentCatch('cloneConfig.jsonFallback', e); return Object.assign({}, config || {}); }
  }

  function updateExisting(key, config, smartTarget){
    var existing = charts[key];
    if(!existing) return false;
    try{
      var nextType = (config && config.type) || (existing.config && existing.config.type);
      var currentType = (existing.config && existing.config.type) || existing.type;
      if(String(nextType || '') !== String(currentType || '')) return false;
      existing.data = cloneConfig((config && config.data) || {labels:[],datasets:[]});
      existing.options = cloneConfig((config && config.options) || {});
      if(existing.config){
        existing.config.data = existing.data;
        existing.config.options = existing.options;
      }
      existing.update(smartTarget ? 'none' : undefined);
      return true;
    }catch(e){ captureSilentCatch('updateExisting', e); return false; }
  }

  function renderChart(canvasId, config){
    if(!window.Chart) return false;
    var canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if(!canvas) return false;
    var key = canvas.id || canvasId;
    var smartTarget = isSmartChartTarget(canvas, key);
    var create = function(){
      var nextConfig = config || {};
      if(smartTarget){
        nextConfig.options = nextConfig.options || {};
        nextConfig.options.animation = nextConfig.options.animation || {};
        if(typeof nextConfig.options.animation.duration === 'undefined') nextConfig.options.animation.duration = 0;
      }
      if(updateExisting(key, nextConfig, smartTarget)) return;
      destroy(key);
      charts[key] = new window.Chart(canvas.getContext('2d'), nextConfig);
    };
    if(smartTarget) scheduleChart(key, create);
    else create();
    return true;
  }

  function clearCache(reason){
    idleTokens = {};
  }

  function canvas(id, height){
    return '<div class="pet-chart-wrap"><canvas id="' + String(id || '').replace(/"/g,'') + '" height="' + (height || 120) + '"></canvas></div>';
  }

  Charts.render = Charts.render || renderChart;
  Charts.canvas = Charts.canvas || canvas;
  Charts.destroy = Charts.destroy || destroy;
  Charts.clearCache = Charts.clearCache || clearCache;
  window.PETATOECharts = Charts;
})(window, document);
