/* PETATOE v6.4.167 - Smart Reports Enterprise Audit A5.6.2
   SAFE DIAGNOSTIC ONLY:
   - Adds petatoeSmartAuditReport() for runtime inspection.
   - Does not change Smart Reports data source, UI, filters, charts, or render logic.
*/
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_AUDIT_A562__) return;
  window.__PETATOE_SMART_REPORTS_AUDIT_A562__ = true;

  var auditState = window.__PETATOE_SMART_AUDIT__ = window.__PETATOE_SMART_AUDIT__ || {
    version: 'v6.4.167-A5.6.2',
    startedAt: Date.now(),
    chartCalls: 0,
    chartById: Object.create(null),
    chartLastAt: Object.create(null),
    routeCalls: Object.create(null),
    fullRenderCalls: 0,
    wrappers: Object.create(null)
  };

  function now(){ try{return (window.performance&&performance.now)?performance.now():Date.now();}catch(e){return Date.now();} }
  function safeArray(v){ return Array.isArray(v) ? v : []; }
  function asNumber(v){ v=Number(v||0); return isFinite(v)?v:0; }
  function round(v){ return Math.round(asNumber(v)*100)/100; }
  function inc(map,key){ key=String(key||'unknown'); map[key]=(map[key]||0)+1; return map[key]; }

  function getRecords(){
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){
        var rows = window.PETATOEDataSource.getRecordsSync();
        return Array.isArray(rows) ? rows : [];
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-audit.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return Array.isArray(window.records) ? window.records : [];
  }

  function summarizePerf(rows){
    var groups = Object.create(null);
    safeArray(rows).forEach(function(item){
      var name = String(item && item.name || 'unknown');
      if(!groups[name]) groups[name] = {name:name,count:0,totalMs:0,maxMs:0,lastMs:0,lastAt:0};
      var g = groups[name];
      var ms = asNumber(item && item.ms);
      g.count += 1;
      g.totalMs += ms;
      g.maxMs = Math.max(g.maxMs, ms);
      g.lastMs = ms;
      g.lastAt = item && item.at || 0;
    });
    return Object.keys(groups).map(function(k){
      var g = groups[k];
      return {
        name:g.name,
        count:g.count,
        totalMs:round(g.totalMs),
        avgMs:round(g.totalMs / Math.max(1,g.count)),
        maxMs:round(g.maxMs),
        lastMs:round(g.lastMs),
        lastAt:g.lastAt
      };
    }).sort(function(a,b){ return (b.totalMs-a.totalMs) || (b.maxMs-a.maxMs); });
  }

  function getCacheStats(){
    try{
      if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.getCacheStats === 'function'){
        return window.PETATOESmartDataEngine.getCacheStats();
      }
    }catch(e){ return {error:String(e&&e.message||e)}; }
    return {available:false};
  }

  function getChartsStats(){
    var liveCharts = [];
    try{ liveCharts = Object.keys(window.charts || {}); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-audit.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    var byId = Object.keys(auditState.chartById || {}).map(function(id){
      return {id:id,calls:auditState.chartById[id]||0,lastAt:auditState.chartLastAt[id]||0,live:liveCharts.indexOf(id)!==-1};
    }).sort(function(a,b){ return b.calls-a.calls; });
    return {
      totalCalls:auditState.chartCalls||0,
      uniqueChartIds:byId.length,
      liveCount:liveCharts.length,
      liveIds:liveCharts,
      byId:byId
    };
  }

  function getDomStats(){
    try{
      return {
        smartSections: document.querySelectorAll('[data-smart-section], .smart-tab-section').length,
        activeSmartSections: document.querySelectorAll('[data-smart-section].active, .smart-tab-section.active').length,
        smartCanvases: document.querySelectorAll('#smartReports canvas, .smart-reports canvas, canvas[id*="Chart"]').length,
        smartTables: document.querySelectorAll('#smartReports table, .smart-reports table, .smart-panel table').length,
        smartButtons: document.querySelectorAll('#smartReports button, .smart-reports button, [data-smart-action]').length
      };
    }catch(e){ return {error:String(e&&e.message||e)}; }
  }

  function getRoutingStats(perfRows){
    var routes = Object.create(null);
    safeArray(perfRows).forEach(function(item){
      var name = String(item && item.name || '');
      if(name.indexOf('SmartReports.route.') === 0){
        var key = name.replace('SmartReports.route.','');
        if(!routes[key]) routes[key] = {tab:key,count:0,totalMs:0,maxMs:0,lastMs:0};
        var r = routes[key];
        var ms = asNumber(item.ms);
        r.count += 1; r.totalMs += ms; r.maxMs = Math.max(r.maxMs,ms); r.lastMs = ms;
      }
    });
    return Object.keys(routes).map(function(k){
      var r = routes[k];
      return {tab:r.tab,count:r.count,totalMs:round(r.totalMs),avgMs:round(r.totalMs/Math.max(1,r.count)),maxMs:round(r.maxMs),lastMs:round(r.lastMs)};
    }).sort(function(a,b){return b.totalMs-a.totalMs;});
  }

  function getWarnings(summary, cache, charts, dom, recordsCount){
    var warnings = [];
    var full = summary.filter(function(x){return x.name === 'SmartReports.fullRender.total' || x.name === 'SmartReports.legacyFullRender';});
    full.forEach(function(x){ if(x.count > 1) warnings.push('Full render تكرر '+x.count+' مرة: '+x.name); });
    var build = summary.filter(function(x){return x.name === 'SmartDataEngine.build';})[0];
    var hit = summary.filter(function(x){return x.name === 'SmartDataEngine.cacheHit';})[0];
    if(build && hit && build.count > hit.count + 2) warnings.push('Build Engine أعلى من Cache Hit؛ راجع تكرار بناء المحرك.');
    if(build && build.maxMs > 500) warnings.push('زمن بناء Smart Data Engine مرتفع: '+build.maxMs+'ms');
    if(charts.totalCalls > 0 && charts.uniqueChartIds > 0 && charts.totalCalls > charts.uniqueChartIds * 6) warnings.push('استدعاءات الشارت كثيرة مقارنة بعدد الشارتات: '+charts.totalCalls+' call.');
    if(dom.activeSmartSections > 2) warnings.push('أكثر من تبويب Smart نشط في نفس الوقت: '+dom.activeSmartSections);
    if(recordsCount > 0 && (!cache || cache.hasBaseCache === false)) warnings.push('يوجد فواتير لكن Base Cache غير مبني.');
    return warnings;
  }

  function printReport(report){
    try{
      console.group('PETATOE Smart Reports Enterprise Audit '+report.version);
      window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info('smart-reports-audit.summary',{value:report.summary});
      window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info('smart-reports-audit.dataEngine',{value:report.dataEngine});
      window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info('smart-reports-audit.charts',{value:report.charts});
      window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info('smart-reports-audit.dom',{value:report.dom});
      if(report.warnings && report.warnings.length) console.warn('Warnings', report.warnings);
      console.groupCollapsed('Performance Groups');
      console.table(report.performanceGroups);
      console.groupEnd();
      if(report.routes && report.routes.length){ console.groupCollapsed('Route Timings'); console.table(report.routes); console.groupEnd(); }
      console.groupEnd();
    }catch(e){ try{ console.log(report); }catch(_e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-audit.js', _e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } } }
  }

  function petatoeSmartAuditReport(options){
    options = options || {};
    var t0 = now();
    var records = getRecords();
    if(options.rebuild === true){
      try{ if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.buildSmartData === 'function') window.PETATOESmartDataEngine.buildSmartData(records, {force:true}); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-audit.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    }
    var perfRows = safeArray(window.__PETATOE_SMART_PERF__).slice();
    var perfGroups = summarizePerf(perfRows);
    var cache = getCacheStats();
    var charts = getChartsStats();
    var dom = getDomStats();
    var routes = getRoutingStats(perfRows);
    var summary = {
      records: records.length,
      perfEvents: perfRows.length,
      cacheHitEvents: perfGroups.filter(function(x){return x.name==='SmartDataEngine.cacheHit';}).reduce(function(s,x){return s+x.count;},0),
      engineBuildEvents: perfGroups.filter(function(x){return x.name==='SmartDataEngine.build';}).reduce(function(s,x){return s+x.count;},0),
      fullRenderEvents: perfGroups.filter(function(x){return x.name==='SmartReports.fullRender.total' || x.name==='SmartReports.legacyFullRender';}).reduce(function(s,x){return s+x.count;},0),
      routeEvents: routes.reduce(function(s,x){return s+x.count;},0),
      generatedInMs: round(now()-t0)
    };
    var report = {
      version:'v6.4.167-A5.6.2',
      generatedAt:new Date().toISOString(),
      summary:summary,
      dataEngine:cache,
      charts:charts,
      dom:dom,
      routes:routes,
      performanceGroups:perfGroups,
      recentEvents:perfRows.slice(-25),
      warnings:getWarnings(perfGroups, cache, charts, dom, records.length)
    };
    if(options.silent !== true) printReport(report);
    return report;
  }

  function wrapChart(){
    try{
      if(typeof window.chart !== 'function' || window.chart.__petatoeSmartAuditWrapped) return !!(window.chart && window.chart.__petatoeSmartAuditWrapped);
      var original = window.chart;
      window.chart = function petatoeSmartAuditChart(id, config){
        auditState.chartCalls += 1;
        inc(auditState.chartById, id || 'unknown');
        auditState.chartLastAt[id || 'unknown'] = Date.now();
        return original.apply(this, arguments);
      };
      window.chart.__petatoeSmartAuditWrapped = true;
      return true;
    }catch(e){ return false; }
  }

  function ensureWrappers(){
    wrapChart();
  }

  ensureWrappers();
  var tries = 0;
  var timer = setInterval(function(){
    tries += 1;
    ensureWrappers();
    if(tries > 30 || (window.chart && window.chart.__petatoeSmartAuditWrapped)) clearInterval(timer);
  }, 250);

  window.petatoeSmartAuditReport = petatoeSmartAuditReport;
  window.petatoeSmartAuditClear = function(){
    window.__PETATOE_SMART_PERF__ = [];
    auditState.chartCalls = 0;
    auditState.chartById = Object.create(null);
    auditState.chartLastAt = Object.create(null);
    return true;
  };
})();
