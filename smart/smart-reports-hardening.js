/* PETATOE v6.4.169 - Smart Reports Enterprise Hardening (A5.6.4)
   Non-invasive runtime hardening and health checks for Smart Reports.
   Scope: smart reports only. Source remains invoices/records only. */
(function(){
  'use strict';

  if(window.__PETATOE_SMART_REPORTS_HARDENING_A5_6_4__) return;
  window.__PETATOE_SMART_REPORTS_HARDENING_A5_6_4__ = true;

  var startedAt = Date.now ? Date.now() : +new Date();
  var state = {
    version: 'v6.4.169',
    phase: 'A5.6.4_ENTERPRISE_HARDENING',
    errors: [],
    warnings: [],
    lastReport: null
  };

  function now(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function warn(message, detail){
    var item = {time: new Date().toISOString(), message: message, detail: detail || null};
    state.warnings.push(item);
    if(window.console && typeof console.warn === 'function') console.warn('[PETATOE Smart Hardening]', message, detail || '');
  }

  function error(message, detail){
    var item = {time: new Date().toISOString(), message: message, detail: detail || null};
    state.errors.push(item);
    if(window.console && typeof console.error === 'function') console.error('[PETATOE Smart Hardening]', message, detail || '');
  }

  function safe(name, fn, fallback){
    try{ return fn(); }
    catch(e){ error(name + ' failed', e && (e.stack || e.message || e)); return fallback; }
  }

  function countSmartScripts(){
    var scripts = Array.prototype.slice.call(document.scripts || []);
    var bySrc = {};
    scripts.forEach(function(s){
      var src = s.getAttribute('src') || '';
      if(src.indexOf('smart/') !== -1){ bySrc[src] = (bySrc[src] || 0) + 1; }
    });
    var duplicates = Object.keys(bySrc).filter(function(src){ return bySrc[src] > 1; }).map(function(src){ return {src: src, count: bySrc[src]}; });
    return {totalSmartScripts: Object.keys(bySrc).length, duplicates: duplicates, bySrc: bySrc};
  }

  function smartSectionsState(){
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-smart-section]'));
    var active = sections.filter(function(s){ return s.classList.contains('active'); }).map(function(s){ return s.getAttribute('data-smart-section'); });
    return {
      total: sections.length,
      active: active,
      activeCount: active.length,
      duplicateActiveWarning: active.length > 1
    };
  }

  function chartState(){
    var charts = window.charts || {};
    var keys = Object.keys(charts);
    var detached = [];
    keys.forEach(function(k){
      var c = charts[k];
      var canvas = c && c.canvas;
      if(canvas && !document.documentElement.contains(canvas)) detached.push(k);
    });
    return {total: keys.length, detached: detached, detachedCount: detached.length};
  }

  function cleanupDetachedCharts(){
    return safe('cleanupDetachedCharts', function(){
      var charts = window.charts || {};
      var cleaned = [];
      Object.keys(charts).forEach(function(k){
        var c = charts[k];
        var canvas = c && c.canvas;
        if(canvas && !document.documentElement.contains(canvas)){
          try{ if(typeof c.destroy === 'function') c.destroy(); }catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('smart/smart-reports-hardening.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('smart/smart-reports-hardening.js',_petatoeSilentCatch);}}
          try{ delete charts[k]; }catch(_e){ charts[k] = null; }
          cleaned.push(k);
        }
      });
      return cleaned;
    }, []);
  }

  function cacheState(){
    var stats = null;
    if(typeof window.petatoeSmartDataEngineCacheStats === 'function'){
      stats = safe('petatoeSmartDataEngineCacheStats', function(){ return window.petatoeSmartDataEngineCacheStats(); }, null);
    }
    return stats || {available: false};
  }

  function functionAvailability(){
    var names = [
      'renderSmartReports',
      'renderSmartServicesReport',
      'renderSmartVans',
      'renderSmartCustomers',
      'renderReportsCenter',
      'petatoeSmartBenchmark',
      'petatoeSmartAuditReport',
      'petatoeSmartDataEngineCacheStats'
    ];
    return names.reduce(function(acc, name){ acc[name] = typeof window[name] === 'function'; return acc; }, {});
  }

  function recordsState(){
    var rows = [];
    try{
      if(window.PETATOESmartTabs && typeof window.PETATOESmartTabs.records === 'function') rows = window.PETATOESmartTabs.records();
      else if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function') rows = window.PETATOEDataSource.getRecordsSync();
    }catch(e){ error('recordsState failed', e && (e.message || e)); }
    return {count: Array.isArray(rows) ? rows.length : 0, sourceReady: Array.isArray(rows)};
  }

  function domState(){
    return {
      smartRootExists: !!document.getElementById('smart'),
      smartReportsScreenExists: !!document.getElementById('smartReportsScreen'),
      smartTabsExists: !!document.getElementById('smartTabs'),
      smartSections: document.querySelectorAll('[data-smart-section]').length,
      smartTables: document.querySelectorAll('#smart table,[data-smart-section] table').length,
      smartCanvases: document.querySelectorAll('#smart canvas,[data-smart-section] canvas').length
    };
  }

  function memoryState(){
    var m = performance && performance.memory ? performance.memory : null;
    if(!m) return {available: false};
    return {
      available: true,
      usedJSHeapSize: m.usedJSHeapSize,
      totalJSHeapSize: m.totalJSHeapSize,
      jsHeapSizeLimit: m.jsHeapSizeLimit
    };
  }

  function routeHealth(){
    var api = window.PETATOESmartTabs || (window.PETATOE && window.PETATOE.SmartReports) || null;
    return {
      namespaceReady: !!(api && api.__ready),
      phase: api && (api.__phase || api.phase || ''),
      hasSetSmartTab: !!(api && typeof api.setSmartTab === 'function'),
      globalSetSmartTab: typeof window.setSmartTab === 'function'
    };
  }

  function runHardeningReport(options){
    options = options || {};
    var t0 = now();
    var detachedBefore = chartState().detachedCount;
    var cleaned = [];
    if(options.cleanupDetachedCharts === true){ cleaned = cleanupDetachedCharts(); }
    var report = {
      version: state.version,
      phase: state.phase,
      uptimeMs: (Date.now ? Date.now() : +new Date()) - startedAt,
      generatedAt: new Date().toISOString(),
      route: routeHealth(),
      functions: functionAvailability(),
      scripts: countSmartScripts(),
      sections: smartSectionsState(),
      records: recordsState(),
      cache: cacheState(),
      charts: chartState(),
      dom: domState(),
      memory: memoryState(),
      cleanup: {
        detachedChartsBefore: detachedBefore,
        detachedChartsCleaned: cleaned.length,
        cleanedKeys: cleaned
      },
      warnings: state.warnings.slice(-20),
      errors: state.errors.slice(-20),
      durationMs: Math.round((now() - t0) * 100) / 100
    };

    if(report.scripts.duplicates && report.scripts.duplicates.length){ warn('Duplicate smart scripts detected', report.scripts.duplicates); }
    if(report.sections.duplicateActiveWarning){ warn('More than one smart section is active', report.sections.active); }
    if(report.charts.detachedCount){ warn('Detached smart charts detected', report.charts.detached); }

    state.lastReport = report;
    if(window.console && typeof console.table === 'function'){
      try{
        console.groupCollapsed('PETATOE Smart Reports Hardening Report');
        console.table({
          records: report.records.count,
          smartSections: report.sections.total,
          activeSections: report.sections.active.join(', ') || '-',
          charts: report.charts.total,
          detachedCharts: report.charts.detachedCount,
          duplicateScripts: report.scripts.duplicates.length,
          durationMs: report.durationMs
        });
        window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-reports-hardening.js",value:report});
        console.groupEnd();
      }catch(_e){ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-reports-hardening.js",value:report}); }
    }else if(window.console){ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-reports-hardening.js",value:report}); }
    return report;
  }

  function clearSmartRuntimeWarnings(){
    state.errors = [];
    state.warnings = [];
    return true;
  }

  window.petatoeSmartHardeningReport = runHardeningReport;
  window.petatoeSmartEnterpriseHealth = runHardeningReport;
  window.petatoeSmartCleanupDetachedCharts = cleanupDetachedCharts;
  window.petatoeSmartClearHardeningLog = clearSmartRuntimeWarnings;

  // Lightweight startup check only; no UI, no report rendering, no source/data mutation.
  setTimeout(function(){
    safe('startup hardening smoke check', function(){
      var scripts = countSmartScripts();
      if(scripts.duplicates.length) warn('Startup duplicate smart script warning', scripts.duplicates);
      var charts = chartState();
      if(charts.detachedCount) warn('Startup detached chart warning', charts.detached);
    });
  }, 1200);
})();
