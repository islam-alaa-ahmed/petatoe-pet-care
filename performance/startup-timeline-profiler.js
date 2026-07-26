(function startupTimelineProfiler(global) {
  'use strict';

  if (!global || global.PETATOEStartupTimeline) return;

  var VERSION = '10.0.25-c1-8-script-by-script';
  var startedAt = (global.performance && typeof global.performance.now === 'function')
    ? global.performance.now()
    : Date.now();
  var epochStartedAt = Date.now();
  var events = [];
  var wrapped = Object.create(null);
  var STORAGE_KEY = 'petatoe_startup_timeline_latest';
  var MAX_EVENTS = 700;

  function now() {
    return (global.performance && typeof global.performance.now === 'function')
      ? global.performance.now()
      : (Date.now() - epochStartedAt + startedAt);
  }

  function round(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function safeDetail(detail) {
    if (detail == null) return null;
    try {
      return JSON.parse(JSON.stringify(detail, function (_key, value) {
        if (typeof value === 'function') return '[function]';
        if (value instanceof Error) return { name: value.name, message: value.message };
        return value;
      }));
    } catch (_error) {
      return { value: String(detail) };
    }
  }

  function persist() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildReport()));
    } catch (_error) {}
  }

  function mark(name, detail) {
    if (!name) return null;
    var entry = {
      index: events.length + 1,
      name: String(name),
      ms: round(now()),
      epochMs: Date.now(),
      detail: safeDetail(detail)
    };
    events.push(entry);
    if (events.length > MAX_EVENTS) events.shift();
    try {
      if (global.performance && typeof global.performance.mark === 'function') {
        global.performance.mark('petatoe:' + entry.name);
      }
    } catch (_error) {}
    persist();
    try { global.dispatchEvent(new CustomEvent('petatoe:startup-timeline-event', { detail: entry })); } catch (_error) {}
    return entry;
  }

  function getHeadScriptDurations() {
    var starts = Object.create(null);
    var rows = [];
    events.forEach(function (entry) {
      if (entry.name !== 'head-script:start' && entry.name !== 'head-script:end') return;
      var detail = entry.detail || {};
      var key = String(detail.index || '') + '|' + String(detail.label || '');
      if (entry.name === 'head-script:start') {
        starts[key] = entry;
        return;
      }
      var start = starts[key];
      if (!start) return;
      rows.push({
        index: detail.index,
        label: detail.label,
        kind: detail.kind,
        defer: !!detail.defer,
        async: !!detail.async,
        startMs: start.ms,
        endMs: entry.ms,
        durationMs: round(entry.ms - start.ms)
      });
    });
    return rows;
  }

  function getHeadScriptTextReport() {
    return getHeadScriptDurations().map(function (row) {
      return String(row.durationMs).padStart(8, ' ') + ' ms  #' + row.index + ' ' + row.label +
        (row.defer ? ' [defer]' : '') + (row.async ? ' [async]' : '');
    }).join('\n');
  }

  function buildReport() {
    var nav = global.navigator || {};
    return {
      version: VERSION,
      url: String(global.location && global.location.href || ''),
      userAgent: String(nav.userAgent || ''),
      startedEpochMs: epochStartedAt,
      generatedEpochMs: Date.now(),
      durationMs: round(now()),
      documentReadyState: global.document ? global.document.readyState : 'unavailable',
      events: events.slice()
    };
  }

  function getReport() {
    return buildReport();
  }

  function getTextReport() {
    return buildReport().events.map(function (entry) {
      var detail = entry.detail == null ? '' : ' ' + JSON.stringify(entry.detail);
      return String(entry.ms).padStart(8, ' ') + ' ms  ' + entry.name + detail;
    }).join('\n');
  }

  function clear() {
    events.length = 0;
    try { global.localStorage.removeItem(STORAGE_KEY); } catch (_error) {}
    mark('profiler-cleared');
  }

  function wrapMethod(owner, methodName, label) {
    if (!owner || typeof owner[methodName] !== 'function') return false;
    var key = label + ':' + methodName;
    if (wrapped[key] || owner[methodName].__petatoeStartupWrapped) return true;
    var original = owner[methodName];
    var wrappedMethod = function () {
      var args = Array.prototype.slice.call(arguments);
      mark(label + ':start', { method: methodName });
      var result;
      try {
        result = original.apply(this, args);
      } catch (error) {
        mark(label + ':error', { method: methodName, error: error });
        throw error;
      }
      if (result && typeof result.then === 'function') {
        return result.then(function (value) {
          mark(label + ':end', { method: methodName });
          return value;
        }, function (error) {
          mark(label + ':error', { method: methodName, error: error });
          throw error;
        });
      }
      mark(label + ':end', { method: methodName });
      return result;
    };
    try {
      Object.defineProperty(wrappedMethod, '__petatoeStartupWrapped', { value: true });
      owner[methodName] = wrappedMethod;
      wrapped[key] = true;
      mark('hook-installed', { label: label, method: methodName });
      return true;
    } catch (_error) {
      return false;
    }
  }

  function observeElement(id, eventPrefix) {
    if (!global.document) return;
    function capture(element, state) {
      if (!element || element.__petatoeStartupObserved) return;
      element.__petatoeStartupObserved = true;
      mark(eventPrefix + ':created', { state: state });
      try {
        var style = global.getComputedStyle(element);
        mark(eventPrefix + ':style', {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity
        });
      } catch (_error) {}
      try {
        var observer = new MutationObserver(function () {
          var computed = global.getComputedStyle(element);
          mark(eventPrefix + ':mutation', {
            className: element.className || '',
            hidden: !!element.hidden,
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity
          });
        });
        observer.observe(element, { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
      } catch (_error) {}
    }

    var existing = global.document.getElementById(id);
    if (existing) capture(existing, 'existing');

    try {
      var rootObserver = new MutationObserver(function () {
        var element = global.document.getElementById(id);
        if (element) capture(element, 'inserted');
      });
      rootObserver.observe(global.document.documentElement, { childList: true, subtree: true });
    } catch (_error) {}
  }

  function installPaintObserver() {
    if (!global.PerformanceObserver) return;
    try {
      var observer = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          mark('paint:' + entry.name, { startTime: round(entry.startTime) });
        });
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch (_error) {}
  }

  function installLongTaskObserver() {
    if (!global.PerformanceObserver) return;
    try {
      var observer = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          mark('long-task', { startTime: round(entry.startTime), duration: round(entry.duration) });
        });
      });
      observer.observe({ type: 'longtask', buffered: true });
    } catch (_error) {}
  }

  function installRuntimeHooks() {
    var attempts = 0;
    var timer = global.setInterval(function () {
      attempts += 1;

      if (global.PETATOE_I18N_BOOT) {
        wrapMethod(global.PETATOE_I18N_BOOT, 'reveal', 'i18n:reveal');
      }
      if (global.PETATOEAuth) {
        wrapMethod(global.PETATOEAuth, 'restore', 'auth:restore');
        wrapMethod(global.PETATOEAuth, 'validateSession', 'auth:validate-session');
        wrapMethod(global.PETATOEAuth, 'loginWithBiometric', 'auth:biometric-login');
      }
      if (typeof global.loadRecords === 'function') {
        wrapMethod(global, 'loadRecords', 'dashboard:load-records');
      }
      if (typeof global.renderDashboardAll === 'function') {
        wrapMethod(global, 'renderDashboardAll', 'dashboard:first-render');
      }
      if (typeof global.renderDashboard === 'function') {
        wrapMethod(global, 'renderDashboard', 'dashboard:render');
      }
      if (global.PETATOENativeBiometricAuth) {
        wrapMethod(global.PETATOENativeBiometricAuth, 'authenticate', 'native:biometric-authenticate');
        wrapMethod(global.PETATOENativeBiometricAuth, 'login', 'native:biometric-login');
      }

      if (attempts >= 600) {
        global.clearInterval(timer);
        mark('runtime-hook-window-ended', { attempts: attempts });
      }
    }, 50);
  }

  global.PETATOEStartupTimeline = {
    version: VERSION,
    mark: mark,
    getReport: getReport,
    getTextReport: getTextReport,
    getHeadScriptDurations: getHeadScriptDurations,
    getHeadScriptTextReport: getHeadScriptTextReport,
    clear: clear,
    storageKey: STORAGE_KEY
  };
  global.__PETATOE_STARTUP_TIMELINE__ = events;

  mark('profiler-script-start');
  installPaintObserver();
  installLongTaskObserver();
  observeElement('petV10MobileRoot', 'mobile-root');
  observeElement('petatoeLoader', 'legacy-loader');
  installRuntimeHooks();

  if (global.document) {
    global.document.addEventListener('readystatechange', function () {
      mark('document-ready-state', { state: global.document.readyState });
    });
    global.document.addEventListener('DOMContentLoaded', function () {
      mark('dom-content-loaded');
    }, { once: true });
  }
  global.addEventListener('load', function () {
    mark('window-load');
    global.setTimeout(function () { mark('startup-snapshot-5s'); }, 5000);
    global.setTimeout(function () { mark('startup-snapshot-15s'); }, 15000);
  }, { once: true });
  global.addEventListener('error', function (event) {
    mark('window-error', { message: event && event.message, source: event && event.filename, line: event && event.lineno });
  });
  global.addEventListener('unhandledrejection', function (event) {
    mark('unhandled-rejection', { reason: event && event.reason });
  });
})(window);
