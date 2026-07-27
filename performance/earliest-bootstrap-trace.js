/* PETATOE Phase D3.6 — Earliest Bootstrap Trace (diagnostics only) */
(function earliestBootstrapTrace(global) {
  'use strict';
  if (!global || global.PETATOEEarliestBootstrapTrace) return;

  var perf = global.performance;
  var seed = global.__PETATOE_EARLIEST_BOOT || {};
  var events = Array.isArray(seed.events) ? seed.events : [];
  var spans = [];
  var openSpans = Object.create(null);
  var resourceEvents = [];
  var MAX_EVENTS = 600;
  var MAX_RESOURCES = 350;

  function now() { return perf && typeof perf.now === 'function' ? perf.now() : Date.now() - Number(seed.epoch || Date.now()); }
  function round(value) { return Math.round(Number(value || 0) * 10) / 10; }
  function safe(value) {
    if (value == null) return null;
    try { return JSON.parse(JSON.stringify(value)); } catch (_error) { return { value: String(value) }; }
  }
  function mark(name, detail) {
    if (!name || events.length >= MAX_EVENTS) return;
    events.push({ name: String(name), ms: round(now()), detail: safe(detail) });
  }
  function begin(name, detail) {
    name = String(name || 'unnamed');
    var token = name + '#' + String((openSpans[name] || 0) + 1);
    openSpans[name] = (openSpans[name] || 0) + 1;
    var row = { token: token, name: name, startMs: round(now()), endMs: null, durationMs: null, detail: safe(detail) };
    spans.push(row);
    mark('script-start', { token: token, name: name, detail: detail || null });
    return token;
  }
  function end(tokenOrName, detail) {
    var key = String(tokenOrName || '');
    var row = null;
    for (var i = spans.length - 1; i >= 0; i -= 1) {
      if (spans[i].endMs == null && (spans[i].token === key || spans[i].name === key)) { row = spans[i]; break; }
    }
    if (!row) { mark('script-end-unmatched', { key: key, detail: detail || null }); return; }
    row.endMs = round(now());
    row.durationMs = round(row.endMs - row.startMs);
    if (detail != null) row.endDetail = safe(detail);
    mark('script-end', { token: row.token, name: row.name, durationMs: row.durationMs, detail: detail || null });
  }
  function recordResource(entry) {
    if (!entry || resourceEvents.length >= MAX_RESOURCES) return;
    var name = String(entry.name || '');
    if (!name) return;
    resourceEvents.push({
      name: name,
      initiatorType: String(entry.initiatorType || ''),
      startMs: round(entry.startTime),
      responseStartMs: round(entry.responseStart),
      responseEndMs: round(entry.responseEnd),
      durationMs: round(entry.duration),
      transferSize: Number(entry.transferSize || 0),
      decodedBodySize: Number(entry.decodedBodySize || 0)
    });
  }
  function collectResources() {
    try { (perf.getEntriesByType('resource') || []).forEach(recordResource); } catch (_error) {}
  }
  function report() {
    collectResources();
    var nav = null;
    try {
      var rows = perf.getEntriesByType('navigation') || [];
      if (rows[0]) nav = {
        startTimeMs: round(rows[0].startTime), responseStartMs: round(rows[0].responseStart), responseEndMs: round(rows[0].responseEnd),
        domInteractiveMs: round(rows[0].domInteractive), domContentLoadedMs: round(rows[0].domContentLoadedEventEnd), loadEventMs: round(rows[0].loadEventEnd)
      };
    } catch (_error) {}
    return {
      version: '10.0.25-d3-6-earliest-bootstrap-trace',
      seedStartMs: round(Number(seed.startMs || 0)),
      generatedAtMs: round(now()),
      documentReadyState: global.document ? global.document.readyState : '',
      navigation: nav,
      spans: spans.slice(),
      events: events.slice(),
      resources: resourceEvents.slice()
    };
  }

  mark('earliest-tracer-eval', { readyState: global.document ? global.document.readyState : '' });

  try {
    if (global.PerformanceObserver) {
      var observer = new PerformanceObserver(function (list) { list.getEntries().forEach(recordResource); });
      observer.observe({ entryTypes: ['resource'] });
    }
  } catch (_error) {}

  if (global.document) {
    global.document.addEventListener('readystatechange', function () { mark('document-ready-state', { state: global.document.readyState }); });
    global.document.addEventListener('DOMContentLoaded', function () { mark('earliest-dom-content-loaded'); }, { once: true });
  }
  global.addEventListener('load', function () { mark('earliest-window-load'); collectResources(); }, { once: true });

  global.PETATOEEarliestBootstrapTrace = {
    version: '10.0.25-d3-6-earliest-bootstrap-trace',
    mark: mark,
    begin: begin,
    end: end,
    getReport: report
  };
  seed.mark = mark;
  seed.begin = begin;
  seed.end = end;
  global.__PETATOE_EARLIEST_BOOT = seed;
})(window);
