/* PETATOE v6.4.1 Phase R2 - Module Registry Shadow Layer
 * Purpose: provide a passive module registry contract for future router extraction.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open/close tabs.
 * - Does NOT lazy-load scripts.
 * - Does NOT write to DOM or storage.
 * - Does NOT change permissions or route guards.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.6-rx2-module-registry-shadow';
  var registry = Object.create(null);
  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    lastTab: '',
    lastSmartOpen: '',
    tabChangesObserved: 0
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalizeId(id){
    return String(id || '').trim();
  }

  function normalizeArray(list){
    if(!Array.isArray(list)) return [];
    return list.map(function(item){ return String(item || '').trim(); }).filter(Boolean);
  }

  function registerModule(id, meta){
    id = normalizeId(id);
    if(!id) return false;
    meta = meta || {};
    registry[id] = Object.freeze({
      id: id,
      title: String(meta.title || id),
      owner: String(meta.owner || 'unknown'),
      status: String(meta.status || 'shadow'),
      eager: !!meta.eager,
      lazyCandidate: !!meta.lazyCandidate,
      routeIds: normalizeArray(meta.routeIds),
      scriptHints: normalizeArray(meta.scriptHints),
      cssHints: normalizeArray(meta.cssHints),
      notes: String(meta.notes || '')
    });
    return true;
  }

  function getModule(id){
    id = normalizeId(id);
    return registry[id] ? clone(registry[id]) : null;
  }

  function listModules(){
    return Object.keys(registry).sort().map(function(id){ return getModule(id); });
  }

  function findByRoute(routeId){
    routeId = normalizeId(routeId);
    if(!routeId) return null;
    var ids = Object.keys(registry);
    for(var i=0;i<ids.length;i++){
      var mod = registry[ids[i]];
      if(mod.routeIds.indexOf(routeId) !== -1) return getModule(mod.id);
    }
    return null;
  }

  function getSnapshot(){
    return {
      version: VERSION,
      activity: clone(activity),
      modules: listModules()
    };
  }

  function hydrateFromRouteRegistry(){
    try{
      var routeRegistry = window.PETATOERouteRegistry;
      if(!routeRegistry || typeof routeRegistry.list !== 'function') return false;
      var grouped = Object.create(null);
      routeRegistry.list().forEach(function(route){
        var moduleId = String(route.moduleId || 'unknown');
        grouped[moduleId] = grouped[moduleId] || {
          id: moduleId,
          title: moduleId,
          owner: String(route.owner || moduleId),
          status: 'registry-shadow',
          eager: true,
          lazyCandidate: false,
          routeIds: [],
          scriptHints: [],
          cssHints: [],
          notes: 'Hydrated from PETATOERouteRegistry.'
        };
        grouped[moduleId].title = grouped[moduleId].title === moduleId ? String(route.title || moduleId) : grouped[moduleId].title;
        grouped[moduleId].eager = grouped[moduleId].eager && !!route.eager;
        grouped[moduleId].lazyCandidate = grouped[moduleId].lazyCandidate || !!route.lazyCandidate;
        grouped[moduleId].routeIds.push(route.routeId);
        (route.scriptHints || []).forEach(function(h){ if(grouped[moduleId].scriptHints.indexOf(h) === -1) grouped[moduleId].scriptHints.push(h); });
        (route.cssHints || []).forEach(function(h){ if(grouped[moduleId].cssHints.indexOf(h) === -1) grouped[moduleId].cssHints.push(h); });
      });
      Object.keys(grouped).forEach(function(id){ registerModule(id, grouped[id]); });
      return true;
    }catch(err){
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('module-registry-shadow.js', err);
      }
      return false;
    }
  }

  // Shadow-only initial registry based on the R1 ownership audit. This is metadata only.
  registerModule('dashboard', {
    title: 'Dashboard / Home', owner: 'application-shell', status: 'eager-core', eager: true,
    routeIds: ['dashboard'], scriptHints: ['index.html'], notes: 'Core landing panel remains eager.'
  });
  registerModule('smart-reports', {
    title: 'Smart Reports', owner: 'smart-reports', status: 'shadow-candidate', eager: true, lazyCandidate: true,
    routeIds: ['smart'], scriptHints: ['smart/smart-reports-core.js']
  });
  registerModule('operations', {
    title: 'Operations / Appointments', owner: 'operations', status: 'shadow-candidate', eager: true, lazyCandidate: true,
    routeIds: ['operations','appointments','vehicles','vehicleOperationsReports'],
    scriptHints: ['operations/*.js','inline-extracted/appointments-core.js']
  });
  registerModule('children-expenses', {
    title: 'Children Expenses', owner: 'children-expenses', status: 'shadow-candidate', eager: true, lazyCandidate: true,
    routeIds: ['childrenExpenses'], scriptHints: ['children-expenses/*.js','inline-extracted/children-expenses-core.js']
  });
  registerModule('warehouse', {
    title: 'Warehouse', owner: 'warehouses', status: 'shadow-prepared', eager: true, lazyCandidate: true,
    routeIds: ['warehouse','warehouses'], scriptHints: ['warehouses/*.js']
  });
  registerModule('treasury', {
    title: 'Treasury', owner: 'treasury', status: 'shadow-prepared', eager: true, lazyCandidate: true,
    routeIds: ['treasury'], scriptHints: ['treasury/*.js']
  });
  registerModule('payroll', {
    title: 'Payroll', owner: 'payroll', status: 'shadow-prepared', eager: true, lazyCandidate: true,
    routeIds: ['payroll','salarySlip'], scriptHints: ['payroll/*.js']
  });
  registerModule('settings', {
    title: 'Settings / Users / Permissions', owner: 'settings', status: 'eager-guarded', eager: true, lazyCandidate: false,
    routeIds: ['settings','users','permissions'], scriptHints: ['settings/*.js','navigation/*.js']
  });
  registerModule('sales', {
    title: 'Sales / Invoices', owner: 'sales', status: 'shadow-candidate', eager: true, lazyCandidate: true,
    routeIds: ['sales','salesInvoices'], scriptHints: ['sales/*.js']
  });

  hydrateFromRouteRegistry();

  function observeTabChange(evt){
    try{
      var detail = evt && evt.detail || {};
      activity.lastTab = String(detail.tabId || '');
      activity.lastSmartOpen = String(detail.smartOpen || '');
      activity.tabChangesObserved += 1;
    }catch(_err){
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('module-registry-shadow.js', _err);
      }
    }
  }

  if(document && typeof document.addEventListener === 'function'){
    document.addEventListener('petatoe:tabchange', observeTabChange, false);
  }

  var api = Object.freeze({
    version: VERSION,
    register: registerModule,
    get: getModule,
    list: listModules,
    findByRoute: findByRoute,
    snapshot: getSnapshot
  });

  // Preserve any existing object by exposing a non-destructive shadow alias as well.
  if(!window.PETATOEModuleRegistry){ window.PETATOEModuleRegistry = api; }
  window.PETATOEModuleRegistryShadow = api;
})();
