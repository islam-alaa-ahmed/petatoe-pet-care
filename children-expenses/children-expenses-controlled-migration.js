/*
 * PETATOE CHX3 — Children Expenses Controlled Migration
 * Type: REAL / GUARDED / LIMITED / FALLBACK ENABLED
 *
 * This file introduces a guarded controller for selected Children Expenses
 * public API calls. It does NOT delete children-legacy-engine.js and does NOT
 * change storage, router, loader, reports, payroll, warehouse, treasury, or
 * operations logic.
 *
 * What it does:
 * - Keeps the public API name window.PETATOEChildrenExpenses unchanged.
 * - Wraps selected low-risk public methods with a guarded proxy.
 * - Delegates to extracted children boundary modules when available.
 * - Falls back immediately to the legacy public API on missing modules/errors.
 * - Exposes validate(), snapshot(), rollback(), enable(), disable().
 *
 * Emergency kill switch before load:
 *   window.PETATOE_CHX3_DISABLE_CONTROLLED_MIGRATION = true;
 */
(function initPETATOEChildrenExpensesControlledMigration(window, document){
  'use strict';

  var VERSION = 'PETATOE_v6.4.41_PHASE_CHX3_CHILDREN_EXPENSES_CONTROLLED_MIGRATION';
  var PUBLIC_API = 'PETATOEChildrenExpenses';
  var LEGACY_BACKUP = '__PETATOEChildrenExpensesBeforeCHX3ControlledMigration';
  var active = !window.PETATOE_CHX3_DISABLE_CONTROLLED_MIGRATION;
  var events = [];
  var inFlight = {};

  var MIGRATION_MAP = {
    // Low-risk read/form reset boundaries. Mutating save/delete actions remain legacy-owned.
    read: {
      owner: 'PETATOEChildrenEntry',
      method: 'read',
      group: 'read-boundary',
      level: 'controlled-real'
    },
    readBudgets: {
      owner: 'PETATOEChildrenBudget',
      method: 'readBudgets',
      group: 'read-boundary',
      level: 'controlled-real'
    },
    clearForm: {
      owner: 'PETATOEChildrenEntry',
      method: 'clearForm',
      group: 'entry-ui',
      level: 'controlled-real'
    },
    clearBudgetForm: {
      owner: 'PETATOEChildrenBudget',
      method: 'clearBudgetForm',
      group: 'budget-ui',
      level: 'controlled-real'
    },
    resetFilters: {
      owner: 'PETATOEChildrenRecords',
      method: 'resetFilters',
      group: 'records-ui',
      level: 'controlled-real'
    },
    resetReportFilters: {
      owner: 'PETATOEChildrenReports',
      method: 'resetReportFilters',
      group: 'reports-ui',
      level: 'controlled-real'
    },
    resetAnnualFilters: {
      owner: 'PETATOEChildrenAnnual',
      method: 'resetAnnualFilters',
      group: 'annual-ui',
      level: 'controlled-real'
    }
  };

  function now(){
    try { return new Date().toISOString(); }
    catch(_e){ return String(Date.now()); }
  }

  function record(type, detail){
    var item = { time: now(), type: String(type || 'event'), detail: detail || {} };
    events.push(item);
    if(events.length > 120){ events.shift(); }
    return item;
  }

  function getPublicApi(){ return window[PUBLIC_API] || null; }
  function getLegacyApi(){ return window[LEGACY_BACKUP] || null; }

  function callable(owner, method){
    var obj = window[owner];
    return !!(obj && typeof obj[method] === 'function');
  }

  function fallbackCall(method, args){
    var legacy = getLegacyApi();
    if(legacy && typeof legacy[method] === 'function'){
      return legacy[method].apply(legacy, args || []);
    }
    var api = getPublicApi();
    if(api && api !== window.PETATOEChildrenExpensesControlledMigration && !api.__chx3ControlledMigration && typeof api[method] === 'function'){
      return api[method].apply(api, args || []);
    }
    return undefined;
  }

  function controlledCall(method, args){
    args = args || [];
    var cfg = MIGRATION_MAP[method];

    if(!active || !cfg){
      record('legacy-fallback', { method: method, reason: !active ? 'disabled' : 'not-migrated' });
      return fallbackCall(method, args);
    }

    if(inFlight[method]){
      record('legacy-fallback', { method: method, reason: 'recursion-guard' });
      return fallbackCall(method, args);
    }

    var ownerApi = window[cfg.owner];
    if(!ownerApi || typeof ownerApi[cfg.method] !== 'function'){
      record('legacy-fallback', { method: method, reason: 'owner-missing', owner: cfg.owner });
      return fallbackCall(method, args);
    }

    inFlight[method] = true;
    try{
      record('controlled-call', { method: method, owner: cfg.owner, group: cfg.group });
      return ownerApi[cfg.method].apply(ownerApi, args);
    }catch(error){
      record('controlled-error-fallback', {
        method: method,
        owner: cfg.owner,
        message: error && error.message ? error.message : String(error)
      });
      try { return fallbackCall(method, args); }
      catch(fallbackError){
        record('legacy-fallback-error', {
          method: method,
          message: fallbackError && fallbackError.message ? fallbackError.message : String(fallbackError)
        });
        throw fallbackError;
      }
    }finally{
      inFlight[method] = false;
    }
  }

  function makeProxy(baseApi){
    var proxy = {};
    Object.keys(baseApi || {}).forEach(function(key){ proxy[key] = baseApi[key]; });

    Object.keys(MIGRATION_MAP).forEach(function(method){
      proxy[method] = function(){
        return controlledCall(method, Array.prototype.slice.call(arguments));
      };
    });

    proxy.__chx3ControlledMigration = true;
    proxy.__chx3Version = VERSION;
    proxy.__chx3MigratedMethods = Object.keys(MIGRATION_MAP);
    return proxy;
  }

  function install(){
    var current = getPublicApi();
    if(!current){
      record('install-skipped', { reason: 'PETATOEChildrenExpenses missing' });
      return false;
    }
    if(current.__chx3ControlledMigration){
      record('install-skipped', { reason: 'already-installed' });
      return true;
    }
    window[LEGACY_BACKUP] = current;
    window[PUBLIC_API] = makeProxy(current);
    record('installed', { migratedMethods: Object.keys(MIGRATION_MAP) });
    return true;
  }

  function rollback(){
    var legacy = getLegacyApi();
    if(legacy){
      window[PUBLIC_API] = legacy;
      active = false;
      record('rollback', { restored: PUBLIC_API, active: active });
      return true;
    }
    record('rollback-failed', { reason: 'legacy-backup-missing' });
    return false;
  }

  function enable(){ active = true; record('enable', { active: active }); return snapshot(); }
  function disable(){ active = false; record('disable', { active: active }); return snapshot(); }

  function methodStatus(){
    return Object.keys(MIGRATION_MAP).map(function(method){
      var cfg = MIGRATION_MAP[method];
      var legacy = getLegacyApi();
      return {
        method: method,
        group: cfg.group,
        owner: cfg.owner,
        ownerMethod: cfg.method,
        ownerCallable: callable(cfg.owner, cfg.method),
        legacyCallable: !!(legacy && typeof legacy[method] === 'function'),
        controlled: true
      };
    });
  }

  function snapshot(){
    var api = getPublicApi();
    var legacy = getLegacyApi();
    var statuses = methodStatus();
    return {
      version: VERSION,
      mode: 'REAL_CONTROLLED_MIGRATION_WITH_FALLBACK',
      active: active,
      publicApiExists: !!api,
      publicApiWrapped: !!(api && api.__chx3ControlledMigration),
      legacyBackupExists: !!legacy,
      migratedMethodsCount: Object.keys(MIGRATION_MAP).length,
      migratedMethods: statuses,
      eventCount: events.length,
      recentEvents: events.slice(-12),
      safeguards: {
        legacyEngineDeleted: false,
        storageChanged: false,
        routerChanged: false,
        loaderChanged: false,
        navigationChanged: false,
        reportsChanged: false,
        payrollChanged: false,
        operationsChanged: false,
        fallbackAvailable: !!legacy,
        killSwitch: 'window.PETATOE_CHX3_DISABLE_CONTROLLED_MIGRATION = true'
      }
    };
  }

  function validate(){
    var snap = snapshot();
    var warnings = [];
    if(!snap.publicApiExists){ warnings.push('PETATOEChildrenExpenses is missing.'); }
    if(!snap.publicApiWrapped){ warnings.push('PETATOEChildrenExpenses is not wrapped by CHX3 controlled migration.'); }
    if(!snap.legacyBackupExists){ warnings.push('Legacy backup is missing; rollback is unavailable.'); }
    var missingOwners = snap.migratedMethods.filter(function(item){ return !item.ownerCallable; });
    if(missingOwners.length){ warnings.push('Some extracted owners are missing: ' + missingOwners.map(function(x){ return x.method + ' -> ' + x.owner; }).join(', ')); }
    var missingLegacy = snap.migratedMethods.filter(function(item){ return !item.legacyCallable; });
    if(missingLegacy.length){ warnings.push('Some legacy fallbacks are missing: ' + missingLegacy.map(function(x){ return x.method; }).join(', ')); }

    return {
      ok: warnings.length === 0,
      active: active,
      realControlledMigration: true,
      ownershipScope: 'selected children expenses public read/reset methods only',
      methodsControlled: snap.migratedMethodsCount,
      warnings: warnings,
      snapshot: snap
    };
  }

  window.PETATOEChildrenExpensesControlledMigration = {
    version: VERSION,
    mode: 'REAL_CONTROLLED_MIGRATION_WITH_FALLBACK',
    install: install,
    validate: validate,
    snapshot: snapshot,
    rollback: rollback,
    enable: enable,
    disable: disable,
    history: function(){ return events.slice(); },
    migratedMethods: function(){ return Object.keys(MIGRATION_MAP); },
    call: function(method){ return controlledCall(String(method || ''), Array.prototype.slice.call(arguments, 1)); }
  };

  install();

  if(document && document.addEventListener){
    document.addEventListener('DOMContentLoaded', function(){
      record('dom-ready-validation', { ok: validate().ok });
    });
  }
})(window, document);
