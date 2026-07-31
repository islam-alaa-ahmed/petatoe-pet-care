(function(){
  'use strict';
  if(window.__PETATOE_COMMISSION_RUNTIME_BOOTSTRAP__) return;
  window.__PETATOE_COMMISSION_RUNTIME_BOOTSTRAP__ = true;

  var runtime = window.PETATOECommissionRuntime = window.PETATOECommissionRuntime || {};
  runtime.__ready = false;
  runtime.status = runtime.status || 'loading';
  runtime.version = '10.0.25-sg3-commission-runtime-ownership-1';
  runtime.error = '';

  function ensurePanels(){
    var page = document.querySelector('section.page');
    if(!page) return false;
    var system = document.getElementById('commissions');
    if(!system){
      system = document.createElement('div');
      system.id = 'commissions';
      system.className = 'panel';
      system.setAttribute('data-pet-module','commissions');
      system.setAttribute('data-pet-lazy-group','commission');
      page.appendChild(system);
    }
    var statement = document.getElementById('commissionStatement');
    if(statement){
      statement.setAttribute('data-pet-lazy-group','commission');
      statement.setAttribute('data-pet-module','commission-statement');
    }
    return !!(system && statement);
  }

  runtime.ensurePanels = ensurePanels;
  runtime.markReady = function(api){
    api = api || {};
    Object.keys(api).forEach(function(key){ runtime[key] = api[key]; });
    runtime.status = 'ready';
    runtime.error = '';
    runtime.__ready = true;
    try{ window.dispatchEvent(new CustomEvent('petatoe:commission-runtime-ready',{detail:{version:runtime.version}})); }catch(_){ }
    return true;
  };
  runtime.markFailed = function(error){
    runtime.status = 'failed';
    runtime.error = String(error && error.message || error || 'Commission runtime failed');
    runtime.__ready = false;
    return false;
  };

  ensurePanels();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensurePanels, {once:true});
})(window);
