/* PETATOE Phase D3.3 — Clean Startup Probe (mobile-safe, in-memory only during startup) */
(function startupCleanProfiler(global) {
  'use strict';
  if (!global || global.PETATOEStartupDiagnostics) return;

  var VERSION = '10.0.25-d3-3-clean-startup-probe';
  var perf = global.performance;
  var startEpoch = Date.now();
  var events = [];
  var longTasks = [];
  var errors = [];
  var finalized = false;
  var finalizedAtMs = null;
  var MAX_EVENTS = 120;
  var MAX_LONG_TASKS = 40;

  function now() {
    return perf && typeof perf.now === 'function' ? perf.now() : Date.now() - startEpoch;
  }
  function round(value) { return Math.round(Number(value || 0) * 10) / 10; }
  function safe(value) {
    if (value == null) return null;
    try {
      return JSON.parse(JSON.stringify(value, function (_key, item) {
        if (typeof item === 'function') return '[function]';
        if (item instanceof Error) return { name: item.name, message: item.message };
        return item;
      }));
    } catch (_error) { return { value: String(value) }; }
  }
  function mark(name, detail) {
    if (!name || events.length >= MAX_EVENTS) return;
    events.push({ name: String(name), ms: round(now()), detail: safe(detail) });
  }
  function firstEntry(type) {
    try {
      var list = perf && perf.getEntriesByType ? perf.getEntriesByType(type) : [];
      return list && list.length ? list[0] : null;
    } catch (_error) { return null; }
  }
  function resources() {
    var rows = [];
    try {
      (perf.getEntriesByType('resource') || []).forEach(function (entry) {
        var name = String(entry.name || '');
        if (!name) return;
        rows.push({
          name: name,
          initiatorType: String(entry.initiatorType || ''),
          startMs: round(entry.startTime),
          durationMs: round(entry.duration),
          responseEndMs: round(entry.responseEnd),
          transferSize: Number(entry.transferSize || 0),
          decodedBodySize: Number(entry.decodedBodySize || 0)
        });
      });
    } catch (_error) {}
    return rows;
  }
  function milestones() {
    var map = {};
    events.forEach(function (entry) {
      if (map[entry.name] == null) map[entry.name] = entry.ms;
    });
    return map;
  }
  function paintRows() {
    var rows = [];
    try {
      (perf.getEntriesByType('paint') || []).forEach(function (entry) {
        rows.push({ name: entry.name, startMs: round(entry.startTime) });
      });
    } catch (_error) {}
    return rows;
  }
  function navigationRow() {
    var nav = firstEntry('navigation');
    if (!nav) return null;
    return {
      type: String(nav.type || ''),
      responseStartMs: round(nav.responseStart),
      responseEndMs: round(nav.responseEnd),
      domInteractiveMs: round(nav.domInteractive),
      domContentLoadedMs: round(nav.domContentLoadedEventEnd),
      loadEventMs: round(nav.loadEventEnd),
      transferSize: Number(nav.transferSize || 0),
      decodedBodySize: Number(nav.decodedBodySize || 0)
    };
  }
  function metric(name, fallback) {
    var map = milestones();
    return map[name] == null ? fallback : map[name];
  }
  function buildSummary() {
    var paints = paintRows();
    var fcp = null;
    paints.forEach(function (row) { if (row.name === 'first-contentful-paint') fcp = row.startMs; });
    var nav = navigationRow();
    var rootMs = metric('mobile-root-detected', null);
    var largestLongTask = 0;
    var totalLongTask = 0;
    longTasks.forEach(function (task) {
      totalLongTask += Number(task.durationMs || 0);
      largestLongTask = Math.max(largestLongTask, Number(task.durationMs || 0));
    });
    return {
      startupDurationMs: round(finalizedAtMs == null ? now() : finalizedAtMs),
      firstContentfulPaintMs: fcp,
      mobileRootMs: rootMs,
      domContentLoadedMs: nav ? nav.domContentLoadedMs : metric('dom-content-loaded', null),
      windowLoadMs: nav && nav.loadEventMs ? nav.loadEventMs : metric('window-load', null),
      longTaskCount: longTasks.length,
      totalLongTaskMs: round(totalLongTask),
      largestLongTaskMs: round(largestLongTask),
      resourceCount: resources().length,
      errorCount: errors.length
    };
  }
  function buildReport() {
    return {
      reportType: 'PETATOE Enterprise Startup Diagnostics',
      profilerVersion: VERSION,
      releaseVersion: String(global.PETATOE_RELEASE_VERSION || ''),
      releaseName: String(global.PETATOE_RELEASE_NAME || ''),
      generatedAt: new Date().toISOString(),
      url: String(global.location && global.location.href || ''),
      language: String(global.document && global.document.documentElement.lang || ''),
      userAgent: String(global.navigator && global.navigator.userAgent || ''),
      viewport: { width: Number(global.innerWidth || 0), height: Number(global.innerHeight || 0), dpr: Number(global.devicePixelRatio || 1) },
      online: global.navigator ? global.navigator.onLine !== false : true,
      summary: buildSummary(),
      navigation: navigationRow(),
      paints: paintRows(),
      milestones: milestones(),
      longTasks: longTasks.slice(),
      resources: resources(),
      errors: errors.slice(),
      events: events.slice()
    };
  }
  function textReport() { return JSON.stringify(buildReport(), null, 2); }
  function finalize() {
    if (finalized) return;
    finalizedAtMs = now();
    finalized = true;
    mark('diagnostics-finalized');
    /* One persistence write only, after startup has completed. */
    try { global.localStorage.setItem('petatoe_startup_diagnostics_latest', textReport()); } catch (_error) {}
  }
  function detectMobileRoot(reason) {
    var root = global.document && global.document.getElementById('petV10MobileRoot');
    if (root && !root.__petatoeCleanProbeDetected) {
      root.__petatoeCleanProbeDetected = true;
      var rect = null;
      try { rect = root.getBoundingClientRect(); } catch (_error) {}
      mark('mobile-root-detected', { reason: reason, width: rect ? round(rect.width) : null, height: rect ? round(rect.height) : null });
      try {
        global.requestAnimationFrame(function () { mark('mobile-root-first-frame'); });
      } catch (_error) {}
      return true;
    }
    return false;
  }

  mark('probe-start');

  try {
    if (global.PerformanceObserver) {
      var longTaskObserver = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (longTasks.length >= MAX_LONG_TASKS) return;
          longTasks.push({ startMs: round(entry.startTime), durationMs: round(entry.duration), name: String(entry.name || 'longtask') });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  } catch (_error) {}

  global.addEventListener('error', function (event) {
    if (errors.length >= 20) return;
    errors.push({ type: 'error', ms: round(now()), message: String(event.message || ''), source: String(event.filename || ''), line: Number(event.lineno || 0), column: Number(event.colno || 0) });
  }, true);
  global.addEventListener('unhandledrejection', function (event) {
    if (errors.length >= 20) return;
    errors.push({ type: 'unhandledrejection', ms: round(now()), message: String(event.reason && (event.reason.message || event.reason) || '') });
  });

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', function () { mark('dom-content-loaded'); detectMobileRoot('dom-content-loaded'); }, { once: true });
    } else {
      mark('dom-content-loaded-already');
    }
    try {
      var rootObserver = new MutationObserver(function () {
        if (detectMobileRoot('mutation')) rootObserver.disconnect();
      });
      rootObserver.observe(global.document.documentElement, { childList: true, subtree: true });
    } catch (_error) {}
    detectMobileRoot('probe-start');
  }

  global.addEventListener('load', function () {
    mark('window-load');
    detectMobileRoot('window-load');
    global.setTimeout(finalize, 1200);
  }, { once: true });
  global.addEventListener('pageshow', function (event) { mark('page-show', { persisted: !!event.persisted }); }, { once: true });
  global.addEventListener('petatoe:mobile-runtime-ready', function () { mark('mobile-runtime-ready'); });
  global.addEventListener('petatoe:navigation-ready', function () { mark('navigation-ready'); });
  global.addEventListener('petatoe:dashboard-rendered', function () { mark('dashboard-rendered'); });

  global.PETATOEStartupDiagnostics = {
    version: VERSION,
    mark: mark,
    getSummary: buildSummary,
    getReport: buildReport,
    getTextReport: textReport,
    finalize: finalize,
    clearStoredReport: function () { try { global.localStorage.removeItem('petatoe_startup_diagnostics_latest'); } catch (_error) {} }
  };
})(window);
