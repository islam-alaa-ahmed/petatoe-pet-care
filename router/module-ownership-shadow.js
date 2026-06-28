/* PETATOE v6.4.12 Phase RX5-SAFE - Module Ownership Shadow Mapping
 * Purpose: expose a passive route/panel/module ownership map before any router ownership transfer.
 * Safety rules:
 * - Does NOT replace window.PETATOERouter.
 * - Does NOT open, close, activate, or render tabs.
 * - Does NOT lazy-load or defer scripts.
 * - Does NOT write to DOM, Storage, Loader, Navigation, permissions, or business modules.
 * - Metadata only: intended for validation before future Real Extraction phases.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.12-rx5-safe-module-ownership-shadow-mapping';

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){
    return String(value || '').trim();
  }

  function safeArray(list){
    if(!Array.isArray(list)) return [];
    return list.map(function(item){ return normalize(item); }).filter(Boolean);
  }

  function freezeEntry(entry){
    return Object.freeze({
      moduleId: normalize(entry.moduleId),
      title: normalize(entry.title || entry.moduleId),
      owner: normalize(entry.owner || entry.moduleId || 'unknown'),
      status: normalize(entry.status || 'shadow-only'),
      extractionTrack: normalize(entry.extractionTrack || 'rx-safe'),
      routes: Object.freeze(safeArray(entry.routes)),
      panels: Object.freeze(safeArray(entry.panels)),
      knownEntrypoints: Object.freeze(safeArray(entry.knownEntrypoints)),
      dependencies: Object.freeze(safeArray(entry.dependencies)),
      blockedForRealOwnership: entry.blockedForRealOwnership !== false,
      notes: normalize(entry.notes || '')
    });
  }

  var ownershipMap = Object.create(null);
  var activity = {
    version: VERSION,
    initializedAt: new Date().toISOString(),
    hydratedFromRouteRegistry: false,
    hydratedFromModuleRegistry: false,
    observedTabChanges: 0,
    lastObservedRoute: '',
    lastObservedModule: ''
  };

  function register(entry){
    entry = freezeEntry(entry || {});
    if(!entry.moduleId) return false;
    ownershipMap[entry.moduleId] = entry;
    return true;
  }

  function get(moduleId){
    moduleId = normalize(moduleId);
    return ownershipMap[moduleId] ? clone(ownershipMap[moduleId]) : null;
  }

  function list(){
    return Object.keys(ownershipMap).sort().map(function(id){ return get(id); });
  }

  function findByRoute(routeId){
    routeId = normalize(routeId);
    if(!routeId) return null;
    var keys = Object.keys(ownershipMap);
    for(var i = 0; i < keys.length; i += 1){
      var entry = ownershipMap[keys[i]];
      if(entry.routes.indexOf(routeId) !== -1) return clone(entry);
    }
    return null;
  }

  function findByPanel(panelId){
    panelId = normalize(panelId);
    if(!panelId) return null;
    var keys = Object.keys(ownershipMap);
    for(var i = 0; i < keys.length; i += 1){
      var entry = ownershipMap[keys[i]];
      if(entry.panels.indexOf(panelId) !== -1) return clone(entry);
    }
    return null;
  }

  function mergeUnique(base, extra){
    var map = Object.create(null);
    safeArray(base).concat(safeArray(extra)).forEach(function(item){ map[item] = true; });
    return Object.keys(map).sort();
  }

  function hydrateFromRouteRegistry(){
    try{
      var registry = window.PETATOERouteRegistry;
      if(!registry || typeof registry.list !== 'function') return false;
      registry.list().forEach(function(route){
        var moduleId = normalize(route.moduleId || route.owner || 'unknown');
        if(!moduleId || moduleId === 'unknown') return;
        var current = ownershipMap[moduleId] || freezeEntry({ moduleId: moduleId });
        register({
          moduleId: moduleId,
          title: current.title && current.title !== moduleId ? current.title : normalize(route.title || moduleId),
          owner: current.owner || normalize(route.owner || moduleId),
          status: current.status || 'shadow-only',
          extractionTrack: current.extractionTrack || 'rx-safe',
          routes: mergeUnique(current.routes, [route.routeId]),
          panels: current.panels,
          knownEntrypoints: mergeUnique(current.knownEntrypoints, route.scriptHints || []),
          dependencies: current.dependencies,
          blockedForRealOwnership: true,
          notes: current.notes || 'Hydrated passively from PETATOERouteRegistry.'
        });
      });
      activity.hydratedFromRouteRegistry = true;
      return true;
    }catch(err){
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('module-ownership-shadow.js', err);
      }
      return false;
    }
  }

  function hydrateFromModuleRegistry(){
    try{
      var registry = window.PETATOEModuleRegistryShadow || window.PETATOEModuleRegistry;
      if(!registry || typeof registry.list !== 'function') return false;
      registry.list().forEach(function(mod){
        var moduleId = normalize(mod.id || mod.moduleId);
        if(!moduleId) return;
        var current = ownershipMap[moduleId] || freezeEntry({ moduleId: moduleId });
        register({
          moduleId: moduleId,
          title: current.title && current.title !== moduleId ? current.title : normalize(mod.title || moduleId),
          owner: current.owner || normalize(mod.owner || moduleId),
          status: current.status || 'shadow-only',
          extractionTrack: current.extractionTrack || 'rx-safe',
          routes: mergeUnique(current.routes, mod.routeIds || mod.routes || []),
          panels: current.panels,
          knownEntrypoints: mergeUnique(current.knownEntrypoints, mod.scriptHints || []),
          dependencies: current.dependencies,
          blockedForRealOwnership: true,
          notes: current.notes || 'Hydrated passively from PETATOEModuleRegistry.'
        });
      });
      activity.hydratedFromModuleRegistry = true;
      return true;
    }catch(err){
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('module-ownership-shadow.js', err);
      }
      return false;
    }
  }

  // Static SAFE ownership map. These entries are metadata only and do not take ownership.
  [
    {
      moduleId: 'dashboard', title: 'Dashboard / Home', owner: 'application-shell', status: 'legacy-eager',
      routes: ['dashboard'], panels: ['dashboardPanel'], knownEntrypoints: ['index.html'], dependencies: ['router'],
      notes: 'Home remains owned by the legacy application shell.'
    },
    {
      moduleId: 'smart-reports', title: 'Smart Reports', owner: 'smart-reports', status: 'safe-shadow-candidate',
      routes: ['smart'], panels: ['smartPanel','reportsPanel','reportsCenterPanel'],
      knownEntrypoints: ['smart/*.js','inline-extracted/smart-reports-inline.js'], dependencies: ['router','components'],
      notes: 'Reports previously broke during RX3; keep shadow-only until dedicated validation.'
    },
    {
      moduleId: 'payroll', title: 'Payroll / Salary Slip', owner: 'payroll', status: 'safe-shadow-candidate',
      routes: ['payroll','salarySlip'], panels: ['payrollPanel','salarySlipPanel'],
      knownEntrypoints: ['payroll/*.js'], dependencies: ['router','storage'],
      notes: 'Home card routing was hotfixed; no ownership transfer in RX5.'
    },
    {
      moduleId: 'warehouse', title: 'Warehouse', owner: 'warehouses', status: 'safe-shadow-candidate',
      routes: ['warehouse','warehouses'], panels: ['warehousePanel','warehousesPanel'],
      knownEntrypoints: ['warehouses/*.js'], dependencies: ['router','storage'],
      notes: 'Warehouse SAFE track completed; remains legacy-owned.'
    },
    {
      moduleId: 'treasury', title: 'Treasury', owner: 'treasury', status: 'safe-shadow-candidate',
      routes: ['treasury'], panels: ['treasuryPanel'],
      knownEntrypoints: ['treasury/*.js'], dependencies: ['router','storage'],
      notes: 'Treasury SAFE track completed; remains legacy-owned.'
    },
    {
      moduleId: 'operations', title: 'Operations / Appointments / Fleet', owner: 'operations', status: 'safe-shadow-candidate',
      routes: ['operations','appointments','vehicles','vehicleOperationsReports'],
      panels: ['operationsPanel','appointmentsPanel','vehiclesPanel','vehicleOperationsReportsPanel'],
      knownEntrypoints: ['operations/*.js','inline-extracted/appointments-core.js'], dependencies: ['router','storage'],
      notes: 'Operations extraction completed; router ownership still blocked.'
    },
    {
      moduleId: 'children-expenses', title: 'Children Expenses', owner: 'children-expenses', status: 'safe-shadow-candidate',
      routes: ['childrenExpenses'], panels: ['childrenExpensesPanel'],
      knownEntrypoints: ['children-expenses/*.js'], dependencies: ['router','storage'],
      notes: 'Children extraction completed; remains shadow-owned only.'
    },
    {
      moduleId: 'settings', title: 'Settings / Users / Permissions', owner: 'settings', status: 'legacy-eager-guarded',
      routes: ['settings','users','permissions'], panels: ['settingsPanel','usersPanel','permissionsPanel'],
      knownEntrypoints: ['settings/*.js','navigation/*.js'], dependencies: ['router','permissions'],
      notes: 'Guarded area; excluded from real ownership transfer in RX5.'
    }
  ].forEach(register);

  hydrateFromRouteRegistry();
  hydrateFromModuleRegistry();

  function observeTabChange(evt){
    try{
      var detail = evt && evt.detail || {};
      var routeId = normalize(detail.tabId || detail.routeId || detail.smartOpen || '');
      var entry = findByRoute(routeId);
      activity.observedTabChanges += 1;
      activity.lastObservedRoute = routeId;
      activity.lastObservedModule = entry ? entry.moduleId : '';
    }catch(err){
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('module-ownership-shadow.js', err);
      }
    }
  }

  if(document && typeof document.addEventListener === 'function'){
    document.addEventListener('petatoe:tabchange', observeTabChange, false);
  }

  function snapshot(){
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      activity: clone(activity),
      ownership: list(),
      realOwnershipEnabled: false,
      lazyLoadingEnabled: false
    };
  }

  window.PETATOEModuleOwnershipShadow = Object.freeze({
    version: VERSION,
    register: register,
    get: get,
    list: list,
    findByRoute: findByRoute,
    findByPanel: findByPanel,
    snapshot: snapshot
  });
})();
