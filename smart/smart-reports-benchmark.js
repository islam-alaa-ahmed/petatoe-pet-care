/* PETATOE v6.4.168 - Smart Reports Performance Benchmark A5.6.3
   SAFE DIAGNOSTIC ONLY:
   - Adds petatoeSmartBenchmark() for local runtime timing.
   - Does not change data source, report calculations, charts, filters, or UI.
*/
(function(){
  'use strict';
  if(window.__PETATOE_SMART_REPORTS_BENCHMARK_A563__) return;
  window.__PETATOE_SMART_REPORTS_BENCHMARK_A563__ = true;

  function now(){ try{return (window.performance&&performance.now)?performance.now():Date.now();}catch(e){return Date.now();} }
  function round(v){ v=Number(v||0); return isFinite(v)?Math.round(v*100)/100:0; }
  function sleep(ms){ return new Promise(function(resolve){ setTimeout(resolve, ms||0); }); }
  function idle(){
    return new Promise(function(resolve){
      try{
        if(window.requestIdleCallback) return requestIdleCallback(function(){resolve();},{timeout:220});
        if(window.requestAnimationFrame) return requestAnimationFrame(function(){resolve();});
      }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-benchmark.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
      setTimeout(resolve, 0);
    });
  }
  function safeArray(v){ return Array.isArray(v) ? v : []; }

  function getRecords(){
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){
        var rows = window.PETATOEDataSource.getRecordsSync();
        return Array.isArray(rows) ? rows : [];
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-benchmark.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return Array.isArray(window.records) ? window.records : [];
  }

  function getPerfRows(){ return safeArray(window.__PETATOE_SMART_PERF__).slice(); }
  function clearPerf(){
    try{ if(typeof window.petatoeSmartPerfClear === 'function') window.petatoeSmartPerfClear(); }
    catch(e){ window.__PETATOE_SMART_PERF__ = []; }
    try{ if(typeof window.petatoeSmartAuditClear === 'function') window.petatoeSmartAuditClear(); }
    catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-benchmark.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    if(!Array.isArray(window.__PETATOE_SMART_PERF__)) window.__PETATOE_SMART_PERF__ = [];
  }
  function perfGroupsSince(startIndex){
    var rows = getPerfRows().slice(startIndex || 0);
    var map = Object.create(null);
    rows.forEach(function(r){
      var name = String(r && r.name || 'unknown');
      var ms = Number(r && r.ms || 0); if(!isFinite(ms)) ms = 0;
      if(!map[name]) map[name] = {name:name,count:0,totalMs:0,maxMs:0,lastMs:0};
      var g = map[name]; g.count++; g.totalMs += ms; g.maxMs = Math.max(g.maxMs, ms); g.lastMs = ms;
    });
    return Object.keys(map).map(function(k){
      var g = map[k];
      return {name:g.name,count:g.count,totalMs:round(g.totalMs),avgMs:round(g.totalMs/Math.max(1,g.count)),maxMs:round(g.maxMs),lastMs:round(g.lastMs)};
    }).sort(function(a,b){ return b.totalMs-a.totalMs; });
  }

  function measure(label, fn){
    return Promise.resolve().then(idle).then(function(){
      var startPerf = getPerfRows().length;
      var t0 = now();
      var result;
      try{ result = fn && fn(); }
      catch(e){ return idle().then(function(){ return {label:label,ok:false,error:String(e && e.message || e),ms:round(now()-t0),perfGroups:perfGroupsSince(startPerf)}; }); }
      return Promise.resolve(result).then(idle).then(function(){
        return {label:label,ok:true,ms:round(now()-t0),perfGroups:perfGroupsSince(startPerf)};
      }, function(e){
        return idle().then(function(){ return {label:label,ok:false,error:String(e && e.message || e),ms:round(now()-t0),perfGroups:perfGroupsSince(startPerf)}; });
      });
    });
  }

  function routeTab(tab){
    if(window.PETATOE && window.PETATOE.SmartReports && typeof window.PETATOE.SmartReports.setSmartTab === 'function'){
      window.PETATOE.SmartReports.setSmartTab(tab);
      return true;
    }
    if(typeof window.setSmartTab === 'function'){
      window.setSmartTab(tab);
      return true;
    }
    return false;
  }

  function clickFirst(selector){
    var el = null;
    try{ el = document.querySelector(selector); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-benchmark.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    if(el && typeof el.click === 'function'){ el.click(); return true; }
    return false;
  }

  function getCacheStats(){
    try{
      if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.getCacheStats === 'function'){
        return window.PETATOESmartDataEngine.getCacheStats();
      }
    }catch(e){ return {error:String(e && e.message || e)}; }
    return {available:false};
  }

  function runAuditSilent(){
    try{ if(typeof window.petatoeSmartAuditReport === 'function') return window.petatoeSmartAuditReport({silent:true}); }
    catch(e){ return {error:String(e && e.message || e)}; }
    return {available:false};
  }

  function buildEngine(force){
    var rows = getRecords();
    if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.buildSmartData === 'function'){
      return window.PETATOESmartDataEngine.buildSmartData(rows, {force:!!force});
    }
    return null;
  }

  async function petatoeSmartBenchmark(options){
    options = options || {};
    var clear = options.clear !== false;
    if(clear) clearPerf();
    var startedAt = new Date().toISOString();
    var records = getRecords();
    var steps = [];

    steps.push(await measure('engine.build.force', function(){ return buildEngine(true); }));
    steps.push(await measure('engine.build.cache', function(){ return buildEngine(false); }));

    steps.push(await measure('dashboard.smartReports.fullRender', function(){
      if(typeof window.renderSmartReports === 'function') return window.renderSmartReports();
      return false;
    }));

    steps.push(await measure('tab.services.open', function(){ return routeTab('services'); }));
    steps.push(await measure('tab.vehicles.open', function(){ return routeTab('vehicles'); }));
    steps.push(await measure('tab.customers.open', function(){ return routeTab('customers'); }));
    steps.push(await measure('tab.advanced.open', function(){ return routeTab('advanced'); }));

    if(options.includeFilterClicks !== false){
      steps.push(await measure('filter.services.firstButton', function(){
        return clickFirst('[data-smart-action="service-year"], [data-action="service-year"], [data-service-year], #smartServices [data-year], [data-smart-section="services"] [data-year]');
      }));
      steps.push(await measure('filter.vehicles.firstButton', function(){
        return clickFirst('[data-smart-action*="van"], [data-smart-action*="vehicle"], [data-action*="van"], [data-smart-section="vehicles"] [data-year]');
      }));
      steps.push(await measure('filter.customers.firstButton', function(){
        return clickFirst('[data-smart-action="new-customer-year"], [data-smart-action="inactive-year"], [data-smart-section="customers"] [data-year]');
      }));
    }

    var audit = runAuditSilent();
    var cache = getCacheStats();
    var perfRows = getPerfRows();
    var summary = {
      version:'v6.4.168-A5.6.3',
      generatedAt:new Date().toISOString(),
      startedAt:startedAt,
      records:records.length,
      totalMeasuredMs:round(steps.reduce(function(s,x){return s+(x.ms||0);},0)),
      failedSteps:steps.filter(function(x){return !x.ok;}).map(function(x){return {label:x.label,error:x.error};}),
      perfEvents:perfRows.length,
      cache:cache,
      auditSummary:audit && audit.summary ? audit.summary : audit
    };
    var report = {summary:summary, steps:steps, perfGroups:perfGroupsSince(0), audit:audit};

    try{
      console.group('PETATOE Smart Reports Benchmark '+summary.version);
      window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-reports-benchmark.js",value:'Summary', summary});
      console.table(steps.map(function(s){ return {step:s.label, ok:s.ok, ms:s.ms, error:s.error||''}; }));
      console.groupCollapsed('Performance Groups'); console.table(report.perfGroups); console.groupEnd();
      console.groupEnd();
    }catch(e){ try{ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-reports-benchmark.js",value:report}); }catch(_e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-benchmark.js', _e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } } }
    return report;
  }

  window.petatoeSmartBenchmark = petatoeSmartBenchmark;
  window.petatoeSmartBenchmarkClear = clearPerf;
})();
