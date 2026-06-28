/*
 * PETATOE OPX6 — Operations Real Controlled Migration
 * ----------------------------------------------------
 * REAL / GUARDED / LIMITED.
 *
 * This file is the first controlled migration layer after OPX2-OPX5.
 * It does NOT delete operations-legacy-engine.js and does NOT change storage,
 * router, loader, reports, payroll, warehouse, treasury, or navigation logic.
 *
 * What it does:
 * - Keeps the public API name window.PETATOEAppointments unchanged.
 * - Wraps selected low-risk operations methods with a guarded proxy.
 * - Delegates to extracted operations modules when available.
 * - Falls back immediately to the legacy public API on missing modules/errors.
 * - Exposes validate(), snapshot(), rollback(), enable(), disable().
 *
 * Emergency kill switch before load:
 *   window.PETATOE_OPX6_DISABLE_CONTROLLED_MIGRATION = true;
 */
(function initPETATOEOperationsControlledMigration(window, document){
  'use strict';

  var VERSION = 'PETATOE_v6.4.30_PHASE_OPX6_REAL_CONTROLLED_MIGRATION';
  var PUBLIC_API = 'PETATOEAppointments';
  var LEGACY_BACKUP = '__PETATOEAppointmentsBeforeOPX6ControlledMigration';
  var active = !window.PETATOE_OPX6_DISABLE_CONTROLLED_MIGRATION;
  var events = [];
  var inFlight = {};

  var MIGRATION_MAP = {
    // Reports render boundary — extracted module already exists and has legacy fallback.
    renderVehicleExecutionReports: {
      owner: 'PETATOEOperationsReports',
      method: 'renderVehicleExecutionReports',
      group: 'reports',
      level: 'controlled-real'
    },
    renderOperationsKpiDashboard: {
      owner: 'PETATOEOperationsReports',
      method: 'renderOperationsKpiDashboard',
      group: 'reports',
      level: 'controlled-real'
    },
    renderDailyOperations: {
      owner: 'PETATOEOperationsReports',
      method: 'renderDailyOperations',
      group: 'reports',
      level: 'controlled-real'
    },

    // Status workflow actions — extracted status module already exists and has legacy fallback.
    setVehicleStatusById: {
      owner: 'PETATOEOperationsStatusActions',
      method: 'setVehicleStatusById',
      group: 'workflow-status',
      level: 'controlled-real'
    },
    nextVehicleStatusById: {
      owner: 'PETATOEOperationsStatusActions',
      method: 'nextVehicleStatusById',
      group: 'workflow-status',
      level: 'controlled-real'
    },

    // Payment/session actions — extracted payment module already exists and has legacy fallback.
    saveVehicleSessionById: {
      owner: 'PETATOEOperationsPaymentsActions',
      method: 'saveVehicleSessionById',
      group: 'payments',
      level: 'controlled-real'
    },
    handlePaymentAttachment: {
      owner: 'PETATOEOperationsPaymentsActions',
      method: 'handlePaymentAttachment',
      group: 'payments',
      level: 'controlled-real'
    }
  };

  function now(){
    try { return new Date().toISOString(); }
    catch(e){ return String(Date.now()); }
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
    if(api && api !== window.PETATOEOperationsControlledMigration && typeof api[method] === 'function'){
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
    try {
      record('controlled-call', { method: method, owner: cfg.owner, group: cfg.group });
      return ownerApi[cfg.method].apply(ownerApi, args);
    } catch(error){
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
    } finally {
      inFlight[method] = false;
    }
  }

  function makeProxy(baseApi){
    var proxy = {};
    Object.keys(baseApi || {}).forEach(function(key){
      proxy[key] = baseApi[key];
    });

    Object.keys(MIGRATION_MAP).forEach(function(method){
      proxy[method] = function(){
        return controlledCall(method, Array.prototype.slice.call(arguments));
      };
    });

    proxy.__opx6ControlledMigration = true;
    proxy.__opx6Version = VERSION;
    proxy.__opx6MigratedMethods = Object.keys(MIGRATION_MAP);
    return proxy;
  }

  function install(){
    var current = getPublicApi();
    if(!current){
      record('install-skipped', { reason: 'PETATOEAppointments missing' });
      return false;
    }

    if(current.__opx6ControlledMigration){
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
      publicApiWrapped: !!(api && api.__opx6ControlledMigration),
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
        fallbackAvailable: !!legacy,
        killSwitch: 'window.PETATOE_OPX6_DISABLE_CONTROLLED_MIGRATION = true'
      }
    };
  }

  function validate(){
    var snap = snapshot();
    var warnings = [];
    if(!snap.publicApiExists){ warnings.push('PETATOEAppointments is missing.'); }
    if(!snap.publicApiWrapped){ warnings.push('PETATOEAppointments is not wrapped by OPX6 controlled migration.'); }
    if(!snap.legacyBackupExists){ warnings.push('Legacy backup is missing; rollback is unavailable.'); }
    var missingOwners = snap.migratedMethods.filter(function(item){ return !item.ownerCallable; });
    if(missingOwners.length){ warnings.push('Some extracted owners are missing: ' + missingOwners.map(function(x){ return x.method + ' -> ' + x.owner; }).join(', ')); }
    var missingLegacy = snap.migratedMethods.filter(function(item){ return !item.legacyCallable; });
    if(missingLegacy.length){ warnings.push('Some legacy fallbacks are missing: ' + missingLegacy.map(function(x){ return x.method; }).join(', ')); }

    return {
      ok: warnings.length === 0,
      active: active,
      realControlledMigration: true,
      ownershipScope: 'selected operations public methods only',
      methodsControlled: snap.migratedMethodsCount,
      warnings: warnings,
      snapshot: snap
    };
  }

  window.PETATOEOperationsControlledMigration = {
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
