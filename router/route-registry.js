/* PETATOE v6.4.6 RX2: Route Registry Extraction
 * Purpose: extract route ownership metadata out of index.html/router assumptions.
 * Safety rules:
 * - Does NOT open, close, hide, or show panels.
 * - Does NOT lazy-load scripts.
 * - Does NOT write to DOM or storage.
 * - Does NOT replace PETATOERouter or NavigationController.
 * - Provides a read-only route registry for future Router ownership transfer.
 */
(function(){
  'use strict';

  var VERSION = 'v6.4.6-rx2-route-registry';

  function clone(value){
    try { return JSON.parse(JSON.stringify(value)); }
    catch(_err){ return value; }
  }

  function normalize(value){ return String(value || '').trim(); }
  function normalizeArray(list){
    if(!Array.isArray(list)) return [];
    return list.map(function(item){ return normalize(item); }).filter(Boolean);
  }

  var routes = Object.create(null);

  function register(routeId, meta){
    routeId = normalize(routeId);
    if(!routeId) return false;
    meta = meta || {};
    routes[routeId] = Object.freeze({
      routeId: routeId,
      moduleId: normalize(meta.moduleId || meta.module || 'unknown'),
      title: normalize(meta.title || routeId),
      panelId: normalize(meta.panelId || routeId),
      owner: normalize(meta.owner || meta.moduleId || 'unknown'),
      status: normalize(meta.status || 'active'),
      eager: meta.eager !== false,
      lazyCandidate: !!meta.lazyCandidate,
      sensitive: !!meta.sensitive,
      protected: !!meta.protected,
      requiresPermission: normalize(meta.requiresPermission || ''),
      aliases: normalizeArray(meta.aliases),
      scriptHints: normalizeArray(meta.scriptHints),
      cssHints: normalizeArray(meta.cssHints),
      notes: normalize(meta.notes || '')
    });
    return true;
  }

  function get(routeId){
    routeId = normalize(routeId);
    if(routes[routeId]) return clone(routes[routeId]);
    var keys = Object.keys(routes);
    for(var i=0;i<keys.length;i++){
      var item = routes[keys[i]];
      if(item.aliases.indexOf(routeId) !== -1) return clone(item);
    }
    return null;
  }

  function has(routeId){ return !!get(routeId); }
  function list(){ return Object.keys(routes).sort().map(function(id){ return get(id); }); }
  function byModule(moduleId){
    moduleId = normalize(moduleId);
    return list().filter(function(route){ return route.moduleId === moduleId; });
  }
  function snapshot(){
    return { version: VERSION, count: Object.keys(routes).length, routes: list() };
  }

  // Core/application shell routes
  register('dashboard', { moduleId:'dashboard', title:'Dashboard / Home', owner:'application-shell', eager:true, lazyCandidate:false, scriptHints:['index.html'] });
  register('settings', { moduleId:'settings', title:'Settings', owner:'settings', eager:true, lazyCandidate:false, sensitive:true, protected:true, scriptHints:['settings/*.js','navigation/*.js'] });
  register('users', { moduleId:'settings', title:'Users', owner:'settings', eager:true, lazyCandidate:false, sensitive:true, protected:true, scriptHints:['settings/users.js'] });
  register('permissions', { moduleId:'settings', title:'Permissions', owner:'settings', eager:true, lazyCandidate:false, sensitive:true, protected:true, scriptHints:['settings/permissions.js'] });

  // Business routes prepared by SAFE tracks
  register('smart', { moduleId:'smart-reports', title:'Smart Reports', owner:'smart-reports', panelId:'smart', eager:true, lazyCandidate:true, requiresPermission:'reports', scriptHints:['smart/smart-reports-core.js'] });
  register('operations', { moduleId:'operations', title:'Operations', owner:'operations', panelId:'appointments', eager:true, lazyCandidate:true, requiresPermission:'appointments', scriptHints:['operations/*.js'] });
  register('appointments', { moduleId:'operations', title:'Appointments', owner:'operations', panelId:'appointments', eager:true, lazyCandidate:true, requiresPermission:'appointments', aliases:['appointmentsMaster','appointments-master'], scriptHints:['inline-extracted/appointments-core.js','operations/*.js'] });
  register('vehicleOperations', { moduleId:'operations', title:'Vehicle Operations', owner:'operations', panelId:'vehicleOperations', eager:true, lazyCandidate:true, requiresPermission:'vehicleOperations', aliases:['vehicles','fleet'], scriptHints:['operations/*.js'] });
  register('vehicleOperationsReports', { moduleId:'operations', title:'Vehicle Operations Reports', owner:'operations', panelId:'vehicleOperationsReports', eager:true, lazyCandidate:true, requiresPermission:'vehicleOperationsReports', scriptHints:['operations/*.js'] });
  register('operationKpis', { moduleId:'operations', title:'Operation KPIs', owner:'operations', panelId:'operationKpis', eager:true, lazyCandidate:true, requiresPermission:'operationKpis', scriptHints:['operations/*.js'] });
  register('vans', { moduleId:'analytics', title:'Vans Performance', owner:'analytics', panelId:'vans', eager:true, lazyCandidate:true, requiresPermission:'vehicles', aliases:['vehicleReports'], scriptHints:['components/*.js','core/*.js'] });
  register('childrenExpenses', { moduleId:'children-expenses', title:'Children Expenses', owner:'children-expenses', panelId:'childrenExpenses', eager:true, lazyCandidate:true, requiresPermission:'childrenExpenses', scriptHints:['children-expenses/*.js','inline-extracted/children-expenses-core.js'] });
  register('warehouses', { moduleId:'warehouse', title:'Warehouses', owner:'warehouses', panelId:'warehouses', eager:true, lazyCandidate:true, requiresPermission:'vehicles', aliases:['warehouse'], scriptHints:['warehouses/*.js'] });
  register('treasury', { moduleId:'treasury', title:'Treasury', owner:'treasury', panelId:'treasury', eager:true, lazyCandidate:true, sensitive:true, requiresPermission:'treasury', scriptHints:['treasury/*.js'] });
  register('payroll', { moduleId:'payroll', title:'Payroll', owner:'payroll', panelId:'payroll', eager:true, lazyCandidate:true, sensitive:true, protected:true, requiresPermission:'payroll', scriptHints:['payroll/*.js'] });
  register('salarySlip', { moduleId:'payroll', title:'Salary Slip', owner:'payroll', panelId:'salarySlip', eager:true, lazyCandidate:true, sensitive:true, protected:true, requiresPermission:'salarySlip', scriptHints:['payroll/*.js'] });
  register('commissionStatement', { moduleId:'commissions', title:'Commission Statement', owner:'commissions', panelId:'commissionStatement', eager:true, lazyCandidate:true, requiresPermission:'commissionStatement', aliases:['commissions'], scriptHints:['commissions/*.js'] });

  // Sales and supporting routes
  register('sales', { moduleId:'sales', title:'Sales', owner:'sales', panelId:'sales', eager:true, lazyCandidate:true, requiresPermission:'sales', scriptHints:['sales/*.js'] });
  register('salesInvoices', { moduleId:'sales', title:'Sales Invoices', owner:'sales', panelId:'sales', eager:true, lazyCandidate:true, requiresPermission:'sales', scriptHints:['sales/*.js'] });
  register('entry', { moduleId:'sales', title:'Data Entry', owner:'sales', panelId:'entry', eager:true, lazyCandidate:true, requiresPermission:'sales', scriptHints:['sales/*.js'] });
  register('import', { moduleId:'sales', title:'Excel Import', owner:'sales', panelId:'import', eager:true, lazyCandidate:true, requiresPermission:'sales', scriptHints:['sales/*.js'] });
  register('records', { moduleId:'reports', title:'Records', owner:'reports', panelId:'records', eager:true, lazyCandidate:true, requiresPermission:'reports', scriptHints:['reports/*.js'] });
  register('services', { moduleId:'settings', title:'Services', owner:'settings', panelId:'services', eager:true, lazyCandidate:true, requiresPermission:'services', scriptHints:['settings/*.js'] });
  register('executive', { moduleId:'executive', title:'Executive Dashboard', owner:'executive', panelId:'executive', eager:true, lazyCandidate:true, requiresPermission:'reports', scriptHints:['reports/*.js'] });
  register('customer360', { moduleId:'customers', title:'Customer 360', owner:'customers', panelId:'customer360', eager:true, lazyCandidate:true, requiresPermission:'customers', aliases:['customers'], scriptHints:['customers/*.js'] });
  register('logs', { moduleId:'settings', title:'Audit Logs', owner:'settings', panelId:'logs', eager:true, lazyCandidate:true, sensitive:true, protected:true, requiresPermission:'audit', aliases:['audit'], scriptHints:['settings/*.js'] });
  register('obligations', { moduleId:'obligations', title:'Obligations', owner:'obligations', panelId:'obligations', eager:true, lazyCandidate:true, requiresPermission:'obligations', scriptHints:['obligations/obligations-core.js'] });

  var api = Object.freeze({
    version: VERSION,
    register: register,
    get: get,
    has: has,
    list: list,
    byModule: byModule,
    snapshot: snapshot
  });

  if(!window.PETATOERouteRegistry){ window.PETATOERouteRegistry = api; }
})();
