/*
 * PETATOE v6.5.5 — External Script Errors & CDN Hardening
 * Scope: passive diagnostics + CDN loading visibility only.
 * Does not change Router, Storage, Permissions, or business data.
 */
(function () {
  'use strict';
  var VERSION = 'v6.5.5';
  var startedAt = new Date().toISOString();
  var state = window.PETATOECDNHardening && window.PETATOECDNHardening._state || {
    startedAt: startedAt,
    libraryChecks: [],
    cdnScripts: [],
    notes: []
  };

  function safeString(value) { return String(value == null ? '' : value); }
  function isExternal(src) { return /^https?:\/\//i.test(safeString(src)); }
  function getHost(src) {
    try { return new URL(src, window.location.href).host; } catch (e) { return ''; }
  }
  function getScriptRows() {
    var rows = [];
    try {
      Array.prototype.slice.call(document.querySelectorAll('script[src]')).forEach(function (script) {
        var src = script.getAttribute('src') || '';
        if (!isExternal(src)) { return; }
        rows.push({
          src: src,
          host: getHost(src),
          cdn: script.getAttribute('data-petatoe-cdn') || '',
          crossorigin: script.getAttribute('crossorigin') || '',
          referrerpolicy: script.getAttribute('referrerpolicy') || '',
          async: !!script.async,
          defer: !!script.defer,
          loadedGlobal: /xlsx/i.test(src) ? !!window.XLSX : (/chart/i.test(src) ? !!window.Chart : null)
        });
      });
    } catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('performance/cdn-hardening.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('performance/cdn-hardening.js',_petatoeSilentCatch);}}
    return rows;
  }
  function getPerformanceRows() {
    var rows = [];
    try {
      if (!window.performance || typeof window.performance.getEntriesByType !== 'function') { return rows; }
      var entries = window.performance.getEntriesByType('resource') || [];
      entries.forEach(function (entry) {
        var name = entry && entry.name || '';
        if (!isExternal(name)) { return; }
        if (!/cdnjs|chart|xlsx/i.test(name)) { return; }
        rows.push({
          src: name,
          host: getHost(name),
          duration: Math.round(entry.duration || 0),
          transferSize: entry.transferSize || 0,
          decodedBodySize: entry.decodedBodySize || 0,
          status: 'observed'
        });
      });
    } catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('performance/cdn-hardening.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('performance/cdn-hardening.js',_petatoeSilentCatch);}}
    return rows;
  }
  function getExternalErrorCount() {
    var count = 0;
    var latest = [];
    try {
      var diag = window.PETATOEDiagnostics;
      var errors = diag && typeof diag.getErrors === 'function' ? (diag.getErrors() || []) : [];
      errors.forEach(function (event) {
        var payload = event && event.payload || {};
        var msg = safeString(payload.message || '').trim();
        var filename = safeString(payload.filename || '');
        var external = !!payload.externalScriptError || msg === 'Script error.' || msg === 'Script error' || (isExternal(filename) && filename.indexOf(window.location.origin) !== 0);
        if (external) {
          count += 1;
          if (latest.length < 5) { latest.push({ message: msg || 'External script error', filename: filename || 'cross-origin', source: event.source || 'window.error' }); }
        }
      });
    } catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('performance/cdn-hardening.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('performance/cdn-hardening.js',_petatoeSilentCatch);}}
    return { count: count, latest: latest };
  }
  function checkLibraries() {
    var checks = [
      { key: 'xlsx', name: 'XLSX', present: !!window.XLSX, stub: !!window.__PETATOE_XLSX_STUB__ },
      { key: 'chartjs', name: 'Chart.js', present: !!window.Chart, stub: !!window.__PETATOE_CHART_STUB__ }
    ];
    state.libraryChecks = checks;
    return checks;
  }
  function getSnapshot() {
    var cdnScripts = getScriptRows();
    var perf = getPerformanceRows();
    var errors = getExternalErrorCount();
    var libraries = checkLibraries();
    var hardenedScripts = cdnScripts.filter(function (x) { return !!x.crossorigin && !!x.referrerpolicy; }).length;
    var missingHardening = cdnScripts.filter(function (x) { return !x.crossorigin || !x.referrerpolicy; });
    var allLibrariesPresent = libraries.every(function (x) { return x.present; });
    var allExpectedHardened = cdnScripts.length ? (missingHardening.length === 0) : true;
    var readiness = 100;
    if (!allLibrariesPresent) { readiness -= 25; }
    if (!allExpectedHardened) { readiness -= 20; }
    if (errors.count > 0) { readiness -= Math.min(20, Math.ceil(errors.count / 5)); }
    readiness = Math.max(0, Math.min(100, readiness));
    return {
      enabled: true,
      version: VERSION,
      mode: 'cdn-crossorigin-hardening',
      startedAt: state.startedAt,
      cdnScripts: cdnScripts,
      externalScriptCount: cdnScripts.length,
      hardenedScriptCount: hardenedScripts,
      missingHardening: missingHardening,
      performanceEntries: perf,
      libraries: libraries,
      externalErrors: errors,
      readinessScore: readiness,
      recommendation: allExpectedHardened ? 'CDN scripts include crossorigin/referrerpolicy. Continue monitoring external errors without blocking release unless internal errors appear.' : 'Add crossorigin/referrerpolicy to all external scripts before final green certification.'
    };
  }
  function emitBoot() {
    try {
      var diag = window.PETATOEDiagnostics;
      if (diag && typeof diag.info === 'function') {
        diag.info('cdn-hardening', { message: 'CDN hardening snapshot layer initialized', version: VERSION, snapshot: getSnapshot() });
      }
    } catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('performance/cdn-hardening.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('performance/cdn-hardening.js',_petatoeSilentCatch);}}
  }
  window.PETATOECDNHardening = {
    version: VERSION,
    _state: state,
    getSnapshot: getSnapshot,
    ping: function () { return { ok: true, version: VERSION, timestamp: new Date().toISOString() }; }
  };
  setTimeout(emitBoot, 0);
}());
