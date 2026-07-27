(function startupTimelineProfiler(global) {
  'use strict';

  if (!global || global.PETATOEStartupTimeline) return;

  var VERSION = '10.0.25-d3-2-css-isolation';
  var startedAt = (global.performance && typeof global.performance.now === 'function')
    ? global.performance.now()
    : Date.now();
  var epochStartedAt = Date.now();
  var events = [];
  var wrapped = Object.create(null);
  var STORAGE_KEY = 'petatoe_startup_timeline_latest';
  var MAX_EVENTS = 700;

  var HEAD_RESOURCE_MAP = {
    1: 'css/mobile/mobile-first-paint.css',
    2: 'css/i18n/bootstrap.css',
    3: 'css/pwa/pwa-enterprise.css',
    10: 'css/core/tokens.css',
    11: 'css/core/layout-boundary.css',
    12: 'css/core/app-shell-boundary.css',
    13: 'css/core/components-boundary.css',
    14: 'css/core/utilities-boundary.css',
    15: 'css/main.css',
    16: 'css/components/theme.css'
  };

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


  function getHeadResourceDurations() {
    var starts = Object.create(null);
    var loads = Object.create(null);
    var rows = [];
    events.forEach(function (entry) {
      if (entry.name !== 'head-resource:start' && entry.name !== 'head-resource:after' && entry.name !== 'head-resource:load' && entry.name !== 'head-resource:error') return;
      var detail = entry.detail || {};
      var key = String(detail.index || '') + '|' + String(detail.label || '');
      if (entry.name === 'head-resource:start') {
        starts[key] = entry;
        return;
      }
      if (entry.name === 'head-resource:load' || entry.name === 'head-resource:error') {
        loads[key] = entry;
        return;
      }
      var start = starts[key];
      if (!start) return;
      var load = loads[key];
      rows.push({
        index: detail.index,
        label: HEAD_RESOURCE_MAP[Number(detail.index)] || detail.label,
        rawLabel: detail.label,
        rel: detail.rel,
        startMs: start.ms,
        afterMs: entry.ms,
        parserBlockMs: round(entry.ms - start.ms),
        loadMs: load ? round(load.ms - start.ms) : null,
        status: load ? (load.name === 'head-resource:error' ? 'error' : 'loaded') : 'pending-or-cached'
      });
    });
    return rows;
  }

  function getHeadResourceTextReport() {
    return getHeadResourceDurations().map(function (row) {
      var load = row.loadMs == null ? 'n/a' : String(row.loadMs);
      return String(row.parserBlockMs).padStart(8, ' ') + ' ms block | ' +
        String(load).padStart(8, ' ') + ' ms load | #' + row.index + ' [' + row.rel + '] ' + row.label + ' [' + row.status + ']';
    }).join('\n');
  }

  function captureResourceTiming(stage) {
    if (!global.performance || typeof global.performance.getEntriesByType !== 'function') return;
    try {
      global.performance.getEntriesByType('resource').forEach(function (entry) {
        var name = String(entry.name || '');
        if (!name) return;
        mark('resource-timing', {
          stage: stage,
          name: name,
          initiatorType: entry.initiatorType || '',
          startTime: round(entry.startTime),
          duration: round(entry.duration),
          responseEnd: round(entry.responseEnd),
          transferSize: Number(entry.transferSize || 0),
          encodedBodySize: Number(entry.encodedBodySize || 0),
          decodedBodySize: Number(entry.decodedBodySize || 0)
        });
      });
    } catch (_error) {}
  }


  function getCssIsolationSummary() {
    var report = buildReport();
    var modeEvent = null;
    var fcp = null;
    var mobileRoot = null;
    report.events.forEach(function (entry) {
      if (entry.name === 'css-isolation-mode') modeEvent = entry;
      if (entry.name === 'paint:first-contentful-paint') fcp = entry;
      if (entry.name === 'mobile-root:created' && !mobileRoot) mobileRoot = entry;
    });
    var mainRow = getHeadResourceDurations().filter(function (row) { return Number(row.index) === 15; })[0] || null;
    var mainTiming = null;
    try {
      var resources = global.performance && global.performance.getEntriesByType ? global.performance.getEntriesByType('resource') : [];
      for (var i = 0; i < resources.length; i += 1) {
        var resourceName = String(resources[i].name || '');
        if (/\/css\/main(?:-fontless-test)?\.css(?:\?|$)/.test(resourceName)) {
          mainTiming = {
            name: resourceName,
            startTime: round(resources[i].startTime),
            duration: round(resources[i].duration),
            responseEnd: round(resources[i].responseEnd),
            transferSize: Number(resources[i].transferSize || 0),
            decodedBodySize: Number(resources[i].decodedBodySize || 0)
          };
          break;
        }
      }
    } catch (_error) {}
    return {
      profilerVersion: VERSION,
      mode: modeEvent && modeEvent.detail ? modeEvent.detail.mode : 'unknown',
      mainCss: mainRow,
      mainCssResourceTiming: mainTiming,
      mobileRootCreatedMs: mobileRoot ? mobileRoot.ms : null,
      firstContentfulPaintMs: fcp && fcp.detail ? fcp.detail.startTime : null,
      domContentLoadedMs: (report.events.filter(function (entry) { return entry.name === 'dom-content-loaded'; })[0] || {}).ms || null,
      syntaxErrors: report.events.filter(function (entry) {
        return entry.name === 'window-error' && entry.detail && /Unexpected end of script/i.test(String(entry.detail.message || ''));
      }).length
    };
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
    getHeadResourceDurations: getHeadResourceDurations,
    getHeadResourceTextReport: getHeadResourceTextReport,
    getCssIsolationSummary: getCssIsolationSummary,
    captureResourceTiming: captureResourceTiming,
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
      captureResourceTiming('dom-content-loaded');
    }, { once: true });
  }
  global.addEventListener('load', function () {
    mark('window-load');
    captureResourceTiming('window-load');
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
