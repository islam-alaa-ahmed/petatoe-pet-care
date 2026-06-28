/**
 * PETATOE v6.2.50 Phase 10C-SAFE
 * Lazy Loading Pilot (manual / opt-in only).
 *
 * IMPORTANT:
 * - Does NOT change router behavior.
 * - Does NOT remove any existing eager scripts.
 * - Does NOT auto-load or unload modules.
 * - Does NOT touch Loader, Navigation, Storage, Core modules, or DOM rendering.
 *
 * Purpose:
 * Provide a safe, observable contract for a future lazy-loading implementation.
 */
(function(){
  'use strict';

  if (window.PETATOELazyLoadingPilot && window.PETATOELazyLoadingPilot.__ready) return;

  var REGISTRY = Object.freeze({
    warehouses: Object.freeze({
      label: 'Warehouse',
      safeMode: true,
      takeover: false,
      scripts: Object.freeze([
        'warehouses/warehouse-read-facade.js',
        'warehouses/warehouse-computed-facade.js',
        'warehouses/warehouse-view-model-facade.js',
        'warehouses/warehouse-render-snapshot-facade.js',
        'warehouses/warehouse-render-bridge.js',
        'warehouses/warehouse-event-bridge.js',
        'warehouses/warehouse-parallel-validation.js',
        'warehouses/warehouse-shadow-audit.js'
      ])
    }),
    treasury: Object.freeze({
      label: 'Treasury',
      safeMode: true,
      takeover: false,
      scripts: Object.freeze([
        'treasury/treasury-read-facade.js',
        'treasury/treasury-computed-facade.js',
        'treasury/treasury-view-model-facade.js',
        'treasury/treasury-render-bridge.js',
        'treasury/treasury-event-bridge.js',
        'treasury/treasury-parallel-validation.js'
      ])
    }),
    payroll: Object.freeze({
      label: 'Payroll',
      safeMode: true,
      takeover: false,
      scripts: Object.freeze([
        'payroll/payroll-read-facade.js',
        'payroll/payroll-computed-facade.js',
        'payroll/payroll-view-model-facade.js',
        'payroll/payroll-render-bridge.js',
        'payroll/payroll-event-bridge.js',
        'payroll/payroll-parallel-validation.js'
      ])
    }),
    childrenExpenses: Object.freeze({
      label: 'Children Expenses',
      safeMode: true,
      takeover: false,
      scripts: Object.freeze([
        'children-expenses/children-core.js',
        'children-expenses/children-storage.js',
        'children-expenses/children-budget.js',
        'children-expenses/children-entry.js',
        'children-expenses/children-records.js',
        'children-expenses/children-reports.js',
        'children-expenses/children-annual.js',
        'children-expenses/children-charts.js'
      ])
    })
  });

  var loadedByPilot = Object.create(null);

  function normalizeModuleName(name){
    return String(name || '').trim();
  }

  function getRegistry(){
    return REGISTRY;
  }

  function getModule(name){
    name = normalizeModuleName(name);
    return REGISTRY[name] || null;
  }

  function isScriptPresent(src){
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++){
      var current = scripts[i].getAttribute('src') || '';
      if (current === src || current.indexOf(src) !== -1) return true;
    }
    return false;
  }

  function loadScript(src){
    return new Promise(function(resolve, reject){
      if (!src) return reject(new Error('Missing script src'));
      if (isScriptPresent(src)){
        loadedByPilot[src] = loadedByPilot[src] || 'already-present';
        return resolve({ src: src, status: 'already-present' });
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = function(){
        loadedByPilot[src] = 'loaded';
        resolve({ src: src, status: 'loaded' });
      };
      script.onerror = function(){
        loadedByPilot[src] = 'error';
        reject(new Error('Failed to load script: ' + src));
      };
      document.head.appendChild(script);
    });
  }

  function loadModuleBundle(name){
    var moduleDef = getModule(name);
    if (!moduleDef) return Promise.reject(new Error('Unknown lazy pilot module: ' + name));
    var chain = Promise.resolve([]);
    moduleDef.scripts.forEach(function(src){
      chain = chain.then(function(results){
        return loadScript(src).then(function(result){
          results.push(result);
          return results;
        });
      });
    });
    return chain;
  }

  function status(){
    return {
      ready: true,
      mode: 'manual-pilot-only',
      autoLoadEnabled: false,
      routerTakeover: false,
      modules: Object.keys(REGISTRY),
      loadedByPilot: Object.assign({}, loadedByPilot)
    };
  }

  window.PETATOELazyLoadingPilot = Object.freeze({
    __ready: true,
    version: 'v6.2.50-phase10c-safe',
    getRegistry: getRegistry,
    getModule: getModule,
    status: status,
    loadScript: loadScript,
    loadModuleBundle: loadModuleBundle
  });
})();
